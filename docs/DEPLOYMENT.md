# VERDANT Deployment Guide

## 1. Local MVP Execution (Current Phase)

### Prerequisites:
- Python 3.10+ (Python 3.12 verified)
- Modern web browser (Chrome, Firefox, Edge, Safari)

### Quickstart:
```bash
# 1. Install dependencies
pip install fastapi uvicorn pydantic numpy scipy scikit-learn pandas

# 2. Launch VERDANT locally
python run_verdant.py
```
VERDANT will launch on `http://127.0.0.1:8000` and automatically open your default browser.

---

## 2. Cloud Architecture Migration (Production Phase)
- **Containerization**: Docker multi-stage build.
- **Backend API**: Deployed on Google Cloud Run with autoscaling.
- **Worker Tier**: Google Cloud Batch executing Nextflow DSL2 pipelines.
- **Database**: Managed PostgreSQL on Google Cloud SQL.
- **Storage**: Multi-region Google Cloud Storage buckets for BAM/VCF/FASTQ archives.
