import json
import os
from typing import Dict


def write_report(report: Dict, output_path: str) -> None:
	os.makedirs(os.path.dirname(output_path), exist_ok=True)
	with open(output_path, 'w', encoding='utf-8') as f:
		json.dump(report, f, indent=2, ensure_ascii=False)


