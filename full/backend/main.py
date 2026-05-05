import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.database import init_db
from backend.routers import members, chat, events, import_data
from backend.routers import members, chat, events, import_data, admin

app = FastAPI(title="منصة قبيلة الباهادي", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(members.router,     prefix="/api/members",      tags=["أعضاء"])
app.include_router(chat.router,        prefix="/api/chat",         tags=["ذكاء اصطناعي"])
app.include_router(events.router,      prefix="/api/events",       tags=["أحداث"])
app.include_router(import_data.router, prefix="/api/import",       tags=["استيراد"])
app.include_router(admin.router,       prefix="/api/admin",        tags=["أدمن"])

# Serve frontend
FRONTEND = os.path.join(os.getcwd(),"frontend")
app.mount("/static", StaticFiles(directory=FRONTEND), name="static")

@app.get("/")
def root():
    return FileResponse(os.path.join(FRONTEND, "index.html"))

@app.on_event("startup")
def startup():
    init_db()
    print("DB ready - Al-Bahadi Platform started")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
