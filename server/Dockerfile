# Dockerfile for Django REST Framework backend
FROM python:3.13-slim
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
WORKDIR /app
COPY requirements.txt /app/
RUN pip install --upgrade pip && pip install -r requirements.txt
COPY . /app/
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000"]
