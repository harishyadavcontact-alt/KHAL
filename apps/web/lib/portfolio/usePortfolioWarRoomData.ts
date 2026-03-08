"use client";

import { useCallback, useEffect, useState } from "react";
import type { PortfolioProjectDetailSnapshot, PortfolioWarRoomSnapshot } from "./models";

const CACHE_TTL_MS = 20_000;
const SESSION_CACHE_KEY = "khal.portfolioWarRoom.cache.v1";
const SESSION_CACHE_MAX_AGE_MS = CACHE_TTL_MS * 6;

let cachedSnapshot: PortfolioWarRoomSnapshot | null = null;
let cachedAt = 0;
let inflightSnapshot: Promise<PortfolioWarRoomSnapshot> | null = null;

type SessionCachePayload = {
  at: number;
  data: PortfolioWarRoomSnapshot;
};

function hasFreshCache() {
  return cachedSnapshot && Date.now() - cachedAt < CACHE_TTL_MS;
}

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
    // Best effort cache.
  }
}

function hydrateModuleCacheFromSession() {
  if (cachedSnapshot) return;
  const sessionCache = readSessionCache();
  if (!sessionCache) return;
  cachedSnapshot = sessionCache.data;
  cachedAt = sessionCache.at;
}

async function fetchPortfolioSnapshot(): Promise<PortfolioWarRoomSnapshot> {
  hydrateModuleCacheFromSession();
  if (hasFreshCache()) return cachedSnapshot as PortfolioWarRoomSnapshot;
  if (inflightSnapshot) return inflightSnapshot;

  inflightSnapshot = (async () => {
    const response = await fetch("/api/portfolio", { method: "GET", cache: "no-store" });
    if (!response.ok) throw new Error(`Failed loading portfolio snapshot (${response.status})`);
    const payload = (await response.json()) as PortfolioWarRoomSnapshot;
    const now = Date.now();
    cachedSnapshot = payload;
    cachedAt = now;
    writeSessionCache({ at: now, data: payload });
    return payload;
  })();

  try {
    return await inflightSnapshot;
  } finally {
    inflightSnapshot = null;
  }
}

export function usePortfolioWarRoomData() {
  hydrateModuleCacheFromSession();
  const [data, setData] = useState<PortfolioWarRoomSnapshot | null>(cachedSnapshot);
  const [loading, setLoading] = useState(!cachedSnapshot);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (opts?: { force?: boolean }) => {
    if (opts?.force) cachedAt = 0;
    if (!cachedSnapshot) setLoading(true);
    setError(null);
    try {
      const payload = await fetchPortfolioSnapshot();
      setData(payload);
      return payload;
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Failed to load Portfolio War Room.";
      setError(message);
      throw cause;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (cachedSnapshot) {
      setData(cachedSnapshot);
      setLoading(false);
      if (!hasFreshCache()) void refresh();
      return;
    }
    void refresh();
  }, [refresh]);

  return { data, setData, loading, error, refresh };
}

export function usePortfolioProjectDetail(slug: string) {
  const [data, setData] = useState<PortfolioProjectDetailSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/portfolio/${encodeURIComponent(slug)}`, { method: "GET", cache: "no-store" });
      const payload = (await response.json()) as PortfolioProjectDetailSnapshot & { error?: string };
      if (!response.ok || payload.error) throw new Error(payload.error ?? `Failed loading portfolio project (${response.status})`);
      setData(payload);
      return payload;
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Failed to load portfolio project.";
      setError(message);
      throw cause;
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, setData, loading, error, refresh };
}
