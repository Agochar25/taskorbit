import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { cacheGet, cacheSet } from '../storage/cache';

/**
 * Loads data with an offline cache.
 *  - shows cached data instantly (if any), then refreshes from the network
 *  - re-fetches silently whenever the screen regains focus (so edits show up)
 *  - pass cacheKey = null to skip caching (e.g. for search queries)
 * `fromCache` is true while showing saved data that could not be refreshed.
 */
export function useCachedFetch(cacheKey, fetcher, deps = [], { enabled = true } = {}) {
  const { user } = useAuth();
  const [state, setState] = useState({ data: null, loading: true, refreshing: false, error: null, fromCache: false });
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const first = useRef(true);

  const load = useCallback(async (mode) => {
    if (!enabled) { setState((s) => ({ ...s, loading: false })); return; }
    if (mode === 'initial') {
      const cached = cacheKey ? await cacheGet(user.id, cacheKey) : null;
      setState((s) => (cached ? { ...s, data: cached, loading: false, fromCache: true } : { ...s, loading: true, error: null }));
    } else if (mode === 'refresh') {
      setState((s) => ({ ...s, refreshing: true }));
    }
    try {
      const data = await fetcherRef.current();
      if (cacheKey) cacheSet(user.id, cacheKey, data);
      setState({ data, loading: false, refreshing: false, error: null, fromCache: false });
    } catch (error) {
      if (error.code === 'SESSION_EXPIRED') return; // AuthContext already redirects to login
      setState((s) => ({ ...s, loading: false, refreshing: false, error, fromCache: !!s.data }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, user.id, enabled, ...deps]);

  useEffect(() => { first.current = true; load('initial'); }, [load]);
  useFocusEffect(useCallback(() => {
    if (first.current) { first.current = false; return; }
    load('silent');
  }, [load]));

  return { ...state, reload: () => load('initial'), refresh: () => load('refresh') };
}

export function useDebounced(value, ms = 350) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}
