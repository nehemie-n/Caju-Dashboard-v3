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
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        binutils \
        libproj-dev \
        gdal-bin \
        spatialite-bin \
        libsqlite3-mod-spatialite \
        curl \
        python3-dev \
        default-libmysqlclient-dev \
        pkg-config \
        libpq-dev \
        postgresql-client \
        netcat-traditional \
        nodejs \
        npm \
        gosu \
    && curl -fsSL https://deb.nodesource.com/setup_16.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

# Set environment variables for uv
ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy
ENV PATH="/app/.venv/bin:$PATH"

# Copy pyproject.toml and uv.lock first for better Docker layer caching
COPY pyproject.toml uv.lock /app/
COPY package.json package-lock.json* /app/

# Install Python dependencies using uv
RUN uv sync --frozen --no-dev

# Install Node.js dependencies
RUN npm install

# Copy project
COPY . /app/

# Build frontend assets
RUN npm run build

# Create media and static directories
RUN mkdir -p /app/media /app/staticfiles

# Make entrypoint script executable and fix line endings
RUN sed -i 's/\r$//' /app/entrypoint.sh && chmod +x /app/entrypoint.sh

# Create non-root user
RUN adduser --disabled-password --gecos '' --uid 1000 appuser \
    && chown -R appuser:appuser /app

# Don't switch to appuser yet - we'll handle permissions in entrypoint
# USER appuser

# Expose port
EXPOSE 8000

# Default command
ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["web"]
