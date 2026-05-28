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

  return null;
};

export default ScrollToHash;
