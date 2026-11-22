"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getRepo, type Repo } from "@/lib/repo";

export interface QueryResult<T> {
  data: T | undefined;
  error: unknown;
  /** True until the first result (or error) for the current inputs arrives. */
  loading: boolean;
  refetch: () => void;
}

/**
 * Runs a repo call, then runs it again whenever data changes anywhere (this tab or another).
 * `initial` lets public pages render real content on the server and in the first client paint.
 * When `deps` change, results from the old inputs are hidden until the new ones arrive.
 */
export function useQuery<T>(
  fetcher: (repo: Repo) => Promise<T>,
  deps: readonly unknown[],
  opts: { initial?: T; enabled?: boolean } = {},
): QueryResult<T> {
  const enabled = opts.enabled ?? true;
  const key = JSON.stringify(deps);
  const hasInitial = opts.initial !== undefined;
  const [result, setResult] = useState<{ key: string | null; data: T | undefined; error: unknown }>({
    key: hasInitial ? key : null,
    data: opts.initial,
    error: undefined,
  });
  const request = useRef(0);
  const fetcherRef = useRef(fetcher);
  const keyRef = useRef(key);

  useEffect(() => {
    fetcherRef.current = fetcher;
    keyRef.current = key;
  });

  const run = useCallback(async () => {
    const id = ++request.current;
    const forKey = keyRef.current;
    try {
      const data = await fetcherRef.current(getRepo());
      if (id !== request.current) return;
      setResult({ key: forKey, data, error: undefined });
    } catch (e) {
      if (id !== request.current) return;
      setResult({ key: forKey, data: undefined, error: e });
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void run();
    const off = getRepo().subscribe(() => void run());
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      request.current++;
      off();
    };
  }, [enabled, key, run]);

  const refetch = useCallback(() => void run(), [run]);
  const current = result.key === key;
  const data = current || hasInitial ? result.data : undefined;
  const error = current ? result.error : undefined;
  return { data, error, loading: enabled && data === undefined && error === undefined, refetch };
}
