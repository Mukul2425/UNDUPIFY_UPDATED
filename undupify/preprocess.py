import re
from typing import Iterable, List

import pandas as pd


_WHITESPACE_RE = re.compile(r"\s+")
_NON_ALNUM_RE = re.compile(r"[^a-z0-9\s]")

# Lightweight built-in English stopword list to avoid external deps
_EN_STOPWORDS = {
    'a','about','above','after','again','against','all','am','an','and','any','are','aren','as','at',
    'be','because','been','before','being','below','between','both','but','by','can','cannot','could',
    'couldn','did','didn','do','does','doesn','doing','don','down','during','each','few','for','from',
    'further','had','hadn','has','hasn','have','haven','having','he','her','here','hers','herself','him',
    'himself','his','how','i','if','in','into','is','isn','it','its','itself','just','ll','m','ma','me',
    'mightn','more','most','mustn','my','myself','no','nor','not','now','o','of','off','on','once','only',
    'or','other','our','ours','ourselves','out','over','own','re','s','same','shan','she','should','shouldn',
    'so','some','such','t','than','that','the','their','theirs','them','themselves','then','there','these',
    'they','this','those','through','to','too','under','until','up','very','was','wasn','we','were','weren',
    'what','when','where','which','while','who','whom','why','will','with','won','wouldn','y','you','your',
    'yours','yourself','yourselves'
}


def normalize_text(text: str, remove_stopwords: bool = False) -> str:
	if text is None:
		return ''
	# Lowercase
	s = text.lower()
	# Remove punctuation/special chars
	s = _NON_ALNUM_RE.sub(' ', s)
	# Whitespace collapse
	s = _WHITESPACE_RE.sub(' ', s).strip()
	if remove_stopwords:
		words = [w for w in s.split(' ') if w and w not in _EN_STOPWORDS]
		s = ' '.join(words)
	return s


def normalize_dataframe(df: pd.DataFrame, text_col: str = '_text', output_col: str = '_norm', remove_stopwords: bool = False) -> pd.DataFrame:
	work = df.copy()
	work[output_col] = work[text_col].astype(str).apply(lambda x: normalize_text(x, remove_stopwords=remove_stopwords))
	return work


