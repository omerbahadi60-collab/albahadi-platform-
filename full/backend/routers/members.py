from fastapi import APIRouter, HTTPException
from backend.database import get_connection
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class MemberCreate(BaseModel):
    name: str
    birth_year: Optional[int] = None
    death_year: Optional[int] = None
    birth_place: Optional[str] = None
    country: Optional[str] = "السعودية"
    bio: Optional[str] = None
    role: Optional[str] = None
    achievements: Optional[str] = None
    is_deceased: Optional[bool] = False
    gender: Optional[str] = "male"
    generation: Optional[int] = 0
    parent_id: Optional[int] = None

@router.get("/")
def list_members():
    conn = get_connection()
    rows = conn.execute("SELECT * FROM members WHERE status='published' ORDER BY generation, id").fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.get("/{member_id}")
def get_member(member_id: int):
    conn = get_connection()
    row = conn.execute("SELECT * FROM members WHERE id=?", (member_id,)).fetchone()
    if not row:
        raise HTTPException(404, "العضو غير موجود")
    timeline = conn.execute("SELECT * FROM timeline_items WHERE member_id=? ORDER BY year", (member_id,)).fetchall()
    conn.close()
    m = dict(row)
    m["timeline"] = [dict(t) for t in timeline]
    return m

@router.post("/")
def create_member(data: MemberCreate):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO members (name, birth_year, death_year, birth_place, country, bio,
        role, achievements, is_deceased, gender, generation)
        VALUES (?,?,?,?,?,?,?,?,?,?,?)
    """, (data.name, data.birth_year, data.death_year, data.birth_place, data.country,
          data.bio, data.role, data.achievements, int(data.is_deceased or 0),
          data.gender, data.generation))
    new_id = cur.lastrowid
    if data.parent_id:
        cur.execute("INSERT OR IGNORE INTO relationships (parent_id, child_id) VALUES (?,?)",
                    (data.parent_id, new_id))
    conn.commit()
    conn.close()
    return {"id": new_id, "message": "تم إضافة العضو بنجاح"}

@router.put("/{member_id}")
def update_member(member_id: int, data: MemberCreate):
    conn = get_connection()
    conn.execute("""
        UPDATE members SET name=?, birth_year=?, death_year=?, birth_place=?, country=?,
        bio=?, role=?, achievements=?, is_deceased=?, gender=?, generation=?
        WHERE id=?
    """, (data.name, data.birth_year, data.death_year, data.birth_place, data.country,
          data.bio, data.role, data.achievements, int(data.is_deceased or 0),
          data.gender, data.generation, member_id))
    conn.commit()
    conn.close()
    return {"message": "تم التحديث بنجاح"}

@router.delete("/{member_id}")
def delete_member(member_id: int):
    conn = get_connection()
    conn.execute("DELETE FROM members WHERE id=?", (member_id,))
    conn.commit()
    conn.close()
    return {"message": "تم الحذف بنجاح"}

@router.get("/tree/data")
def get_tree_data():
    conn = get_connection()
    members = conn.execute("SELECT id, name, gender, generation, role, is_deceased FROM members WHERE status='published'").fetchall()
    relations = conn.execute("SELECT parent_id, child_id FROM relationships WHERE child_id IN (SELECT id FROM members WHERE status='published')").fetchall()
    conn.close()
    return {
        "nodes": [dict(m) for m in members],
        "links": [{"source": r["parent_id"], "target": r["child_id"]} for r in relations]
    }

@router.post("/relationship/add")
def add_relationship(data: dict):
    parent_id = data.get("parent_id")
    child_id = data.get("child_id")
    conn = get_connection()
    conn.execute("INSERT OR IGNORE INTO relationships (parent_id, child_id) VALUES (?,?)",
                 (parent_id, child_id))
    conn.commit()
    conn.close()
    return {"message": "تم ربط العلاقة بنجاح"}
