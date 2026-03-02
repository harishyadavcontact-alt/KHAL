"use client";

import { useCallback, useEffect, useState } from "react";
import type { AppData } from "../../components/war-room-v2/types";

const CACHE_TTL_MS = 20_000;
let cachedData: AppData | null = null;
let cachedAt = 0;
let inflightRequest: Promise<AppData> | null = null;

const hasFreshCache = () => cachedData && Date.now() - cachedAt < CACHE_TTL_MS;

async function fetchWarRoomData(): Promise<AppData> {
  if (hasFreshCache()) return cachedData as AppData;
  if (inflightRequest) return inflightRequest;

  inflightRequest = (async () => {
    const response = await fetch("/api/data");
    if (!response.ok) throw new Error(`Failed loading data (${response.status})`);
    const payload = (await response.json()) as AppData;
    cachedData = payload;
    cachedAt = Date.now();
    return payload;
  })();

  try {
    return await inflightRequest;
  } finally {
    inflightRequest = null;
  }
}

export function useWarRoomData() {
  const [data, setData] = useState<AppData | null>(cachedData);
  const [loading, setLoading] = useState(!cachedData);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (opts?: { force?: boolean }) => {
    const force = Boolean(opts?.force);
    if (!cachedData) setLoading(true);
    setError(null);
    try {
      if (force) {
        cachedAt = 0;
      }
      const payload = await fetchWarRoomData();
      setData(payload);
      return payload;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load War Room data";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (cachedData) {
      setData(cachedData);
      setLoading(false);
      if (!hasFreshCache()) void refresh();
      return;
    }
    void refresh();
  }, [refresh]);

  return { data, setData, loading, error, refresh };
}
