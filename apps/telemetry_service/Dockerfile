FROM python:3.11-slim

# Install runtime deps
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir fastapi==0.115.0 uvicorn[standard]==0.30.6 httpx==0.27.2

WORKDIR /app
COPY main.py /app/main.py

ENV PORT=8082
EXPOSE 8082

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8082"]
