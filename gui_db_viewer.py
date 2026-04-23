"""
ChronosAI — GUI Database Viewer
Structure mirrors the Nexus-Ride db viewer (DBViewerApp, TABLE_MAP, ttk, cascade delete).
Data layer uses `docker exec chronos_db psql` — no TCP connection, no password needed.
Column names come from SQLAlchemy mapper metadata (zero DB connection).
"""

import sys
import csv
import io
import subprocess
import threading
import re
from pathlib import Path

import tkinter as tk
from tkinter import ttk, messagebox
from sqlalchemy import inspect as sa_inspect


# ── Path / model setup ────────────────────────────────────────────────────────
_SCRIPT_DIR  = Path(__file__).resolve().parent
_BACKEND_DIR = _SCRIPT_DIR / "backend"
sys.path.insert(0, str(_BACKEND_DIR))

from app.models.user             import User
from app.models.user_preferences import UserPreferences
from app.models.connected_calendar import ConnectedCalendar
from app.models.calendar_event   import CalendarEvent
from app.models.task             import Task
from app.models.schedule         import Schedule
from app.models.schedule_session import ScheduleSession
from app.models.session_log      import SessionLog


# ── TABLE_MAP: sidebar label → model class ────────────────────────────────────
TABLE_MAP = {
    "User":              User,
    "UserPreferences":   UserPreferences,
    "ConnectedCalendar": ConnectedCalendar,
    "CalendarEvent":     CalendarEvent,
    "Task":              Task,
    "Schedule":          Schedule,
    "ScheduleSession":   ScheduleSession,
    "SessionLog":        SessionLog,
}

# ── Docker / psql settings ────────────────────────────────────────────────────
_COMPOSE = _SCRIPT_DIR / "docker-compose.yml"

def _db_compose_settings() -> tuple[str, str, str]:
    """
    Extract DB settings from only the `db` service in docker-compose.yml.
    Avoids accidentally reading `container_name` from other services.
    """
    container = "chronos_db"
    user = "chronos_user"
    dbname = "chronos_db"
    if not _COMPOSE.exists():
        return container, user, dbname

    in_db_service = False
    in_db_env = False
    for raw in _COMPOSE.read_text(encoding="utf-8").splitlines():
        line = raw.rstrip()
        stripped = line.strip()

        if stripped == "db:" and line.startswith("  "):
            in_db_service = True
            in_db_env = False
            continue

        # Reached another top-level service entry.
        if in_db_service and line.startswith("  ") and not line.startswith("    ") and stripped.endswith(":"):
            break

        if not in_db_service:
            continue

        if stripped.startswith("container_name:"):
            container = stripped.split(":", 1)[1].strip()
            continue

        if stripped == "environment:":
            in_db_env = True
            continue

        if in_db_env:
            if line.startswith("      ") and ":" in stripped:
                key, val = stripped.split(":", 1)
                val = val.strip()
                if key == "POSTGRES_USER":
                    user = val
                elif key == "POSTGRES_DB":
                    dbname = val
            elif stripped:
                in_db_env = False

    return container, user, dbname

CONTAINER, DB_USER, DB_NAME = _db_compose_settings()


# ── psql helpers (all DB access goes through docker exec) ─────────────────────
def _psql(sql: str, timeout: int = 20) -> tuple:
    """Returns (columns: list[str], rows: list[list[str]], error: str)."""
    cmd = ["docker", "exec", CONTAINER,
           "psql", "-U", DB_USER, "-d", DB_NAME,
           "--csv", "--no-psqlrc", "--no-align", "-c", sql]
    try:
        proc = subprocess.run(cmd, capture_output=True, text=True,
                              timeout=timeout, encoding="utf-8", errors="replace")
        if proc.returncode != 0:
            return [], [], (proc.stderr.strip() or proc.stdout.strip())
        all_rows = list(csv.reader(io.StringIO(proc.stdout)))
        if not all_rows:
            return [], [], ""
        return all_rows[0], all_rows[1:], ""
    except FileNotFoundError:
        return [], [], "Docker CLI not found."
    except subprocess.TimeoutExpired:
        return [], [], f"Query timed out after {timeout}s."
    except Exception as exc:
        return [], [], str(exc)


def _psql_exec(sql: str, timeout: int = 10) -> str:
    """Run non-SELECT SQL. Returns error string or ''."""
    cmd = ["docker", "exec", CONTAINER,
           "psql", "-U", DB_USER, "-d", DB_NAME,
           "--no-psqlrc", "-c", sql]
    try:
        proc = subprocess.run(cmd, capture_output=True, text=True,
                              timeout=timeout, encoding="utf-8", errors="replace")
        return "" if proc.returncode == 0 else (proc.stderr.strip() or proc.stdout.strip())
    except FileNotFoundError:
        return "Docker CLI not found."
    except subprocess.TimeoutExpired:
        return "Command timed out."
    except Exception as exc:
        return str(exc)


