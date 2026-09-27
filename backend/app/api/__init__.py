from fastapi import APIRouter

from app.api.v1 import ai, engagement, families, health, medicines, notifications, parents, reports
from app.api.v1.auth import router as auth_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(families.router)
api_router.include_router(parents.router)
api_router.include_router(health.router)
api_router.include_router(medicines.router)
api_router.include_router(engagement.router)
api_router.include_router(engagement.legacy_router)
api_router.include_router(reports.router)
api_router.include_router(notifications.router)
api_router.include_router(ai.router)