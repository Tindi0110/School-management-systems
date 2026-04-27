#!/usr/bin/env bash
# Triggering new build - 2026-04-28 (Finance & Student Stability Sync)
# exit on error
set -o errexit

pip install -r requirements.txt

python manage.py collectstatic --no-input
python manage.py migrate
