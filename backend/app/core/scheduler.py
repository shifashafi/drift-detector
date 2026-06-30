import asyncio
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger

_scheduler = BackgroundScheduler()


def _run_evals_sync():
    """Bridge sync scheduler → async runner."""
    from app.services.runner import run_eval_suite
    asyncio.run(run_eval_suite())


def start_scheduler(interval_minutes: int = 30):
    """Run the full eval suite every N minutes."""
    _scheduler.add_job(
        _run_evals_sync,
        trigger=IntervalTrigger(minutes=interval_minutes),
        id="eval_suite",
        replace_existing=True,
        max_instances=1,   # never overlap runs
    )
    _scheduler.start()
    print(f"[scheduler] Eval suite will run every {interval_minutes} minutes")


def stop_scheduler():
    _scheduler.shutdown(wait=False)


def trigger_now():
    """Manually fire a run immediately (used by the API)."""
    _run_evals_sync()
