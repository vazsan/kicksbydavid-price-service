"""
cPanel Python App (Passenger) ezt a fájlt keresi automatikusan.
A "Setup Python App" felületen a "Application startup file" mezőbe ezt írd:
passenger_wsgi.py, az "Application Entry point"-ba pedig: application
"""
from telegram_bot import app as application
