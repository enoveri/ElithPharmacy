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

# Expose any necessary ports
# EXPOSE 8000  # Uncomment if your backend exposes any ports

# Command to run the sync script
CMD ["python", "sync.py", "--sync"] 