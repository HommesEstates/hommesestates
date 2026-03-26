"""Redis caching service for performance optimization."""
import json
import pickle
import hashlib
from typing import Any, Optional, Union, List, Dict
from datetime import datetime, timedelta
from functools import wraps
import redis
from fastapi import Request, HTTPException, status

from ..config import settings


class CacheService:
    """Redis-based caching service with fallback to in-memory storage."""
    
    def __init__(self, redis_url: str = None, default_ttl: int = 3600):
        self.redis_url = redis_url or getattr(settings, 'redis_url', 'redis://localhost:6379')
        self.default_ttl = default_ttl
        self._redis_client = None
        self._memory_cache = {}  # Fallback in-memory cache
        self._memory_cache_times = {}  # Track expiration for memory cache
    
    @property
    def redis_client(self):
        """Get Redis client with lazy initialization and fallback."""
        if self._redis_client is None:
            try:
                self._redis_client = redis.from_url(
                    self.redis_url,
                    decode_responses=False,  # Keep binary data for pickle
                    socket_timeout=5,
                    socket_connect_timeout=5,
                    retry_on_timeout=True
                )
                # Test connection
                self._redis_client.ping()
                print("✅ Redis connected successfully")
            except Exception as e:
                print(f"⚠️ Redis not available, using in-memory cache: {e}")
                self._redis_client = False  # Mark as unavailable
        return self._redis_client if self._redis_client is not False else None
    
    def _get_memory_cache(self, key: str) -> Optional[Any]:
        """Get value from in-memory cache with expiration check."""
        if key in self._memory_cache and key in self._memory_cache_times:
            if datetime.utcnow() < self._memory_cache_times[key]:
                return self._memory_cache[key]
            else:
                # Expired, remove it
                del self._memory_cache[key]
                del self._memory_cache_times[key]
        return None
    
    def _set_memory_cache(self, key: str, value: Any, ttl: int) -> None:
        """Set value in in-memory cache with expiration."""
        self._memory_cache[key] = value
        self._memory_cache_times[key] = datetime.utcnow() + timedelta(seconds=ttl)
    
    def _delete_memory_cache(self, key: str) -> None:
        """Delete key from in-memory cache."""
        if key in self._memory_cache:
            del self._memory_cache[key]
        if key in self._memory_cache_times:
            del self._memory_cache_times[key]
    
    def _serialize(self, value: Any) -> bytes:
        """Serialize value for storage."""
        try:
            return pickle.dumps(value)
        except (pickle.PickleError, AttributeError):
            # Fallback to JSON for simple types
            return json.dumps(value).encode('utf-8')
    
    def _deserialize(self, value: bytes) -> Any:
        """Deserialize value from storage."""
        try:
            return pickle.loads(value)
        except (pickle.PickleError, AttributeError, UnicodeDecodeError):
            # Fallback to JSON
            try:
                return json.loads(value.decode('utf-8'))
            except (json.JSONDecodeError, UnicodeDecodeError):
                return value.decode('utf-8') if isinstance(value, bytes) else value
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache."""
        # Try Redis first
        if self.redis_client:
            try:
                value = self.redis_client.get(key)
                if value is not None:
                    return self._deserialize(value)
            except Exception:
                pass  # Fall back to memory cache
        
        # Fallback to in-memory cache
        return self._get_memory_cache(key)
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Set value in cache."""
        ttl = ttl or self.default_ttl
        serialized_value = self._serialize(value)
        
        # Try Redis first
        if self.redis_client:
            try:
                return self.redis_client.setex(key, ttl, serialized_value)
            except Exception:
                pass  # Fall back to memory cache
        
        # Fallback to in-memory cache
        self._set_memory_cache(key, value, ttl)
        return True
    
    def delete(self, key: str) -> bool:
        """Delete key from cache."""
        success = False
        
        # Try Redis first
        if self.redis_client:
            try:
                success = bool(self.redis_client.delete(key))
            except Exception:
                pass
        
        # Also delete from memory cache
        self._delete_memory_cache(key)
        
        return success
    
    def exists(self, key: str) -> bool:
        """Check if key exists in cache."""
        # Try Redis first
        if self.redis_client:
            try:
                return bool(self.redis_client.exists(key))
            except Exception:
                pass
        
        # Fallback to memory cache
        return key in self._memory_cache and key in self._memory_cache_times
    
    def expire(self, key: str, ttl: int) -> bool:
        """Set expiration for existing key."""
        if self.redis_client:
            try:
                return self.redis_client.expire(key, ttl)
            except Exception:
                pass
        
        # Update memory cache expiration
        if key in self._memory_cache:
            self._memory_cache_times[key] = datetime.utcnow() + timedelta(seconds=ttl)
            return True
        
        return False
    
    def clear_pattern(self, pattern: str) -> int:
        """Clear all keys matching pattern."""
        count = 0
        
        # Try Redis first
        if self.redis_client:
            try:
                keys = self.redis_client.keys(pattern)
                if keys:
                    count = self.redis_client.delete(*keys)
            except Exception:
                pass
        
        # Also clear from memory cache
        keys_to_delete = []
        for key in self._memory_cache.keys():
            if self._match_pattern(key, pattern):
                keys_to_delete.append(key)
        
        for key in keys_to_delete:
            self._delete_memory_cache(key)
            count += 1
        
        return count
    
    def _match_pattern(self, key: str, pattern: str) -> bool:
        """Simple pattern matching for memory cache."""
        import fnmatch
        return fnmatch.fnmatch(key, pattern)
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        stats = {
            "redis_available": self.redis_client is not None,
            "memory_cache_size": len(self._memory_cache),
            "memory_cache_keys": list(self._memory_cache.keys()),
            "timestamp": datetime.utcnow().isoformat()
        }
        
        if self.redis_client:
            try:
                info = self.redis_client.info()
                stats.update({
                    "redis_used_memory": info.get('used_memory_human'),
                    "redis_connected_clients": info.get('connected_clients'),
                    "redis_total_commands_processed": info.get('total_commands_processed'),
                })
            except Exception:
                pass
        
        return stats


