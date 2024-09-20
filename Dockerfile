# syntax=docker/dockerfile:1

# Stage 1: Build and install dependencies
ARG PYTHON_VERSION=3.9.18
FROM python:${PYTHON_VERSION}-slim as builder
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
WORKDIR /app

# Install dependencies
RUN --mount=type=cache,target=/root/.cache/pip \
    python -m pip install --upgrade pip && \
    --mount=type=bind,source=requirements.txt,target=requirements.txt \
    pip install --no-cache-dir -r requirements.txt

# Stage 2: Runtime
FROM python:${PYTHON_VERSION}-slim as runtime
WORKDIR /app
COPY --from=builder /app /app

# Create non-root user
ARG UID=10001
RUN adduser \
    --disabled-password \
    --gecos "" \
    --home "/nonexistent" \
    --shell "/sbin/nologin" \
    --no-create-home \
    --uid "${UID}" \
    appuser

# Copy only necessary files
COPY . .

USER appuser
EXPOSE 8000

# Entrypoint script to perform initial setup like database migrations
COPY ./entrypoint.sh /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]

# Default command to run on container start
CMD ["gunicorn", "-c", "config/gunicorn/prod.py", "-k", "uvicorn.workers.UvicornWorker", "cajulab_remote_sensing_dashboard.asgi:application"]
