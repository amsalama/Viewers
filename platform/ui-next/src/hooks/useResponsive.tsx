import { useState, useEffect } from 'react';

export interface ResponsiveState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isPortrait: boolean;
  isLandscape: boolean;
  width: number;
  height: number;
  breakpoint: 'mobile' | 'tablet' | 'desktop';
}

// Breakpoint definitions (matching Tailwind config)
const BREAKPOINTS = {
  mobile: 640, // < 640px
  tablet: 1024, // 640px - 1023px
  desktop: 1024, // >= 1024px
};

/**
 * Hook to detect responsive breakpoints and device orientation
 * Provides real-time updates on screen size and device type
 */
export function useResponsive(): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>(() => {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isPortrait: false,
        isLandscape: true,
        width: 1920,
        height: 1080,
        breakpoint: 'desktop',
      };
    }

    return getResponsiveState();
  });

  useEffect(() => {
    // Update state on window resize
    const handleResize = () => {
      setState(getResponsiveState());
    };

    // Update state on orientation change
    const handleOrientationChange = () => {
      setState(getResponsiveState());
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    // Initial measurement
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return state;
}

function getResponsiveState(): ResponsiveState {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const isPortrait = height > width;
  const isLandscape = !isPortrait;

  const isMobile = width < BREAKPOINTS.mobile;
  const isTablet = width >= BREAKPOINTS.mobile && width < BREAKPOINTS.desktop;
  const isDesktop = width >= BREAKPOINTS.desktop;

  const breakpoint: 'mobile' | 'tablet' | 'desktop' = isMobile
    ? 'mobile'
    : isTablet
    ? 'tablet'
    : 'desktop';

  return {
    isMobile,
    isTablet,
    isDesktop,
    isPortrait,
    isLandscape,
    width,
    height,
    breakpoint,
  };
}

/**
 * Hook to check if viewport matches a specific media query
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia(query);
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
    // Fallback for older browsers
    else {
      mediaQuery.addListener(handler);
      return () => mediaQuery.removeListener(handler);
    }
  }, [query]);

  return matches;
}
