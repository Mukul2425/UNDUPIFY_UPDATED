# UNDUPIFY

CLI tool to deduplicate text datasets via exact hashing and near-duplicate detection (embeddings + ANN + cosine + edit distance).

## Installation

1) Create a virtual environment (recommended)
```bash
python -m venv .venv
```
Activate it (PowerShell):
```bash
.\.venv\Scripts\Activate.ps1
```

2) Install dependencies
```bash
pip install -r requirements.txt
```

## Usage

```bash
python -m undupify \
  --input path\to\data.csv \
  --text-column text \
  --artifacts-dir artifacts \
  --remove-stopwords \
  --model sentence-transformers/all-MiniLM-L6-v2 \
  --annoy-trees 50 \
  --ann-k 20 \
  --cosine-threshold 0.9 \
  --fuzzy-threshold 90
```

If `--text-column` is omitted, the tool attempts to auto-detect a text-like column.

Outputs are saved under the specified `artifacts` directory:
- ingested_YYYYMMDD_HHMMSS.csv
- normalized_YYYYMMDD_HHMMSS.csv
- exact_dups_YYYYMMDD_HHMMSS.csv
- near_dups_YYYYMMDD_HHMMSS.csv
- cleaned_YYYYMMDD_HHMMSS.csv
- report_YYYYMMDD_HHMMSS.json

## Notes
- Exact duplicates are detected via SHA-256 of normalized text.
- Near-duplicates use Sentence-BERT embeddings with Annoy for ANN search, filtered by cosine similarity and Levenshtein ratio.

## Backend API (FastAPI)

Run locally:
```powershell
.\.venv\Scripts\python.exe -m uvicorn backend_main:app --host 127.0.0.1 --port 8000 --reload
```

Endpoints:
- GET `/health`
- POST `/process` (multipart form): `file`, `text_column?`, `remove_stopwords`, `model`, `annoy_trees`, `ann_k`, `cosine_threshold`, `fuzzy_threshold`
- GET `/download?path=...` to fetch artifacts

## Simple Frontend (static)

Open `frontend/index.html` in a browser, set API URL to your backend (default `http://127.0.0.1:8000`), upload file or ZIP, tweak parameters, and run.

## Deploy

Frontend on Vercel:
- Push repo to GitHub
- Import in Vercel
- Root contains `vercel.json` routing static files in `/frontend`

Backend on Railway/Render/Fly:
- Deploy a Docker or Python service running `uvicorn backend_main:app --host 0.0.0.0 --port 8000`
- Expose public URL and configure CORS if needed
- In the frontend, set API URL accordingly
