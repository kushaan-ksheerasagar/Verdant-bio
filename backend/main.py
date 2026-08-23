"""
VERDANT Application Server
FastAPI backend providing RESTful endpoints, scientific services, and static frontend hosting.
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from backend.routers.api import router as api_router

app = FastAPI(
    title="VERDANT Conservation Genomics Platform",
    description="Evidence-based population genomics intelligence for endangered wildlife management.",
    version="1.0.0"
)

# CORS middleware for development flexibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routes
app.include_router(api_router)

# Locate Frontend directory
FRONTEND_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend")

if os.path.exists(FRONTEND_DIR):
    # Mount static assets (CSS, JS, images, etc.)
    app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")

    @app.get("/")
    async def serve_index():
        index_file = os.path.join(FRONTEND_DIR, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return {"message": "VERDANT API is online. Frontend index.html not found."}

    # Catch-all for SPA client routing
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = os.path.join(FRONTEND_DIR, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        index_file = os.path.join(FRONTEND_DIR, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return {"error": "Not Found", "path": full_path}
else:
    @app.get("/")
    async def root():
        return {
            "name": "VERDANT Conservation Genomics Platform",
            "status": "ONLINE",
            "docs": "/docs",
            "api": "/api/project"
        }
