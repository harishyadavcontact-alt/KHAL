"use client";

import { useEffect, useState } from "react";

async function parseJsonSafely(res: Response): Promise<any> {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { error: `Unexpected response (${res.status})` };
  }
}

export function useApiState() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch("/api/state")
      .then(async (res) => {
        const body = await parseJsonSafely(res);
        if (!res.ok) {
          throw new Error(body.error || "Failed to load state");
        }
        if (body?.error) {
          throw new Error(body.error);
        }
        return body;
      })
      .then((json) => {
        if (!mounted) return;
        setData(json);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.message);
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return { data, loading, error, setData };
}
