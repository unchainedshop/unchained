import { useEffect } from 'react';
import Router from 'next/router';

const RESTORE_TIMEOUT_MS = 5000;

interface ScrollPosition {
  x: number;
  y: number;
}

const readHistoryPosition = (): ScrollPosition | undefined => {
  // This storage format and history key belong to the Pages Router's
  // experimental.scrollRestoration feature enabled in next.config.js.
  // Reuse its per-entry positions so separate visits to one URL stay distinct.
  const key = window.history.state?.key;
  if (typeof key !== 'string') return;
  try {
    const position = JSON.parse(sessionStorage.getItem(`__next_scroll_${key}`));
    if (
      Number.isFinite(position?.x) &&
      Number.isFinite(position?.y) &&
      position.x >= 0 &&
      position.y >= 0
    ) {
      return position;
    }
  } catch {
    // Missing, malformed, or unavailable storage leaves restoration to Next.
  }
};

const restoreWhenReady = ({ x, y }: ScrollPosition) => {
  const deadline = performance.now() + RESTORE_TIMEOUT_MS;
  let frame = 0;
  let previousMaxY = -1;

  const cancel = () => {
    cancelAnimationFrame(frame);
    window.removeEventListener('wheel', cancel);
    window.removeEventListener('touchstart', cancel);
    window.removeEventListener('keydown', cancel);
  };

  const attempt = () => {
    const maxY = Math.max(
      document.documentElement.scrollHeight - window.innerHeight,
      0,
    );
    if (maxY >= y || performance.now() >= deadline) {
      window.scrollTo(x, Math.min(y, maxY));
      cancel();
    } else {
      // Let new content render for a frame before following the list's bottom.
      // Its IntersectionObserver must see the sentinel leave the viewport
      // before scrolling back to it can request the next page.
      if (maxY === previousMaxY) window.scrollTo(x, maxY);
      previousMaxY = maxY;
      frame = requestAnimationFrame(attempt);
    }
  };

  window.addEventListener('wheel', cancel, { passive: true });
  window.addEventListener('touchstart', cancel, { passive: true });
  window.addEventListener('keydown', cancel);
  frame = requestAnimationFrame(attempt);
  return cancel;
};

/**
 * Next restores before asynchronously fetched lists have rendered, which clamps
 * the saved position to the top. Retry that same history entry's position while
 * the list grows, stopping when the user scrolls or starts another navigation.
 */
const useScrollRestoration = () => {
  useEffect(() => {
    let historyTarget: { url: string; position: ScrollPosition } | undefined;
    let routeTarget: typeof historyTarget;
    let cancelRestore: (() => void) | undefined;

    const reset = () => {
      historyTarget = undefined;
      routeTarget = undefined;
      cancelRestore?.();
      cancelRestore = undefined;
    };

    Router.beforePopState(({ as }) => {
      const position = readHistoryPosition();
      historyTarget = position ? { url: as, position } : undefined;
      return true;
    });

    const onRouteChangeStart = (url: string) => {
      const target = historyTarget;
      reset();
      if (target?.url === url) routeTarget = target;
    };

    const onRouteChangeComplete = (url: string) => {
      const target = routeTarget;
      reset();
      if (target?.url === url) {
        cancelRestore = restoreWhenReady(target.position);
      }
    };

    Router.events.on('routeChangeStart', onRouteChangeStart);
    Router.events.on('routeChangeComplete', onRouteChangeComplete);
    Router.events.on('routeChangeError', reset);
    Router.events.on('hashChangeStart', reset);

    return () => {
      reset();
      Router.beforePopState(() => true);
      Router.events.off('routeChangeStart', onRouteChangeStart);
      Router.events.off('routeChangeComplete', onRouteChangeComplete);
      Router.events.off('routeChangeError', reset);
      Router.events.off('hashChangeStart', reset);
    };
  }, []);
};

export default useScrollRestoration;
