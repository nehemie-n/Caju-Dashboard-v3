# syntax=docker/dockerfile:1

# Use Python 3.12.3 as specified in the CI workflow
FROM python:3.12.3-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DJANGO_ENV=production

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    binutils \
    libproj-dev \
    gdal-bin \
    spatialite-bin \
    libsqlite3-mod-spatialite \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 16 for frontend build
RUN curl -fsSL https://deb.nodesource.com/setup_16.x | bash - \
    && apt-get install -y nodejs

# Install uv
RUN pip install uv

# Copy dependency files
COPY pyproject.toml uv.lock ./
COPY package.json package-lock.json* ./

# Install Python dependencies with uv
RUN uv sync --frozen

# Install Node.js dependencies and build frontend assets
RUN npm install && npm run build

# Copy project files
COPY . .

# Create cache table directory and collect static files
RUN mkdir -p /app/staticfiles

# Create non-root user
RUN adduser --disabled-password --gecos '' --uid 1000 appuser \
    && chown -R appuser:appuser /app

USER appuser

# Expose port
EXPOSE 8000

# Use the entrypoint script
ENTRYPOINT ["./entrypoint.sh"]

# Default command
CMD ["uv", "run", "gunicorn", "-c", "config/gunicorn/prod.py", "-k", "uvicorn.workers.UvicornWorker", "cajulab_remote_sensing_dashboard.asgi:application"]
