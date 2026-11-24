import { useEffect, useRef } from 'react';

/**
 * Calls `refresh` whenever the browser tab regains focus or becomes visible,
 * so data like stock stays current when a movement was registered in another
 * tab or by another user. Throttled to at most once every 3 seconds.
 */
export default function useRefreshOnFocus(refresh) {
  const ref = useRef(refresh);
  ref.current = refresh;

  useEffect(() => {
    let last = Date.now();
    function handler() {
      if (document.visibilityState !== 'visible') return;
      if (Date.now() - last < 3000) return;
      last = Date.now();
      ref.current();
    }
    window.addEventListener('focus', handler);
    document.addEventListener('visibilitychange', handler);
    return () => {
      window.removeEventListener('focus', handler);
      document.removeEventListener('visibilitychange', handler);
    };
  }, []);
}
