"""Vercel entry point for the Flask analysis endpoint."""

from pathlib import Path
import sys


PROJECT_ROOT = Path(__file__).resolve().parents[1]
BACKEND_DIR = PROJECT_ROOT / "backend"
sys.path.insert(0, str(BACKEND_DIR))

from server import app  # noqa: E402, F401
