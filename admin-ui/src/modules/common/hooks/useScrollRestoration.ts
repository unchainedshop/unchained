import { useEffect } from 'react';
import { useRouter } from 'next/router';

// Module-level cache of the last scroll position per list route. It persists
// across the inline list <-> detail remount: on the products and orders index
// pages the detail view is rendered on the *same* route via a query param
// (e.g. `/products?slug=…`), so the list subtree unmounts on the way in and
// remounts on the way back, losing its scroll position.
const scrollPositions = new Map<string, number>();

/**
 * Preserves and restores the window scroll position of a list page whose detail
 * view is rendered inline on the same route. Without it, returning from a detail
 * view (browser back or the breadcrumb link) drops the user at the top of the
 * list instead of where they left off. The already-loaded rows survive in the
 * Apollo cache, so only the scroll position needs restoring.
 *
 * @param isActive whether the list (not the inline detail) is currently shown.
 */
const useScrollRestoration = (isActive: boolean) => {
  const router = useRouter();
  const key = router.pathname;

  // Save the scroll position when we navigate away while the list is shown.
  // routeChangeStart fires before Next.js scrolls the next view to the top, so
  // window.scrollY here is still the list's position (e.g. the moment the user
  // clicks into a detail view).
  useEffect(() => {
    if (!isActive || typeof window === 'undefined') return undefined;
    const save = () => {
      scrollPositions.set(key, window.scrollY);
    };
    router.events.on('routeChangeStart', save);
    return () => {
      router.events.off('routeChangeStart', save);
    };
  }, [isActive, key, router.events]);

  // Restore the saved position once the list is shown again. Retry across a few
  // animation frames so the restore still sticks after the (cached) list has
  // rendered enough rows for the document to be tall enough to scroll, and to
  // win against Next.js' default scroll-to-top on the returning navigation.
  useEffect(() => {
    if (!isActive || typeof window === 'undefined') return undefined;
    const target = scrollPositions.get(key);
    if (!target) return undefined;

    let frame: number;
    let attempts = 0;
    const restore = () => {
      window.scrollTo(0, target);
      attempts += 1;
      if (Math.abs(window.scrollY - target) > 2 && attempts < 30) {
        frame = requestAnimationFrame(restore);
      }
    };
    frame = requestAnimationFrame(restore);
    return () => cancelAnimationFrame(frame);
  }, [isActive, key]);
};

export default useScrollRestoration;
