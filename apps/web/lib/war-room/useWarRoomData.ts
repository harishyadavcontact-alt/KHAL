"use client";

import { useCallback, useEffect, useState } from "react";
import type { AppData } from "../../components/war-room-v2/types";
import { mockAppData } from "./mock-app-data";

const CACHE_TTL_MS = 20_000;
const SESSION_CACHE_KEY = "khal.warRoomData.cache.v1";
const SESSION_CACHE_MAX_AGE_MS = CACHE_TTL_MS * 6;
let cachedData: AppData | null = null;
let cachedAt = 0;
let inflightRequest: Promise<AppData> | null = null;
const FRONTEND_ONLY_MODE = process.env.NEXT_PUBLIC_FRONTEND_ONLY === "1";

const hasFreshCache = () => cachedData && Date.now() - cachedAt < CACHE_TTL_MS;

type SessionCachePayload = {
  at: number;
  data: AppData;
};

function readSessionCache(): SessionCachePayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SessionCachePayload;
    if (!parsed?.at || !parsed?.data) return null;
    if (Date.now() - parsed.at > SESSION_CACHE_MAX_AGE_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeSessionCache(payload: SessionCachePayload) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Best effort cache persistence.
  }
}

function hydrateModuleCacheFromSession() {
  if (cachedData) return;
  const sessionCache = readSessionCache();
  if (!sessionCache) return;
  cachedData = sessionCache.data;
  cachedAt = sessionCache.at;
}

async function fetchWarRoomData(): Promise<AppData> {
  if (FRONTEND_ONLY_MODE) {
    return mockAppData;
  }

  hydrateModuleCacheFromSession();
  if (hasFreshCache()) return cachedData as AppData;
  if (inflightRequest) return inflightRequest;

  inflightRequest = (async () => {
    const response = await fetch("/api/war-room-data", { method: "GET" });
    if (!response.ok) throw new Error(`Failed loading data (${response.status})`);
    const payload = (await response.json()) as AppData;
    const now = Date.now();
    cachedData = payload;
    cachedAt = now;
    writeSessionCache({ at: now, data: payload });
    return payload;
  })();

  try {
    return await inflightRequest;
  } finally {
    inflightRequest = null;
  }
}

export async function prewarmWarRoomData() {
  try {
    await fetchWarRoomData();
  } catch {
    // Prefetch should not impact UX flow.
  }
}

export function useWarRoomData() {
  hydrateModuleCacheFromSession();
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
