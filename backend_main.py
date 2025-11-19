import os
import shutil
import tempfile
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse

import pandas as pd

from undupify.ingest import read_any, prepare_ingestion, write_ingested
from undupify.preprocess import normalize_dataframe
from undupify.dedup_exact import exact_deduplicate
from undupify.embed import compute_embeddings, build_annoy_index
from undupify.dedup_near import find_near_duplicates
from undupify.reporting import write_report
from undupify.extract import extract_text


app = FastAPI(title="UNDUPIFY API")
app.add_middleware(
	CORSMiddleware,
	allow_origins=[
		"https://undupify-updated.vercel.app",
		"https://undupify-updated.onrender.com",
		"http://localhost:3000",
		"http://127.0.0.1:3000",
		"*"
	],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
	# Preload the default model to avoid timeout on first request
	print("Preloading model...")
	compute_embeddings(["warmup"], "sentence-transformers/all-MiniLM-L6-v2")
	print("Model preloaded.")

@app.get("/health")
def health():
	return {"status": "ok"}


@app.post("/process")
async def process(
	file: UploadFile = File(...),
	text_column: Optional[str] = Form(None),
	remove_stopwords: bool = Form(False),
	model: str = Form("sentence-transformers/all-MiniLM-L6-v2"),
	annoy_trees: int = Form(50),
	ann_k: int = Form(20),
	cosine_threshold: float = Form(0.9),
	fuzzy_threshold: int = Form(90),
):
	# Prepare workspace
	timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
	artifacts_dir = os.path.abspath(os.path.join('artifacts', timestamp))
	os.makedirs(artifacts_dir, exist_ok=True)

	# Save uploaded file to temp, then read
	upload_path = os.path.join(artifacts_dir, file.filename)
	with open(upload_path, 'wb') as out:
		shutil.copyfileobj(file.file, out)

	df = read_any(upload_path)
	ingested, selected_col = prepare_ingestion(df, text_column)
	ingested_path = os.path.join(artifacts_dir, f'ingested_{timestamp}.csv')
	write_ingested(ingested, ingested_path)

	norm_df = normalize_dataframe(ingested, text_col='_text', output_col='_norm', remove_stopwords=remove_stopwords)
	normalized_path = os.path.join(artifacts_dir, f'normalized_{timestamp}.csv')
	norm_df[['temp_id', '_text', '_norm']].to_csv(normalized_path, index=False)

	origs_after_exact, exact_dups = exact_deduplicate(norm_df, norm_col='_norm')
	exact_path = os.path.join(artifacts_dir, f'exact_dups_{timestamp}.csv')
	exact_dups[['temp_id', '_text', '_norm', '_hash']].to_csv(exact_path, index=False)

	embeddings, _ = compute_embeddings(origs_after_exact['_norm'].tolist(), model)
	index = build_annoy_index(embeddings, num_trees=annoy_trees)

	origs_after_near, near_dups = find_near_duplicates(
		origs_after_exact.reset_index(drop=True),
		embeddings,
		index,
		k=ann_k,
		cosine_threshold=cosine_threshold,
		fuzzy_threshold=fuzzy_threshold,
		norm_col='_norm'
	)
	near_path = os.path.join(artifacts_dir, f'near_dups_{timestamp}.csv')
	near_dups[['temp_id', '_text', '_norm']].to_csv(near_path, index=False)

	cleaned_path = os.path.join(artifacts_dir, f'cleaned_{timestamp}.csv')
	origs_after_near[['temp_id', '_text']].to_csv(cleaned_path, index=False)

	report = {
		'timestamp': timestamp,
		'input_filename': file.filename,
		'total_records': int(len(df)),
		'exact_duplicates_removed': int(len(exact_dups)),
		'near_duplicates_removed': int(len(near_dups)),
		'final_records': int(len(origs_after_near)),
		'deduplication_rate': float((len(df) - len(origs_after_near)) / max(1, len(df))),
		'artifacts_dir': artifacts_dir,
		'files': {
			'ingested': ingested_path,
			'normalized': normalized_path,
			'exact_dups': exact_path,
			'near_dups': near_path,
			'cleaned': cleaned_path,
		}
	}
	report_path = os.path.join(artifacts_dir, f'report_{timestamp}.json')
	write_report(report, report_path)

	return report


@app.post('/compare')
async def compare(
	query: UploadFile = File(...),
	target: UploadFile = File(...),
	remove_stopwords: bool = Form(False),
	model: str = Form("sentence-transformers/all-MiniLM-L6-v2"),
	cosine_threshold: float = Form(0.9),
	fuzzy_threshold: int = Form(90),
):
	# Save both files
	timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
	artifacts_dir = os.path.abspath(os.path.join('artifacts', f'compare_{timestamp}'))
	os.makedirs(artifacts_dir, exist_ok=True)

	q_path = os.path.join(artifacts_dir, query.filename)
	with open(q_path, 'wb') as out:
		shutil.copyfileobj(query.file, out)

	t_path = os.path.join(artifacts_dir, target.filename)
	with open(t_path, 'wb') as out:
		shutil.copyfileobj(target.file, out)

	# Extract text from both
	q_text = extract_text(q_path)
	t_text = extract_text(t_path)

	# Normalize and embed
	import pandas as pd
	from undupify.preprocess import normalize_text
	q_norm = normalize_text(q_text, remove_stopwords=remove_stopwords)
	t_norm = normalize_text(t_text, remove_stopwords=remove_stopwords)

	from undupify.embed import compute_embeddings
	embeddings, _ = compute_embeddings([q_norm, t_norm], model)
	from undupify.dedup_near import cosine_similarity
	cos_sim = cosine_similarity(embeddings[0], embeddings[1])

	from rapidfuzz import fuzz
	fuzzy = fuzz.ratio(q_norm, t_norm)

	result = {
		'timestamp': timestamp,
		'query_filename': query.filename,
		'target_filename': target.filename,
		'cosine_similarity': float(cos_sim),
		'levenshtein_ratio': int(fuzzy),
		'is_duplicate': bool(cos_sim >= cosine_threshold and fuzzy >= fuzzy_threshold)
	}
	return result


@app.post('/compare_dir')
async def compare_dir(
	query: UploadFile = File(...),
	target_zip: UploadFile = File(...),
	remove_stopwords: bool = Form(False),
	model: str = Form("sentence-transformers/all-MiniLM-L6-v2"),
	cosine_threshold: float = Form(0.9),
	fuzzy_threshold: int = Form(90),
	top_k: int = Form(50),
):
	timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
	artifacts_dir = os.path.abspath(os.path.join('artifacts', f'compare_dir_{timestamp}'))
	os.makedirs(artifacts_dir, exist_ok=True)

	q_path = os.path.join(artifacts_dir, query.filename)
	with open(q_path, 'wb') as out:
		shutil.copyfileobj(query.file, out)

	z_path = os.path.join(artifacts_dir, target_zip.filename)
	with open(z_path, 'wb') as out:
		shutil.copyfileobj(target_zip.file, out)

	# Extract ZIP to folder
	extract_dir = os.path.join(artifacts_dir, 'unzipped')
	os.makedirs(extract_dir, exist_ok=True)
	import zipfile
	with zipfile.ZipFile(z_path, 'r') as zf:
		zf.extractall(extract_dir)

	# Collect files
	allowed_ext = {'.txt', '.pdf', '.docx', '.pptx', '.xlsx', '.csv', '.json', '.jsonl'}
	candidates = []
	for root, _, files in os.walk(extract_dir):
		for name in files:
			ext = os.path.splitext(name)[1].lower()
			if ext in allowed_ext:
				candidates.append(os.path.join(root, name))

	# Extract and normalize
	from undupify.preprocess import normalize_text
	q_text = extract_text(q_path)
	q_norm = normalize_text(q_text, remove_stopwords=remove_stopwords)
	texts = []
	file_names = []
	for path in candidates:
		try:
			t = extract_text(path)
		except Exception:
			t = ''
		texts.append(normalize_text(t, remove_stopwords=remove_stopwords))
		file_names.append(os.path.relpath(path, extract_dir))

	# Compute embeddings and similarities
	if not texts:
		return {
			'timestamp': timestamp,
			'query_filename': query.filename,
			'target_zip': target_zip.filename,
			'matches': []
		}
	from undupify.embed import compute_embeddings
	import numpy as np
	q_emb, _ = compute_embeddings([q_norm], model)
	t_emb, _ = compute_embeddings(texts, model)

	from undupify.dedup_near import cosine_similarity
	from rapidfuzz import fuzz
	rows = []
	for i, fname in enumerate(file_names):
		cos = float(np.dot(q_emb[0], t_emb[i]))
		lev = int(fuzz.ratio(q_norm, texts[i]))
		rows.append({
			'filename': fname,
			'cosine_similarity': cos,
			'levenshtein_ratio': lev,
			'is_duplicate': bool(cos >= cosine_threshold and lev >= fuzzy_threshold)
		})
	# Sort by cosine desc, then lev desc
	rows.sort(key=lambda r: (r['cosine_similarity'], r['levenshtein_ratio']), reverse=True)
	return {
		'timestamp': timestamp,
		'query_filename': query.filename,
		'target_zip': target_zip.filename,
		'matches': rows[:int(top_k)]
	}


@app.get('/download')
def download(path: str):
	if not os.path.exists(path):
		return JSONResponse(status_code=404, content={'error': 'Not found'})
	filename = os.path.basename(path)
	return FileResponse(path, filename=filename)