def _check_docker() -> str:
    """Return '' if container is reachable, else an error message."""
    try:
        proc = subprocess.run(
            ["docker", "exec", CONTAINER,
             "psql", "-U", DB_USER, "-d", DB_NAME, "-c", "SELECT 1"],
            capture_output=True, text=True, timeout=8)
        return "" if proc.returncode == 0 else proc.stderr.strip()
    except FileNotFoundError:
        return "Docker CLI not found. Is Docker Desktop running?"
    except subprocess.TimeoutExpired:
        return f"Container '{CONTAINER}' did not respond in time."
    except Exception as exc:
        return str(exc)


# ── Column names from mapper (NO DB connection needed) ────────────────────────
def _model_columns(model) -> list[str]:
    return [attr.key for attr in sa_inspect(model).mapper.column_attrs]


# ── FK cascade helpers (via docker exec) ─────────────────────────────────────
def _get_fk_children(table_name: str) -> list[tuple]:
    """
    Return list of (child_table, child_col, parent_col) for all FKs referencing table_name.
    """
    _, rows, _ = _psql(f"""
        SELECT kcu.table_name, kcu.column_name, ccu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
         AND tc.table_schema    = kcu.table_schema
        JOIN information_schema.constraint_column_usage ccu
          ON ccu.constraint_name = tc.constraint_name
         AND ccu.table_schema    = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND ccu.table_name  = '{table_name}'
          AND tc.table_schema = 'public'
    """)
    return [(r[0], r[1], r[2]) for r in rows if len(r) == 3]


def _delete_cascade(table_name: str, col: str, val: str, visited: set):
    key = (table_name, col, val)
    if key in visited:
        return
    visited.add(key)
    for child_tbl, child_col, parent_col in _get_fk_children(table_name):
        if parent_col != col:
            continue
        _, child_rows, _ = _psql(
            f'SELECT "{child_col}" FROM "{child_tbl}" '
            f'WHERE "{child_col}" = \'{val.replace(chr(39), chr(39)*2)}\''
        )
        for cr in child_rows:
            if cr:
                _delete_cascade(child_tbl, child_col, cr[0], visited)
    safe = val.replace("'", "''")
    _psql_exec(f'DELETE FROM "{table_name}" WHERE "{col}" = \'{safe}\'')


