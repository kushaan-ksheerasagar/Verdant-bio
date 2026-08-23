#!/usr/bin/env python3
"""
VERDANT Platform Local Launcher
Boots the FastAPI application server, serves the interactive frontend,
and opens the platform in your default web browser.
"""

import sys
import os
import time
import webbrowser
import threading
import uvicorn

# Ensure repository root is on sys.path
REPO_ROOT = os.path.dirname(os.path.abspath(__file__))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

def open_browser(url: str, delay: float = 1.2):
    """Opens browser after server startup."""
    time.sleep(delay)
    print(f"\n[VERDANT] Opening local web interface: {url}")
    webbrowser.open(url)

def main():
    host = "127.0.0.1"
    port = 8000
    url = f"http://{host}:{port}"

    print("=" * 70)
    print("   VERDANT — Conservation Genomics Intelligence Platform")
    print("   From Genomes to Conservation Decisions")
    print("=" * 70)
    print(f"   * Host:               {host}")
    print(f"   * Port:               {port}")
    print(f"   * Web Interface:      {url}")
    print(f"   * API Documentation:  {url}/docs")
    print(f"   * Dataset:            Panthera tigris (Zenodo 14258052)")
    print(f"   * Reference Assembly: GCA_021130815.1 PanTigT.MC.v3")
    print("=" * 70)

    # Launch browser in separate thread
    threading.Thread(target=open_browser, args=(url,), daemon=True).start()

    # Start FastAPI server via Uvicorn
    uvicorn.run("backend.main:app", host=host, port=port, log_level="info", reload=False)

if __name__ == "__main__":
    main()
