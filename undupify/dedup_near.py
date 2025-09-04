from typing import Dict, List, Tuple, Set

import numpy as np
import pandas as pd
from rapidfuzz import fuzz
from annoy import AnnoyIndex


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
	# embeddings are normalized, so cosine = dot
	return float(np.dot(a, b))


def find_near_duplicates(
	df: pd.DataFrame,
	embeddings: np.ndarray,
	index: AnnoyIndex,
	k: int = 20,
	cosine_threshold: float = 0.9,
	fuzzy_threshold: int = 90,
	norm_col: str = '_norm'
) -> Tuple[pd.DataFrame, pd.DataFrame]:
	# Greedy representative selection
	n = embeddings.shape[0]
	assigned: Set[int] = set()
	representative_of: Dict[int, int] = {}
	order = list(range(n))

	for i in order:
		if i in assigned:
			continue
		# i becomes representative of its cluster
		representative_of[i] = i
		assigned.add(i)
		# query neighbors (including itself)
		neighbors = index.get_nns_by_item(i, k, include_distances=False)
		for j in neighbors:
			if j == i or j in assigned:
				continue
			cos_sim = cosine_similarity(embeddings[i], embeddings[j])
			if cos_sim < cosine_threshold:
				continue
			fuzzy = fuzz.ratio(str(df.iloc[i][norm_col]), str(df.iloc[j][norm_col]))
			if fuzzy < fuzzy_threshold:
				continue
			representative_of[j] = i
			assigned.add(j)

	# Build outputs
	indices = list(range(n))
	is_dup_mask = [idx in representative_of and representative_of[idx] != idx for idx in indices]
	dups_df = df.iloc[[i for i, dup in enumerate(is_dup_mask) if dup]].copy()
	origs_df = df.iloc[[i for i, dup in enumerate(is_dup_mask) if not dup]].copy()
	return origs_df, dups_df


