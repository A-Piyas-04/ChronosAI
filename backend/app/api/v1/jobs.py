from fastapi import APIRouter, Depends

from app.core.config import settings
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.job import JobStatusResponse
from app.workers.celery_app import celery_app

router = APIRouter()


@router.get("/{task_id}", response_model=JobStatusResponse)
async def get_job_status(
    task_id: str,
    _: User = Depends(get_current_user),
) -> JobStatusResponse:
    result = celery_app.AsyncResult(task_id)
    state = result.state
    error_detail = None
    if state == "FAILURE":
        error_detail = str(result.result) if settings.APP_ENV == "development" else "Task failed"
    result_payload = result.result if state == "SUCCESS" and isinstance(result.result, dict) else None
    return JobStatusResponse(
        task_id=task_id,
        status=state,
        result=result_payload,
        error=error_detail,
    )
