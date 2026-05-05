from fastapi import APIRouter
from pydantic import BaseModel
from backend.database import get_connection
from backend.services.graph_service import build_graph, find_path, describe_relationship

router = APIRouter()

class ChatRequest(BaseModel):
    person1_id: int
    person2_id: int

@router.post("/relationship")
def find_family_relationship(req: ChatRequest):
    conn = get_connection()
    members_rows = conn.execute("SELECT id, name, gender FROM members").fetchall()
    parent_child = conn.execute("SELECT parent_id, child_id FROM relationships").fetchall()
    spouse_rows = conn.execute("SELECT person1_id, person2_id FROM spouse_relationships").fetchall()
    conn.close()

    members = {r["id"]: dict(r) for r in members_rows}
    pc_edges = [(r["parent_id"], r["child_id"]) for r in parent_child]
    sp_edges = [(r["person1_id"], r["person2_id"]) for r in spouse_rows]

    if req.person1_id not in members or req.person2_id not in members:
        return {"error": "أحد الأشخاص غير موجود في القاعدة"}

    graph = build_graph(pc_edges, sp_edges)
    path, edges = find_path(graph, req.person1_id, req.person2_id)

    if not path:
        name_a = members[req.person1_id]["name"]
        name_b = members[req.person2_id]["name"]
        return {
            "found": False,
            "message": f"لا توجد صلة قرابة موثّقة بين {name_a} و{name_b} في قاعدة البيانات الحالية."
        }

    summary, steps, ca_idx, edge_labels = describe_relationship(path, edges, members)
    name_a = members[req.person1_id]["name"]
    name_b = members[req.person2_id]["name"]

    path_names = [members[pid]["name"] for pid in path]

    return {
        "found": True,
        "person1": name_a,
        "person2": name_b,
        "summary": f"{name_b} هو/هي {summary} بالنسبة لـ {name_a}",
        "steps": steps,
        "path_names": path_names,
        "edge_labels": edge_labels,
        "common_ancestor_idx": ca_idx,
        "degrees": len(edges)
    }

@router.get("/members/search")
def search_members(q: str = ""):
    conn = get_connection()
    rows = conn.execute(
        "SELECT id, name, role, country FROM members WHERE name LIKE ? ORDER BY name LIMIT 20",
        (f"%{q}%",)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]
