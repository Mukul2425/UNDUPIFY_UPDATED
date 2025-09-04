import os
from typing import Optional, Tuple, List

import pandas as pd


def _read_csv(input_path: str) -> pd.DataFrame:
	return pd.read_csv(input_path)


def _read_json(input_path: str) -> pd.DataFrame:
	try:
		return pd.read_json(input_path, lines=True)
	except ValueError:
		return pd.read_json(input_path)


def _read_txt(input_path: str) -> pd.DataFrame:
	with open(input_path, 'r', encoding='utf-8', errors='ignore') as f:
		lines = [line.strip() for line in f]
	return pd.DataFrame({"text": lines})


def read_any(input_path: str) -> pd.DataFrame:
	"""Read CSV/JSON/TXT into a DataFrame without loss of generality."""
	ext = os.path.splitext(input_path)[1].lower()
	if ext in {'.csv'}:
		return _read_csv(input_path)
	if ext in {'.json', '.jsonl'}:
		return _read_json(input_path)
	if ext in {'.txt'}:
		return _read_txt(input_path)
	raise ValueError(f"Unsupported file extension: {ext}")


def _candidate_text_columns(df: pd.DataFrame) -> List[str]:
	text_like = []
	for col in df.columns:
		series = df[col]
		if pd.api.types.is_string_dtype(series):
			text_like.append(col)
		else:
			# Heuristic: many unique values and convertible to string
			unique_ratio = series.nunique(dropna=True) / max(len(series), 1)
			if unique_ratio > 0.5:
				text_like.append(col)
	return text_like


def detect_text_column(df: pd.DataFrame) -> Optional[str]:
	preferred = [
		'text', 'content', 'message', 'body', 'description', 'title', 'name'
	]
	candidates = _candidate_text_columns(df)
	for p in preferred:
		if p in df.columns and p in candidates:
			return p
	return candidates[0] if candidates else None


def prepare_ingestion(df: pd.DataFrame, text_column: Optional[str]) -> Tuple[pd.DataFrame, str]:
	col = text_column or detect_text_column(df)
	if not col:
		raise ValueError("Could not auto-detect a text column. Please specify --text-column.")
	work = df.copy()
	work = work.rename(columns={col: '_text'})
	# Ensure text is string and handle NaNs
	work['_text'] = work['_text'].astype(str).fillna('')
	work.insert(0, 'temp_id', range(1, len(work) + 1))
	return work[['temp_id', '_text']], col


def write_ingested(df: pd.DataFrame, output_path: str) -> None:
	os.makedirs(os.path.dirname(output_path), exist_ok=True)
	df.to_csv(output_path, index=False)


