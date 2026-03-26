import os
import uuid
from typing import Tuple


class DmsService:
    def __init__(self, root: str) -> None:
        self.root = root
        os.makedirs(self.root, exist_ok=True)

    def save_bytes(self, data: bytes, filename: str) -> Tuple[str, int]:
        # Prepare unique file path under a year/month folder structure
        subdir = os.path.join(self.root, uuid.uuid4().hex[:2])
        os.makedirs(subdir, exist_ok=True)
        basename = f"{uuid.uuid4().hex}_{filename}"
        abs_path = os.path.join(subdir, basename)
        with open(abs_path, "wb") as f:
            f.write(data)
        rel_path = os.path.relpath(abs_path, self.root)
        return rel_path.replace("\\", "/"), len(data)
