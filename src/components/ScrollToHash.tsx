import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * Handles two things:
 * 1. Scroll to top on route change when no hash is present.
 * 2. Smooth-scroll to the element matching the URL hash after navigation
 *    (works for cross-route hash links like "/#about" when user is on /dashboard).
 */
const ScrollToHash = () => {
  const { pathname, hash } = useLocation();
  const navigate = useNavigate();

  const scrollToHash = (targetHash: string) => {
    const id = targetHash.replace("#", "");
    let attempts = 0;
    const tryScroll = () => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      if (attempts++ < 24) window.setTimeout(tryScroll, 50);
    };
    tryScroll();
  };

  useEffect(() => {
    if (hash) {
      scrollToHash(hash);
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
      event.preventDefault();
      navigate(`${url.pathname}${url.search}${url.hash}`);
      window.setTimeout(() => scrollToHash(url.hash), 0);
    };

    document.addEventListener("click", handleNativeHashClick);
    return () => document.removeEventListener("click", handleNativeHashClick);
  }, [navigate]);

  return null;
};

export default ScrollToHash;
