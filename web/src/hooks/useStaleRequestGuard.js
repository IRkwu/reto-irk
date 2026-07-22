import { useCallback, useEffect, useMemo, useRef } from "react";

export function useStaleRequestGuard() {
  const requestIdRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const nextRequestId = useCallback(() => {
    requestIdRef.current += 1;
    return requestIdRef.current;
  }, []);

  const isCurrentRequest = useCallback(
    (requestId) => mountedRef.current && requestId === requestIdRef.current,
    []
  );

  return useMemo(
    () => ({ nextRequestId, isCurrentRequest }),
    [isCurrentRequest, nextRequestId]
  );
}
