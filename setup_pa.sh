#!/bin/bash
echo "=== Configurando Caminos del Bienestar en PythonAnywhere ==="
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_data
python manage.py collectstatic --noinput
echo "=== ¡Listo! Ahora configura la pestaña Web en PythonAnywhere ==="

