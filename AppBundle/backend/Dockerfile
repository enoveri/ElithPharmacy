# Base image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy requirements file
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Set environment variables
ENV PYTHONUNBUFFERED=1

# Note: When connecting to local Supabase from Docker,
# host.docker.internal is used to access the host machine
# This is handled in config.py

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD ps aux | grep "[p]ython sync.py" || exit 1

# Command to run the sync script
CMD ["python", "sync.py", "--sync"] 