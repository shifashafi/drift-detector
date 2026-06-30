from fastapi import APIRouter, HTTPException
from app.core.database import get_supabase
from app.services.runner import run_single_eval
from app.core.scheduler import trigger_now

router = APIRouter()


@router.get("/")
def list_runs(test_case_id: str = None, limit: int = 50):
    db = get_supabase()
    q = db.table("runs").select("*").order("created_at", desc=True).limit(limit)
    if test_case_id:
        q = q.eq("test_case_id", test_case_id)
    return q.execute().data


@router.post("/trigger-all", status_code=202)
def trigger_full_suite():
    """Manually kick off the eval suite outside the schedule."""
    trigger_now()
    return {"message": "Eval suite triggered"}


@router.post("/trigger/{tc_id}", status_code=202)
async def trigger_single(tc_id: str):
    """Run a single test case immediately and return the result."""
    db = get_supabase()
    tc = db.table("test_cases").select("*").eq("id", tc_id).single().execute()
    if not tc.data:
        raise HTTPException(status_code=404, detail="Test case not found")
    result = await run_single_eval(tc.data)
    return result
