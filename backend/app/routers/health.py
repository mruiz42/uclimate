from fastapi import APIRouter

router = APIRouter(tags=["meta"])


@router.get("/health", summary="Liveness check")
async def health() -> dict[str, str]:
    return {"status": "ok"}