# Global cache service instance
cache = CacheService()


def cache_key(*args, **kwargs) -> str:
    """Generate cache key from function arguments."""
    key_parts = []
    
    # Add positional arguments
    for arg in args:
        if isinstance(arg, (str, int, float, bool)):
            key_parts.append(str(arg))
        else:
            # Hash complex objects
            key_parts.append(hashlib.md5(str(arg).encode()).hexdigest()[:8])
    
    # Add keyword arguments
    for k, v in sorted(kwargs.items()):
        key_parts.append(f"{k}={v}")
    
    return ":".join(key_parts)


def cached(
    ttl: int = 3600,
    key_prefix: str = "",
    cache_none: bool = False,
    cache_empty: bool = True
):
    """Decorator to cache function results."""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key
            func_key = f"{key_prefix}:{func.__name__}:{cache_key(*args, **kwargs)}"
            
            # Try to get from cache
            cached_result = cache.get(func_key)
            if cached_result is not None:
                return cached_result
            
            # Execute function
            result = func(*args, **kwargs)
            
            # Cache the result
            if result is not None or cache_none:
                if result or cache_empty:
                    cache.set(func_key, result, ttl)
            
            return result
        
        def invalidate(*args, **kwargs):
            """Invalidate cache for this function."""
            func_key = f"{key_prefix}:{func.__name__}:{cache_key(*args, **kwargs)}"
            cache.delete(func_key)
        
        wrapper.invalidate_cache = invalidate
        wrapper.cache_key = lambda *args, **kwargs: f"{key_prefix}:{func.__name__}:{cache_key(*args, **kwargs)}"
        
        return wrapper
    return decorator


def cache_response(ttl: int = 3600, key_func=None):
    """Decorator to cache FastAPI response data."""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract request if available
            request = None
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                    break
            
            # Generate cache key
            if key_func:
                cache_key_data = key_func(*args, **kwargs)
            elif request:
                # Use request path and query params
                cache_key_data = f"{request.url.path}:{request.url.query}"
            else:
                cache_key_data = f"{func.__name__}:{cache_key(*args, **kwargs)}"
            
            func_key = f"response:{func.__name__}:{cache_key_data}"
            
            # Try to get from cache
            cached_response = cache.get(func_key)
            if cached_response is not None:
                return cached_response
            
            # Execute function
            result = await func(*args, **kwargs)
            
            # Cache the result
            cache.set(func_key, result, ttl)
            
            return result
        
        return wrapper
    return decorator


class QueryCache:
    """Specialized cache for database queries."""
    
    def __init__(self, cache_service: CacheService):
        self.cache = cache_service
    
    def get_property(self, property_id: int) -> Optional[Dict]:
        """Get cached property data."""
        return self.cache.get(f"property:{property_id}")
    
    def set_property(self, property_id: int, data: Dict, ttl: int = 1800) -> None:
        """Cache property data (30 minutes default)."""
        self.cache.set(f"property:{property_id}", data, ttl)
    
    def get_suite(self, suite_id: int) -> Optional[Dict]:
        """Get cached suite data."""
        return self.cache.get(f"suite:{suite_id}")
    
    def set_suite(self, suite_id: int, data: Dict, ttl: int = 1800) -> None:
        """Cache suite data (30 minutes default)."""
        self.cache.set(f"suite:{suite_id}", data, ttl)
    
    def get_properties_list(self, filters: Dict) -> Optional[List[Dict]]:
        """Get cached properties list."""
        key = f"properties:list:{hashlib.md5(str(filters).encode()).hexdigest()}"
        return self.cache.get(key)
    
    def set_properties_list(self, filters: Dict, data: List[Dict], ttl: int = 600) -> None:
        """Cache properties list (10 minutes default)."""
        key = f"properties:list:{hashlib.md5(str(filters).encode()).hexdigest()}"
        self.cache.set(key, data, ttl)
    
    def invalidate_property(self, property_id: int) -> None:
        """Invalidate all cache entries for a property."""
        patterns = [
            f"property:{property_id}",
            f"properties:list:*"  # This would need more sophisticated pattern matching in Redis
        ]
        for pattern in patterns:
            self.cache.clear_pattern(pattern)
    
    def invalidate_suite(self, suite_id: int) -> None:
        """Invalidate all cache entries for a suite."""
        patterns = [
            f"suite:{suite_id}",
            f"properties:list:*"
        ]
        for pattern in patterns:
            self.cache.clear_pattern(pattern)


# Global query cache instance
query_cache = QueryCache(cache)


def get_cache_service() -> CacheService:
    """Dependency to get cache service."""
    return cache


def get_query_cache() -> QueryCache:
    """Dependency to get query cache."""
    return query_cache
