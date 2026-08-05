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


# Deorator to wrap functions and measure metrics. Used in secrity.py for encrypt and decrypt functions
def wrapper_metrics(operation_name: str):
    def metric_decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Start time
            start_time = time.time()
            # Execute the function and handle metrics
            try:
                result = await func(*args, **kwargs) if asyncio.iscoroutinefunction(func) else func(*args, **kwargs)

                diff_time  = time.time() - start_time
                VAULT_REQUESTS_TOTAL.labels(operation=operation_name, status="success").inc()
                VAULT_REQUEST_DURATION_SECONDS.labels(operation=operation_name).observe(diff_time)

                return result # Return main function result in decorator
            
            except Exception as e:
                diff_time = time.time() - start_time
                VAULT_REQUEST_DURATION_SECONDS.labels(operation=operation_name).observe(diff_time)
                VAULT_REQUESTS_TOTAL.labels(operation=operation_name, status="error").inc()
                raise e
        return wrapper
    return metric_decorator
 

 
