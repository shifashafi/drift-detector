from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from routers import test_cases, runs, drift
from core.database import init_db
from core.scheduler import start_scheduler, stop_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    start_scheduler()
    yield
    stop_scheduler()


app = FastAPI(
    title="Behavioral Drift Detector",
    description="Detect when your LLM starts behaving differently over time",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(test_cases.router, prefix="/api/test-cases", tags=["Test Cases"])
app.include_router(runs.router, prefix="/api/runs", tags=["Runs"])
app.include_router(drift.router, prefix="/api/drift", tags=["Drift"])


@app.get("/health")
async def health():
    return {"status": "ok"}
