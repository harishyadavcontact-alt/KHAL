"use client";

import { useCallback, useEffect, useState } from "react";
import type { AppData } from "../../components/war-room-v2/types";

export function useWarRoomData() {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/data");
      if (!response.ok) throw new Error(`Failed loading data (${response.status})`);
      const payload = (await response.json()) as AppData;
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
    void refresh();
  }, [refresh]);

  return { data, setData, loading, error, refresh };
}

