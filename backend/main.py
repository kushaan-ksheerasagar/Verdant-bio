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

# CORS middleware for development & Vercel deployment flexibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount REST API routes under /api
app.include_router(api_router)

# Also create fallback route mapping for Vercel serverless functions
# which may strip the /api prefix when forwarding to api/index.py
for route in api_router.routes:
    if hasattr(route, "path") and route.path.startswith("/api"):
        path_without_api = route.path[4:]  # strip "/api"
        if path_without_api and not any(r.path == path_without_api for r in app.routes):
            app.add_api_route(
                path_without_api,
                route.endpoint,
                methods=getattr(route, "methods", ["GET"]),
                response_model=getattr(route, "response_model", None),
                tags=getattr(route, "tags", [])
            )

# Safely mount static frontend files ONLY if directory exists locally (not in serverless lambdas)
FRONTEND_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend")

if not os.getenv("VERCEL") and os.path.exists(FRONTEND_DIR) and os.path.isdir(FRONTEND_DIR):
    try:
        app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")

        @app.get("/")
        async def serve_index():
            index_file = os.path.join(FRONTEND_DIR, "index.html")
            if os.path.exists(index_file):
                return FileResponse(index_file)
            return {"message": "VERDANT API is online."}

        # Catch-all for local SPA client routing
        @app.get("/{full_path:path}")
        async def serve_spa(full_path: str):
            file_path = os.path.join(FRONTEND_DIR, full_path)
            if os.path.exists(file_path) and os.path.isfile(file_path):
                return FileResponse(file_path)
            index_file = os.path.join(FRONTEND_DIR, "index.html")
            if os.path.exists(index_file):
                return FileResponse(index_file)
            return {"error": "Not Found", "path": full_path}
    except Exception as err:
        print(f"Static mounting skipped: {err}")
