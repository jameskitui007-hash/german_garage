FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    default-libmysqlclient-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app code
COPY . .

# Create uploads directory
RUN mkdir -p uploads/products

# Expose port
EXPOSE 8080

# Start command
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]