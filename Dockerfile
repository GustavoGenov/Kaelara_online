# Dockerfile
# Use Ubuntu 22.04 as base for ROCm support
FROM ubuntu:22.04

# Set non‑interactive mode for apt
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3-pip python3-venv git curl wget gnupg2 ca-certificates \
    build-essential libssl-dev libffi-dev \
    # OpenCL / ROCm runtime (AMD GPU)
    rocm-dev rocm-opencl rocm-utils \
    # Chrome for Playwright
    google-chrome-stable \
    # FFmpeg for audio processing
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt /app/requirements.txt
WORKDIR /app
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# Expose the port the app runs on
EXPOSE 8080

# Default command (Render will override with gunicorn)
CMD ["gunicorn", "kaelara.app:app", "--bind", "0.0.0.0:8080"]
