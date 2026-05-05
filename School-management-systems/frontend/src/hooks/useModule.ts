/**
 * useModule - Lightweight in-memory cache hook for module-level data.
 *
 * Prevents data from being re-fetched when a user switches back to a module
 * they already visited this session. Data is shared via a global Map that
 * survives React re-mounts (unlike useState which resets on unmount).
 *
 * Usage:
 *   const [data, loading, reload] = useModule('students', () => studentsAPI.getAll());
 */
import { useState, useEffect, useCallback, useRef } from 'react';

type FetchFn<T> = () => Promise<{ data: T }>;

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
interface CacheEntry<T> { data: T; timestamp: number }
const globalCache = new Map<string, CacheEntry<any>>();

export function useModule<T>(
  key: string,
  fetchFn: FetchFn<T>,
  initialState: T
): [T, boolean, () => void] {
  const [data, setData] = useState<T>(() => {
    const cached = globalCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
    return initialState;
  });

  const [loading, setLoading] = useState<boolean>(() => {
    const cached = globalCache.get(key);
    return !(cached && Date.now() - cached.timestamp < CACHE_TTL);
  });

  const mounted = useRef(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchFn();
      const result = (res.data as any)?.results ?? (res.data as any) ?? initialState;
      if (mounted.current) {
        setData(result);
        globalCache.set(key, { data: result, timestamp: Date.now() });
      }
    } catch {
      // silently fail; caller handles toast
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [key, fetchFn]);

  useEffect(() => {
    mounted.current = true;
    const cached = globalCache.get(key);
    if (!cached || Date.now() - cached.timestamp >= CACHE_TTL) {
      fetch();
    }
    return () => { mounted.current = false; };
  }, [key, fetch]);

  const reload = useCallback(() => {
    globalCache.delete(key);
    fetch();
  }, [key, fetch]);

  return [data, loading, reload];
}

/** Invalidate a specific module cache entry (e.g. after mutation) */
export const invalidateModule = (key: string) => globalCache.delete(key);
/** Invalidate all module caches */
export const invalidateAllModules = () => globalCache.clear();
