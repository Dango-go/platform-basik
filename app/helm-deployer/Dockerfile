FROM python:3.12-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt


FROM python:3.12-slim AS runner

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/install/bin:$PATH" \
    PYTHONPATH="/app:$PYTHONPATH"

# Install Helm 3 CLI & dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    tar \
    git \
    && curl -fsSL https://get.helm.sh/helm-v3.14.2-linux-amd64.tar.gz -o helm.tar.gz \
    && tar -zxvf helm.tar.gz \
    && mv linux-amd64/helm /usr/local/bin/helm \
    && rm -rf linux-amd64 helm.tar.gz /var/lib/apt/lists/*

# Copy installed Python packages from builder stage
COPY --from=builder /install /install

# Create non-root system user and temporary directories
RUN addgroup --system appgroup && adduser --system --group appuser \
    && mkdir -p /tmp/helm_charts /tmp/kubeconfigs \
    && chown -R appuser:appgroup /tmp/helm_charts /tmp/kubeconfigs

COPY . /app/
RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]