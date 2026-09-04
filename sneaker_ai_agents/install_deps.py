"""
Egyszeri segédszkript a cPanel "Setup Python App" felület script-futtató
mezőjéhez, mert az nem shell parancsot, hanem egy Python fájlt vár - így
nem lehet közvetlenül "pip install ..."-ot beírni oda.

Használat: a Setup Python App oldalon a script mezőbe írd be:
    install_deps.py
"""
import subprocess
import sys
import os

project_dir = os.path.dirname(os.path.abspath(__file__))
requirements_path = os.path.join(project_dir, "requirements.txt")

print(f"Python: {sys.executable}")
print(f"Projekt mappa: {project_dir}")
print(f"Requirements fájl: {requirements_path}")

subprocess.check_call([
    sys.executable, "-m", "pip", "install", "--no-cache-dir", "-r", requirements_path,
])

print("Kész - a csomagok telepítve.")
