"""Rate limiting middleware and utilities."""
import time
import json
from typing import Dict, Optional, Tuple
from datetime import datetime, timedelta
from fastapi import Request, HTTPException, status
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
import redis


class RedisBackend:
    """Redis backend for rate limiting storage."""
    
    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self.redis_url = redis_url
        self._redis_client = None
    
    @property
    def redis_client(self):
        """Get Redis client (lazy initialization)."""
        if self._redis_client is None:
            try:
                self._redis_client = redis.from_url(self.redis_url, decode_responses=True)
                # Test connection
                self._redis_client.ping()
            except Exception:
                # Fallback to in-memory storage if Redis is not available
                self._redis_client = {}
        return self._redis_client
    
    def get(self, key: str) -> Optional[str]:
        """Get value from Redis."""
        try:
            if isinstance(self.redis_client, dict):
                # In-memory fallback
                data = self.redis_client.get(key)
                if data and data.get('expires_at', 0) > time.time():
                    return data['value']
                elif data:
                    del self.redis_client[key]
                return None
            else:
                return self.redis_client.get(key)
        except Exception:
            return None
    
    def set(self, key: str, value: str, expire: int = 3600) -> bool:
        """Set value in Redis with expiration."""
        try:
            if isinstance(self.redis_client, dict):
                # In-memory fallback
                self.redis_client[key] = {
                    'value': value,
                    'expires_at': time.time() + expire
                }
                return True
            else:
                return self.redis_client.setex(key, expire, value)
        except Exception:
            return False
    
    def delete(self, key: str) -> bool:
        """Delete key from Redis."""
        try:
            if isinstance(self.redis_client, dict):
                # In-memory fallback
                if key in self.redis_client:
                    del self.redis_client[key]
                return True
            else:
                return bool(self.redis_client.delete(key))
        except Exception:
            return False


class CustomLimiter:
    """Custom rate limiter with different strategies."""
    
    def __init__(self, redis_backend: RedisBackend):
        self.backend = redis_backend
    
    def is_allowed(
        self,
        key: str,
        limit: int,
        window: int,
        identifier: Optional[str] = None
    ) -> Tuple[bool, Dict]:
        """Check if request is allowed based on rate limit."""
        if identifier:
            rate_limit_key = f"rate_limit:{identifier}:{key}"
        else:
            rate_limit_key = f"rate_limit:{key}"
        
        current_time = int(time.time())
        window_start = current_time - window
        
        # Get current request data
        current_data = self.backend.get(rate_limit_key)
        
        if current_data:
            try:
                data = json.loads(current_data)
                # Remove old requests outside the window
                data['requests'] = [
                    req_time for req_time in data['requests']
                    if req_time > window_start
                ]
                
                # Check if under limit
                if len(data['requests']) >= limit:
                    return False, {
                        "limit": limit,
                        "remaining": 0,
                        "reset": data['requests'][0] + window,
                        "retry_after": max(1, data['requests'][0] + window - current_time)
                    }
                
                # Add current request
                data['requests'].append(current_time)
                data['count'] = len(data['requests'])
                
            except (json.JSONDecodeError, KeyError):
                # Reset if data is corrupted
                data = {"requests": [current_time], "count": 1}
        else:
            data = {"requests": [current_time], "count": 1}
        
        # Save updated data
        self.backend.set(rate_limit_key, json.dumps(data), window)
        
        return True, {
            "limit": limit,
            "remaining": max(0, limit - len(data['requests'])),
            "reset": current_time + window,
            "retry_after": 0
        }


# Initialize rate limiting components
redis_backend = RedisBackend()
custom_limiter = CustomLimiter(redis_backend)

# SlowAPI limiter for basic rate limiting
limiter = Limiter(key_func=get_remote_address)


