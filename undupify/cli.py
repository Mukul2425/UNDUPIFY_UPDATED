import argparse
import os
from datetime import datetime

from .ingest import read_any, prepare_ingestion, write_ingested
from .preprocess import normalize_dataframe
from .dedup_exact import exact_deduplicate
from .embed import compute_embeddings, build_annoy_index
from .dedup_near import find_near_duplicates
from .reporting import write_report


def main():
	parser = argparse.ArgumentParser(description='UNDUPIFY - text deduplication toolkit')
	parser.add_argument('--input', '-i', required=True, help='Path to input CSV/JSON/TXT file')
	parser.add_argument('--text-column', '-c', default=None, help='Name of text column (optional)')
	parser.add_argument('--artifacts-dir', '-o', default='artifacts', help='Directory to write outputs')
	parser.add_argument('--remove-stopwords', action='store_true', help='Remove English stopwords during normalization')
	parser.add_argument('--model', default='sentence-transformers/all-MiniLM-L6-v2', help='SentenceTransformer model name')
	parser.add_argument('--annoy-trees', type=int, default=50, help='Number of Annoy trees')
	parser.add_argument('--ann-k', type=int, default=20, help='Neighbors to probe per item')
	parser.add_argument('--cosine-threshold', type=float, default=0.9, help='Cosine similarity threshold [0-1]')
	parser.add_argument('--fuzzy-threshold', type=int, default=90, help='Levenshtein ratio threshold [0-100]')
	args = parser.parse_args()

	input_path = os.path.abspath(args.input)
	artifacts_dir = os.path.abspath(args.artifacts_dir)
	os.makedirs(artifacts_dir, exist_ok=True)

	print('Reading input...')
	df = read_any(input_path)
	print(f'Loaded {len(df)} records from {input_path}')

	print('Preparing ingestion...')
	ingested, selected_col = prepare_ingestion(df, args.text_column)
	print(f'Using text column: {selected_col}')

	timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
	ingested_path = os.path.join(artifacts_dir, f'ingested_{timestamp}.csv')
	write_ingested(ingested, ingested_path)
	print(f'Wrote ingested dataset to {ingested_path}')

	print('Normalizing text...')
	norm_df = normalize_dataframe(ingested, text_col='_text', output_col='_norm', remove_stopwords=args.remove_stopwords)
	normalized_path = os.path.join(artifacts_dir, f'normalized_{timestamp}.csv')
	norm_df[['temp_id', '_text', '_norm']].to_csv(normalized_path, index=False)
	print(f'Wrote normalized dataset to {normalized_path}')

	print('Exact duplicate filtering (hashing)...')
	origs_after_exact, exact_dups = exact_deduplicate(norm_df, norm_col='_norm')
	exact_path = os.path.join(artifacts_dir, f'exact_dups_{timestamp}.csv')
	exact_dups[['temp_id', '_text', '_norm', '_hash']].to_csv(exact_path, index=False)
	print(f'Exact duplicates: {len(exact_dups)} (saved to {exact_path})')

	print('Computing embeddings for remaining records...')
	embeddings, dim = compute_embeddings(origs_after_exact['_norm'].tolist(), args.model)
	index = build_annoy_index(embeddings, num_trees=args.annoy_trees)

	print('Near-duplicate detection (ANN + cosine + edit distance)...')
	origs_after_near, near_dups = find_near_duplicates(
		origs_after_exact.reset_index(drop=True),
		embeddings,
		index,
		k=args.ann_k,
		cosine_threshold=args.cosine_threshold,
		fuzzy_threshold=args.fuzzy_threshold,
		norm_col='_norm'
	)
	near_path = os.path.join(artifacts_dir, f'near_dups_{timestamp}.csv')
	near_dups[['temp_id', '_text', '_norm']].to_csv(near_path, index=False)
	print(f'Near duplicates: {len(near_dups)} (saved to {near_path})')

	print('Writing cleaned dataset and report...')
	cleaned_path = os.path.join(artifacts_dir, f'cleaned_{timestamp}.csv')
	origs_after_near[['temp_id', '_text']].to_csv(cleaned_path, index=False)

	report = {
		'total_records': int(len(df)),
		'exact_duplicates_removed': int(len(exact_dups)),
		'near_duplicates_removed': int(len(near_dups)),
		'final_records': int(len(origs_after_near)),
		'deduplication_rate': float((len(df) - len(origs_after_near)) / max(1, len(df)))
	}
	report_path = os.path.join(artifacts_dir, f'report_{timestamp}.json')
	write_report(report, report_path)
	print(f"Cleaned dataset: {cleaned_path}")
	print(f"Report: {report_path}")
