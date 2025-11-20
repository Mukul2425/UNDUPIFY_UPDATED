from typing import List, Tuple, Dict

import numpy as np
from fastembed import TextEmbedding
from annoy import AnnoyIndex


_model_cache: Dict[str, TextEmbedding] = {}

def compute_embeddings(texts: List[str], model_name: str) -> Tuple[np.ndarray, int]:
	if model_name not in _model_cache:
		# FastEmbed handles model caching internally, but we keep the instance alive
		_model_cache[model_name] = TextEmbedding(model_name=model_name)
	model = _model_cache[model_name]
	# fastembed.embed returns a generator
	embeddings_list = list(model.embed(texts))
	if not embeddings_list:
		# Handle empty case if necessary, though texts should not be empty
		return np.array([]), 0
	emb = np.array(embeddings_list)
	return emb, emb.shape[1]


def build_annoy_index(embeddings: np.ndarray, num_trees: int = 50, metric: str = 'angular') -> AnnoyIndex:
	dim = embeddings.shape[1]
	index = AnnoyIndex(dim, metric)
	for i in range(embeddings.shape[0]):
		index.add_item(i, embeddings[i])
	index.build(num_trees)
	return index


