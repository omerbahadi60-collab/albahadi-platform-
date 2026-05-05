import csv, io
from fastapi import APIRouter, UploadFile, File, HTTPException
from backend.database import get_connection

router = APIRouter()

@router.post("/csv")
async def import_csv(file: UploadFile = File(...)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(400, "يرجى رفع ملف CSV فقط")
    content = await file.read()
    text = content.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(text))
    conn = get_connection()
    cur = conn.cursor()
    count = 0
    for row in reader:
        name = row.get("name") or row.get("الاسم","").strip()
        if not name:
            continue
        cur.execute("""
            INSERT INTO members (name, birth_year, gender, country, role, bio, generation, status)
            VALUES (?,?,?,?,?,?,?, 'pending')
        """, (
            name,
            int(row.get("birth_year") or row.get("سنة_الميلاد") or 0) or None,
            row.get("gender") or row.get("الجنس","male"),
            row.get("country") or row.get("البلد","السعودية"),
            row.get("role") or row.get("المهنة",""),
            row.get("bio") or row.get("السيرة",""),
            int(row.get("generation") or row.get("الجيل") or 0),
        ))
        count += 1
    conn.commit()
    conn.close()
    return {"message": f"تم استيراد {count} عضو بنجاح"}
