# Use Python 3.12 slim image to save space
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install system dependencies if required by psycopg or others
RUN apt-get update && apt-get install -y libpq-dev gcc && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY req.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r req.txt

# Copy the rest of the microservices code
COPY . .

# Hugging Face Spaces require running on port 7860
EXPOSE 7860

# Run the FastAPI server via Uvicorn
CMD ["uvicorn", "backend:app", "--host", "0.0.0.0", "--port", "7860"]
