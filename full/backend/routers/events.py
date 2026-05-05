from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from backend.database import get_connection

router = APIRouter()

class EventCreate(BaseModel):
    title: str
    content: Optional[str] = None
    event_type: Optional[str] = "news"
    member_id: Optional[int] = None
    event_date: Optional[str] = None

@router.get("/")
def list_events():
    conn = get_connection()
    rows = conn.execute("""
        SELECT e.*, m.name as member_name
        FROM events e LEFT JOIN members m ON e.member_id = m.id
        ORDER BY e.created_at DESC LIMIT 50
    """).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.post("/")
def create_event(data: EventCreate):
    conn = get_connection()
    cur = conn.execute("""
        INSERT INTO events (title, content, event_type, member_id, event_date)
        VALUES (?,?,?,?,?)
    """, (data.title, data.content, data.event_type, data.member_id, data.event_date))
    conn.commit()
    conn.close()
    return {"id": cur.lastrowid, "message": "تم نشر الخبر بنجاح"}
