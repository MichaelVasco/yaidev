import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Handles two things:
 * 1. Scroll to top on route change when no hash is present.
 * 2. Smooth-scroll to the element matching the URL hash after navigation
 *    (works for cross-route hash links like "/#about" when user is on /dashboard).
 */
const ScrollToHash = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.replace("#", "");
      // Retry briefly in case the target section mounts after route change.
      let attempts = 0;
      const tryScroll = () => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
          return;
        }
        if (attempts++ < 20) setTimeout(tryScroll, 60);
      };
      tryScroll();
    } else {
      window.scrollTo({ top: 0, left: 0 });
    }
  }, [pathname, hash]);

  useEffect(() => {
    const handleNativeHashClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest<HTMLAnchorElement>('a[href^="#"], a[href^="/#"]');
      if (!anchor) return;
      const url = new URL(anchor.href, window.location.origin);
      if (url.origin !== window.location.origin || !url.hash) return;
      if (window.location.pathname !== url.pathname) return;
      const el = document.getElementById(url.hash.slice(1));
      if (!el) return;
      event.preventDefault();
      window.history.pushState(null, "", `${url.pathname}${url.hash}`);
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    document.addEventListener("click", handleNativeHashClick);
    return () => document.removeEventListener("click", handleNativeHashClick);
  }, []);

  return null;
};

export default ScrollToHash;
