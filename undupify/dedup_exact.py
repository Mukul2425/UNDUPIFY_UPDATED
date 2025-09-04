import hashlib
from typing import Tuple

import pandas as pd


def _sha256_hex(s: str) -> str:
	return hashlib.sha256(s.encode('utf-8')).hexdigest()


def exact_deduplicate(df: pd.DataFrame, norm_col: str = '_norm') -> Tuple[pd.DataFrame, pd.DataFrame]:
	work = df.copy()
	work['_hash'] = work[norm_col].astype(str).apply(_sha256_hex)
	# Keep first occurrence as original
	work['_is_exact_dup'] = work.duplicated(subset=['_hash'], keep='first')
	originals = work[~work['_is_exact_dup']].drop(columns=['_is_exact_dup'])
	dups = work[work['_is_exact_dup']].drop(columns=['_is_exact_dup'])
	return originals, dups


