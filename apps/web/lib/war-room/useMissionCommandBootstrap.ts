"use client";

import { useCallback, useEffect, useState } from "react";
import type { AppData } from "../../components/war-room-v2/types";

export function useMissionCommandBootstrap() {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/mission-command/bootstrap", { method: "GET" });
      if (!response.ok) throw new Error(`Failed loading mission bootstrap (${response.status})`);
      const payload = (await response.json()) as AppData;
      setData(payload);
      return payload;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load Mission Command bootstrap";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}
