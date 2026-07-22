import { useCallback, useEffect, useState } from "react";

export function useAsync(loader) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const nextData = await loader();
      setData(nextData);
      return nextData;
    } catch (caughtError) {
      setError(caughtError);
      throw caughtError;
    } finally {
      setLoading(false);
    }
  }, [loader]);

  useEffect(() => {
    reload().catch(() => {});
  }, [reload]);

  return { data, setData, error, loading, reload };
}
