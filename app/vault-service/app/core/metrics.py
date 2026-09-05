import asyncio

from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from fastapi import Response
import time
from functools import wraps

VAULT_REQUESTS_TOTAL = Counter(
    "vault_request_total",
    "Total requests to vault-service operations",
    ["operation", "status"]
)

VAULT_REQUEST_DURATION_SECONDS = Histogram(
    "vault_request_duration_seconds",
    "Duration of vault-service operations in seconds",
    ["operation"]
)


# Decorator to wrap functions and measure metrics.
def wrapper_metrics(operation_name: str):
    def metric_decorator(func):
        if asyncio.iscoroutinefunction(func):
            @wraps(func)
            async def wrapper(*args, **kwargs):
                start_time = time.time()
                try:
                    result = await func(*args, **kwargs)
                    diff_time = time.time() - start_time
                    VAULT_REQUESTS_TOTAL.labels(operation=operation_name, status="success").inc()
                    VAULT_REQUEST_DURATION_SECONDS.labels(operation=operation_name).observe(diff_time)
                    return result
                except Exception as e:
                    diff_time = time.time() - start_time
                    VAULT_REQUEST_DURATION_SECONDS.labels(operation=operation_name).observe(diff_time)
                    VAULT_REQUESTS_TOTAL.labels(operation=operation_name, status="error").inc()
                    raise e
            return wrapper
        else:
            @wraps(func)
            def wrapper(*args, **kwargs):
                start_time = time.time()
                try:
                    result = func(*args, **kwargs)
                    diff_time = time.time() - start_time
                    VAULT_REQUESTS_TOTAL.labels(operation=operation_name, status="success").inc()
                    VAULT_REQUEST_DURATION_SECONDS.labels(operation=operation_name).observe(diff_time)
                    return result
                except Exception as e:
                    diff_time = time.time() - start_time
                    VAULT_REQUEST_DURATION_SECONDS.labels(operation=operation_name).observe(diff_time)
                    VAULT_REQUESTS_TOTAL.labels(operation=operation_name, status="error").inc()
                    raise e
            return wrapper
    return metric_decorator
 

 
