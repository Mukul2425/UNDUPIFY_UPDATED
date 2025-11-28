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

## Local Development Setup

### Quick Start (Automated)

Run the setup script to install dependencies:
```powershell
.\run-local.ps1
```

Then run backend and frontend in separate terminals:
```powershell
# Terminal 1 - Backend
.\run-backend.ps1

# Terminal 2 - Frontend
.\run-frontend.ps1
```

### Manual Setup

#### Backend Setup

1. Create and activate virtual environment:
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

2. Install dependencies:
```powershell
pip install -r requirements.txt
```

3. Run backend server:
```powershell
.\.venv\Scripts\python.exe -m uvicorn backend_main:app --host 127.0.0.1 --port 8000 --reload
```

Backend will be available at:
- API: `http://127.0.0.1:8000`
- API Docs: `http://127.0.0.1:8000/docs`
- Health Check: `http://127.0.0.1:8000/health`

#### Frontend Setup (React + TypeScript)

1. Navigate to frontend directory:
```powershell
cd frontend-new
```

2. Install dependencies:
```powershell
npm install
```

3. Create `.env.local` file (for local development):
```powershell
# Create .env.local
"VITE_API_URL=http://127.0.0.1:8000" | Out-File -FilePath ".env.local" -Encoding utf8
```

4. Run development server:
```powershell
npm run dev
```

Frontend will be available at `http://localhost:5173` (or the port shown in terminal)

### API Endpoints

- `GET /health` - Health check endpoint
- `POST /process` - Process dataset for deduplication
  - Parameters: `file`, `text_column?`, `remove_stopwords`, `model`, `annoy_trees`, `ann_k`, `cosine_threshold`, `fuzzy_threshold`
- `POST /compare` - Compare two files
  - Parameters: `query`, `target`, `remove_stopwords`, `cosine_threshold`, `fuzzy_threshold`
- `POST /compare_dir` - Compare a file against a directory (ZIP)
  - Parameters: `query`, `target_zip`, `remove_stopwords`, `cosine_threshold`, `fuzzy_threshold`, `top_k`
- `GET /download?path=...` - Download processed artifacts

### Environment Configuration

The frontend uses environment variables for API configuration:
- **Local Development**: Create `frontend-new/.env.local` with `VITE_API_URL=http://127.0.0.1:8000`
- **Production**: Uses default `https://undupify-updated.onrender.com` or set `VITE_API_URL` in Vercel environment variables

## Deployment

### Frontend on Vercel

1. Push repo to GitHub
2. Import project in Vercel
3. Configure build settings:
   - **Build Command**: `cd frontend-new && npm install && npm run build`
   - **Output Directory**: `frontend-new/dist`
   - **Root Directory**: Leave empty (or set to project root)
4. Set environment variable (optional):
   - `VITE_API_URL` = `https://undupify-updated.onrender.com` (or your backend URL)
5. Deploy

The `vercel.json` file is already configured for the new frontend structure.

### Backend on Render

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn backend_main:app --host 0.0.0.0 --port $PORT`
   - **Environment**: Python 3
4. The CORS middleware is already configured to allow requests from:
   - `https://undupify-updated.vercel.app`
   - `http://localhost:3000` (for local testing)
   - `*` (allows all origins - consider restricting in production)

### Current Deployed URLs

- **Frontend**: `https://undupify-updated.vercel.app` (or your Vercel URL)
- **Backend**: `https://undupify-updated.onrender.com` (or your Render URL)
