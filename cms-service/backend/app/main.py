from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .config import get_settings
from .routers.sites import router as sites_router
from .routers.pages import router as pages_router
from .routers.templates import router as templates_router
from .routers.media import router as media_router

settings = get_settings()

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="CMS Service", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in (settings.ALLOW_ORIGINS or "*").split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sites_router)
app.include_router(pages_router)
app.include_router(templates_router)
app.include_router(media_router)


@app.get("/")
def root():
    return {"name": settings.APP_NAME, "status": "ok"}
