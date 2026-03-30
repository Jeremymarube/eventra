# Performance monitoring utility
from functools import wraps
from time import time
import logging

logger = logging.getLogger(__name__)

def performance_monitor(func):
    """Decorator to monitor function performance"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time()
        try:
            result = func(*args, **kwargs)
            end_time = time()
            duration = end_time - start_time

            # Log slow queries (>100ms)
            if duration > 0.1:
                logger.info(".2f")

            return result
        except Exception as e:
            end_time = time()
            duration = end_time - start_time
            logger.error(".2f")
            raise e
    return wrapper

# Example usage (can be applied to slow endpoints):
# @performance_monitor
# def slow_endpoint():
#     pass