def get_rate_limit_strategy(endpoint: str) -> Tuple[int, int]:
    """Get rate limit configuration for an endpoint."""
    strategies = {
        # Authentication endpoints - more restrictive
        "auth_login": (5, 300),      # 5 requests per 5 minutes
        "auth_register": (3, 300),    # 3 requests per 5 minutes
        "auth_signup": (3, 300),      # 3 requests per 5 minutes
        "auth_change_password": (3, 300),  # 3 requests per 5 minutes
        
        # Public endpoints - moderate restriction
        "public_properties": (30, 60),     # 30 requests per minute
        "public_suites": (30, 60),         # 30 requests per minute
        "public_offers_create": (10, 300), # 10 requests per 5 minutes
        
        # API endpoints - higher limits for authenticated users
        "api_properties": (100, 60),       # 100 requests per minute
        "api_suites": (100, 60),           # 100 requests per minute
        "api_offers": (50, 60),            # 50 requests per minute
        "api_invoices": (50, 60),          # 50 requests per minute
        
        # Admin endpoints - very restrictive
        "admin_properties": (200, 60),     # 200 requests per minute
        "admin_offers": (150, 60),         # 150 requests per minute
        "admin_reports": (30, 60),         # 30 requests per minute
        
        # Default strategy
        "default": (60, 60)                # 60 requests per minute
    }
    
    # Find matching strategy
    for pattern, config in strategies.items():
        if pattern in endpoint.lower():
            return config
    
    return strategies["default"]


def rate_limit_middleware(request: Request, call_next):
    """Custom rate limiting middleware."""
    endpoint = request.url.path
    
    # Get rate limit strategy
    limit, window = get_rate_limit_strategy(endpoint)
    
    # Get client identifier
    client_ip = get_remote_address(request)
    user_id = getattr(request.state, 'user_id', None)
    
    identifier = user_id if user_id else client_ip
    
    # Check rate limit
    allowed, info = custom_limiter.is_allowed(endpoint, limit, window, identifier)
    
    # Add rate limit headers
    response_headers = {
        "X-RateLimit-Limit": str(limit),
        "X-RateLimit-Remaining": str(info["remaining"]),
        "X-RateLimit-Reset": str(info["reset"]),
    }
    
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded",
            headers=response_headers
        )
    
    # Process request
    response = call_next(request)
    
    # Add headers to response
    for key, value in response_headers.items():
        response.headers[key] = value
    
    return response


# Rate limit decorators for different endpoint types
def auth_rate_limit(limit: int = 5, window: int = 300):
    """Rate limiting decorator for auth endpoints."""
    def decorator(func):
        return limiter.limit(f"{limit}/{window}")(func)
    return decorator


def public_rate_limit(limit: int = 30, window: int = 60):
    """Rate limiting decorator for public endpoints."""
    def decorator(func):
        return limiter.limit(f"{limit}/{window}")(func)
    return decorator


def api_rate_limit(limit: int = 100, window: int = 60):
    """Rate limiting decorator for API endpoints."""
    def decorator(func):
        return limiter.limit(f"{limit}/{window}")(func)
    return decorator


def admin_rate_limit(limit: int = 200, window: int = 60):
    """Rate limiting decorator for admin endpoints."""
    def decorator(func):
        return limiter.limit(f"{limit}/{window}")(func)
    return decorator


# Rate limit exceeded handler
def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    """Custom handler for rate limit exceeded."""
    return HTTPException(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        detail={
            "error": "Rate limit exceeded",
            "message": "Too many requests. Please try again later.",
            "retry_after": exc.detail.get("retry_after", 60)
        }
    )


class RateLimitMonitor:
    """Monitor rate limiting statistics."""
    
    def __init__(self, redis_backend: RedisBackend):
        self.backend = redis_backend
    
    def get_stats(self) -> Dict:
        """Get rate limiting statistics."""
        try:
            if isinstance(self.backend.redis_client, dict):
                # In-memory fallback
                total_keys = len(self.backend.redis_client)
                active_keys = sum(
                    1 for data in self.backend.redis_client.values()
                    if data.get('expires_at', 0) > time.time()
                )
            else:
                # Redis
                total_keys = self.backend.redis_client.dbsize()
                # This is a simplified approach - in production you might want more sophisticated monitoring
                active_keys = total_keys
            
            return {
                "total_rate_limits": total_keys,
                "active_rate_limits": active_keys,
                "memory_usage": "N/A",  # Would need additional monitoring
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            return {
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
    
    def clear_expired_limits(self) -> int:
        """Clear expired rate limit entries."""
        # This would be more sophisticated with Redis
        return 0


# Global rate limit monitor
rate_limit_monitor = RateLimitMonitor(redis_backend)