# ─────────────────────────────────────────────────────────────────────────────
class DBViewerApp:
    def __init__(self, root: tk.Tk):
        self.root = root
        self.root.title("ChronosAI — DB Viewer")
        self.root.geometry("1280x720")

        # State
        self.current_data    = []
        self.current_rows    = []
        self.current_columns = []
        self.sort_column     = None
        self.sort_reverse    = False
        self.row_data_map    = {}   # tree item_id → row dict

        self._build_ui()
        # Probe docker in background so window appears instantly
        threading.Thread(target=self._probe_docker, daemon=True).start()

    # ── Docker probe ──────────────────────────────────────────────────────────
    def _probe_docker(self):
        err = _check_docker()
        if err:
            self.root.after(0, lambda: self._show_docker_error(err))
        else:
            self.root.after(0, self._on_docker_ready)

    def _show_docker_error(self, msg: str):
        self.status_var.set(f"Docker error: {msg}")
        messagebox.showerror(
            "Cannot reach database",
            f"Container '{CONTAINER}' is not accessible.\n\n{msg}\n\n"
            "Make sure Docker is running and `docker-compose up` has been run."
        )

    def _on_docker_ready(self):
        self.status_var.set(f"Connected — {DB_USER}@{CONTAINER}/{DB_NAME}")

    # ── UI ────────────────────────────────────────────────────────────────────
    def _build_ui(self):
        # tk.PanedWindow with explicit widths renders correctly on Windows;
        # ttk.PanedWindow weight-only collapses panels to 0 until resized.
        self.paned = tk.PanedWindow(self.root, orient=tk.HORIZONTAL,
                                    sashrelief=tk.RAISED, sashwidth=5)
        self.paned.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        self._build_left_panel()
        self._build_right_panel()

    def _build_left_panel(self):
        left = ttk.Frame(self.paned)
        self.paned.add(left, minsize=160, width=200)

        ttk.Label(left, text="Select Table",
                  font=("Arial", 10, "bold")).pack(pady=5)

        self.table_listbox = tk.Listbox(left, selectmode=tk.SINGLE,
                                        font=("Arial", 10))
        self.table_listbox.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        self.table_listbox.bind("<<ListboxSelect>>", self.on_table_select)

        for name in sorted(TABLE_MAP.keys()):
            self.table_listbox.insert(tk.END, name)

    def _build_right_panel(self):
        right = ttk.Frame(self.paned)
        self.paned.add(right, minsize=400)

        # control bar
        ctrl = ttk.Frame(right)
        ctrl.pack(fill=tk.X, padx=5, pady=5)

        self.lbl_table = ttk.Label(ctrl, text="Select a table to view data",
                                   font=("Arial", 11, "bold"))
        self.lbl_table.pack(side=tk.LEFT, pady=5)

        ttk.Button(ctrl, text="↻ Refresh",
                   command=self.refresh_current_table).pack(side=tk.RIGHT, padx=5)
        ttk.Button(ctrl, text="Delete Selected",
                   command=self.delete_selected_rows).pack(side=tk.RIGHT, padx=5)

        self.search_var = tk.StringVar()
        self.search_var.trace("w", self.filter_data)
        ttk.Entry(ctrl, textvariable=self.search_var, width=30).pack(side=tk.RIGHT, padx=5)
        ttk.Label(ctrl, text="Search:").pack(side=tk.RIGHT)

        # treeview
        tree_frame = ttk.Frame(right)
        tree_frame.pack(fill=tk.BOTH, expand=True, padx=5)

        vsb = ttk.Scrollbar(tree_frame, orient=tk.VERTICAL)
        hsb = ttk.Scrollbar(tree_frame, orient=tk.HORIZONTAL)
        self.tree = ttk.Treeview(tree_frame, show="headings",
                                 yscrollcommand=vsb.set,
                                 xscrollcommand=hsb.set)
        vsb.config(command=self.tree.yview)
        hsb.config(command=self.tree.xview)
        vsb.pack(side=tk.RIGHT, fill=tk.Y)
        hsb.pack(side=tk.BOTTOM, fill=tk.X)
        self.tree.pack(fill=tk.BOTH, expand=True)

        # status bar
        self.status_var = tk.StringVar(value="Connecting to database…")
        ttk.Label(right, textvariable=self.status_var,
                  relief=tk.SUNKEN, anchor=tk.W).pack(fill=tk.X, padx=5, pady=2)

    # ── Event handlers ────────────────────────────────────────────────────────
    def on_table_select(self, _event=None):
        sel = self.table_listbox.curselection()
        if sel:
            self.load_table_data(self.table_listbox.get(sel[0]))

    def refresh_current_table(self):
        sel = self.table_listbox.curselection()
        if sel:
            self.load_table_data(self.table_listbox.get(sel[0]))
        else:
            messagebox.showinfo("Info", "Please select a table first.")

    # ── Load / display ────────────────────────────────────────────────────────
    def load_table_data(self, table_name: str):
        self.status_var.set(f"Loading {table_name}…")
        self.root.update_idletasks()

        self.tree.delete(*self.tree.get_children())
        self.tree["columns"] = []
        self.search_var.set("")
        self.sort_column  = None
        self.sort_reverse = False

        model = TABLE_MAP.get(table_name)
        if not model:
            return

        self.lbl_table.config(text=f"Table: {table_name}")
        threading.Thread(target=self._fetch_thread,
                         args=(table_name, model), daemon=True).start()

    def _fetch_thread(self, table_name: str, model):
        try:
            # Column names from mapper — no DB needed
            columns = _model_columns(model)

            # Actual data via docker exec
            _, rows, err = _psql(f'SELECT * FROM "{model.__tablename__}" LIMIT 5000')
            if err:
                self.root.after(0, lambda: messagebox.showerror("Query Error", err))
                self.root.after(0, lambda: self.status_var.set(f"Error loading {table_name}"))
                return

            # Build display lists using mapper column order
            data, row_dicts = [], []
            for raw in rows:
                # rows from psql --csv match SELECT * column order
                # align by index since we queried SELECT *
                d = dict(zip(columns, raw)) if len(raw) == len(columns) else {}
                if not d:
                    # fallback: zip what we have
                    d = {columns[i]: raw[i] for i in range(min(len(columns), len(raw)))}
                row_dicts.append(d)
                data.append([d.get(c, "") for c in columns])

            _cols, _data, _rows = columns, data, row_dicts
            self.root.after(0, lambda: self._populate_ui(table_name, _cols, _data, _rows))

        except Exception as exc:
            err_msg = str(exc)
            self.root.after(0, lambda: messagebox.showerror("Error", err_msg))

    def _populate_ui(self, table_name, columns, data, row_dicts):
        self.current_columns = columns
        self.current_data    = data
        self.current_rows    = row_dicts

        self._setup_columns(columns)
        self._populate_tree(data, row_dicts)
        self.status_var.set(f"Loaded {len(data)} records from {table_name}")

    def _setup_columns(self, columns: list):
        self.tree["columns"] = columns
        for col in columns:
            self.tree.heading(col, text=col,
                              command=lambda c=col: self.sort_by_column(c))
            width = max(100, min(300, len(col) * 12))
            self.tree.column(col, width=width, anchor=tk.W)

    def _populate_tree(self, data: list, row_dicts: list):
        self.tree.delete(*self.tree.get_children())
        self.row_data_map = {}
        for values, rd in zip(data, row_dicts):
            iid = self.tree.insert("", tk.END, values=values)
            self.row_data_map[iid] = rd

    # ── Search ────────────────────────────────────────────────────────────────
    def filter_data(self, *_args):
        q = self.search_var.get().lower()
        if not q:
            self._populate_tree(self.current_data, self.current_rows)
            self.status_var.set(f"Showing all {len(self.current_data)} records")
            return
        fd, fr = [], []
        for row, rd in zip(self.current_data, self.current_rows):
            if any(q in str(c).lower() for c in row):
                fd.append(row); fr.append(rd)
        self._populate_tree(fd, fr)
        self.status_var.set(f"Found {len(fd)} matching records")

    # ── Sort ──────────────────────────────────────────────────────────────────
    def sort_by_column(self, col: str):
        if not self.current_data:
            return
        try:
            col_idx = self.current_columns.index(col)
        except ValueError:
            return

        if self.sort_column == col:
            self.sort_reverse = not self.sort_reverse
        else:
            self.sort_column  = col
            self.sort_reverse = False

        def sort_key(pair):
            val = pair[1].get(col)
            try:
                return (0, float(val))
            except (TypeError, ValueError):
                return (1, str(val).lower())

        combined = sorted(zip(self.current_data, self.current_rows),
                          key=sort_key, reverse=self.sort_reverse)
        if combined:
            self.current_data, self.current_rows = map(list, zip(*combined))
        else:
            self.current_data, self.current_rows = [], []

        for c in self.current_columns:
            arrow = (" ↓" if self.sort_reverse else " ↑") if c == col else ""
            self.tree.heading(c, text=c + arrow)

        self.filter_data()

    # ── Delete (cascade) ──────────────────────────────────────────────────────
    def delete_selected_rows(self):
        selection = self.tree.selection()
        if not selection:
            messagebox.showinfo("Info", "Please select one or more rows to delete.")
            return

        tbl_sel = self.table_listbox.curselection()
        if not tbl_sel:
            messagebox.showinfo("Info", "Please select a table first.")
            return

        table_name = self.table_listbox.get(tbl_sel[0])
        model      = TABLE_MAP.get(table_name)
        if not model:
            return

        # Find the primary key column
        pk_cols = [
            col.key for col in sa_inspect(model).mapper.column_attrs
            if any(c.primary_key for c in sa_inspect(model).mapper.columns[col.key].columns)
        ]
        if not pk_cols:
            messagebox.showerror("Error", "Cannot delete: no primary key found.")
            return
        pk_col = pk_cols[0]

        if pk_col not in self.current_columns:
            messagebox.showerror("Error", f"Primary key column '{pk_col}' not in current view.")
            return
        pk_idx = self.current_columns.index(pk_col)

        if not messagebox.askyesno(
            "Confirm Delete",
            f"Delete {len(selection)} row(s) from {table_name}?\n"
            "Related rows will also be removed."
        ):
            return

        pk_values = [self.tree.item(iid, "values")[pk_idx] for iid in selection]

        def do_delete():
            visited = set()
            for val in pk_values:
                _delete_cascade(model.__tablename__, pk_col, str(val), visited)
            self.root.after(0, lambda: self._after_delete(table_name, len(selection)))

        threading.Thread(target=do_delete, daemon=True).start()

    def _after_delete(self, table_name: str, count: int):
        self.load_table_data(table_name)
        self.status_var.set(f"Deleted {count} row(s) from {table_name}")


# ── Entry point ───────────────────────────────────────────────────────────────
def main():
    try:
        root = tk.Tk()
        DBViewerApp(root)
        root.mainloop()
    except Exception as exc:
        print(f"Failed to start: {exc}")
        input("Press Enter to exit…")


if __name__ == "__main__":
    main()
