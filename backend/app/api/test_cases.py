import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from app.core.database import get_supabase
from app.models.schemas import TestCase, TestCaseCreate

router = APIRouter()


@router.get("/", response_model=list[TestCase])
def list_test_cases():
    db = get_supabase()
    result = db.table("test_cases").select("*").order("created_at", desc=True).execute()
    return result.data


@router.post("/", response_model=TestCase, status_code=201)
def create_test_case(body: TestCaseCreate):
    db = get_supabase()
    record = {
        "id": str(uuid.uuid4()),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "is_active": True,
        **body.model_dump(),
    }
    result = db.table("test_cases").insert(record).execute()
    return result.data[0]


@router.get("/{tc_id}", response_model=TestCase)
def get_test_case(tc_id: str):
    db = get_supabase()
    result = db.table("test_cases").select("*").eq("id", tc_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Test case not found")
    return result.data


@router.patch("/{tc_id}/toggle")
def toggle_test_case(tc_id: str):
    db = get_supabase()
    current = db.table("test_cases").select("is_active").eq("id", tc_id).single().execute()
    if not current.data:
        raise HTTPException(status_code=404, detail="Not found")
    new_state = not current.data["is_active"]
    db.table("test_cases").update({"is_active": new_state}).eq("id", tc_id).execute()
    return {"is_active": new_state}


@router.delete("/{tc_id}", status_code=204)
def delete_test_case(tc_id: str):
    db = get_supabase()
    db.table("test_cases").delete().eq("id", tc_id).execute()
