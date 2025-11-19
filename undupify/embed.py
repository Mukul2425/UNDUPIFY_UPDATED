from typing import List, Tuple, Dict

import numpy as np
from sentence_transformers import SentenceTransformer
from annoy import AnnoyIndex


_model_cache: Dict[str, SentenceTransformer] = {}

def compute_embeddings(texts: List[str], model_name: str) -> Tuple[np.ndarray, int]:
	if model_name not in _model_cache:
		_model_cache[model_name] = SentenceTransformer(model_name)
	model = _model_cache[model_name]
	emb = model.encode(texts, batch_size=64, show_progress_bar=False, convert_to_numpy=True, normalize_embeddings=True)
	return emb, emb.shape[1]


def build_annoy_index(embeddings: np.ndarray, num_trees: int = 50, metric: str = 'angular') -> AnnoyIndex:
	dim = embeddings.shape[1]
	index = AnnoyIndex(dim, metric)
	for i in range(embeddings.shape[0]):
		index.add_item(i, embeddings[i])
	index.build(num_trees)
	return index


