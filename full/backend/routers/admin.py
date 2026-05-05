from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from backend.database import get_connection
from typing import List, Optional

router = APIRouter()

class LoginRequest(BaseModel):
    password: str

@router.post("/login")
def login(req: LoginRequest):
    if req.password == "7122672000":
        return {"status": "ok", "role": "super_admin", "token": "bahadi_master_token"}
    raise HTTPException(status_code=401, detail="Incorrect password")

@router.get("/stats")
def get_stats():
    conn = get_connection()
    total = conn.execute("SELECT COUNT(*) FROM members WHERE status='published'").fetchone()[0]
    pending = conn.execute("SELECT COUNT(*) FROM members WHERE status='pending'").fetchone()[0]
    notable = conn.execute("SELECT COUNT(*) FROM members WHERE role IS NOT NULL AND role != ''").fetchone()[0]
    events = conn.execute("SELECT COUNT(*) FROM events").fetchone()[0]
    conn.close()
    return {
        "total_members": total,
        "pending_requests": pending,
        "documented_notable": notable,
        "total_events": events
    }

@router.get("/pending-list")
def get_pending():
    conn = get_connection()
    pending = conn.execute("SELECT * FROM members WHERE status='pending'").fetchall()
    conn.close()
    return [dict(row) for row in pending]

@router.post("/approve/{member_id}")
def approve_member(member_id: int):
    conn = get_connection()
    conn.execute("UPDATE members SET status='published' WHERE id=?", (member_id,))
    conn.commit()
    conn.close()
    return {"message": "Approved"}
