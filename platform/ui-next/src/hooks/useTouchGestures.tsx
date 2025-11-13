import { useEffect, useRef, RefObject } from 'react';

interface TouchGestureHandlers {
  onPinch?: (scale: number, center: { x: number; y: number }) => void;
  onPan?: (delta: { x: number; y: number }) => void;
  onSwipe?: (direction: 'left' | 'right' | 'up' | 'down', velocity: number) => void;
  onDoubleTap?: (position: { x: number; y: number }) => void;
}

interface TouchState {
  touches: Touch[];
  initialDistance: number;
  initialCenter: { x: number; y: number };
  lastTouchTime: number;
  lastTouchPosition: { x: number; y: number } | null;
  startPosition: { x: number; y: number };
  startTime: number;
}

/**
 * Hook for handling touch gestures on viewport elements
 * Supports: pinch-to-zoom, pan, swipe, double-tap
 */
export function useTouchGestures(
  elementRef: RefObject<HTMLElement>,
  handlers: TouchGestureHandlers
): void {
  const touchStateRef = useRef<TouchState>({
    touches: [],
    initialDistance: 0,
    initialCenter: { x: 0, y: 0 },
    lastTouchTime: 0,
    lastTouchPosition: null,
    startPosition: { x: 0, y: 0 },
    startTime: 0,
  });

  useEffect(() => {
    const element = elementRef.current;
    if (!element) {
      return;
    }

    const getDistance = (touch1: Touch, touch2: Touch): number => {
      const dx = touch1.clientX - touch2.clientX;
      const dy = touch1.clientY - touch2.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const getCenter = (touch1: Touch, touch2: Touch): { x: number; y: number } => {
      return {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2,
      };
    };

    const handleTouchStart = (e: TouchEvent) => {
      const state = touchStateRef.current;
      const touches = Array.from(e.touches);
      state.touches = touches;
      state.startTime = Date.now();

      if (touches.length === 2) {
        // Two-finger pinch gesture
        state.initialDistance = getDistance(touches[0], touches[1]);
        state.initialCenter = getCenter(touches[0], touches[1]);
      } else if (touches.length === 1) {
        // Single finger - potential pan or swipe
        state.startPosition = {
          x: touches[0].clientX,
          y: touches[0].clientY,
        };

        // Check for double-tap
        const now = Date.now();
        const timeSinceLastTouch = now - state.lastTouchTime;
        const lastPos = state.lastTouchPosition;

        if (
          timeSinceLastTouch < 300 &&
          lastPos &&
          Math.abs(lastPos.x - touches[0].clientX) < 30 &&
          Math.abs(lastPos.y - touches[0].clientY) < 30
        ) {
          // Double tap detected
          if (handlers.onDoubleTap) {
            handlers.onDoubleTap({
              x: touches[0].clientX,
              y: touches[0].clientY,
            });
          }
          state.lastTouchTime = 0; // Reset to prevent triple-tap
        } else {
          state.lastTouchTime = now;
          state.lastTouchPosition = {
            x: touches[0].clientX,
            y: touches[0].clientY,
          };
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const state = touchStateRef.current;
      const touches = Array.from(e.touches);

      if (touches.length === 2 && state.initialDistance > 0) {
        // Pinch gesture
        const currentDistance = getDistance(touches[0], touches[1]);
        const scale = currentDistance / state.initialDistance;
        const center = getCenter(touches[0], touches[1]);

        if (handlers.onPinch) {
          handlers.onPinch(scale, center);
        }
      } else if (touches.length === 1) {
        // Pan gesture
        const currentX = touches[0].clientX;
        const currentY = touches[0].clientY;
        const deltaX = currentX - state.startPosition.x;
        const deltaY = currentY - state.startPosition.y;

        if (handlers.onPan) {
          handlers.onPan({ x: deltaX, y: deltaY });
        }

        // Update start position for continuous panning
        state.startPosition = { x: currentX, y: currentY };
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const state = touchStateRef.current;
      const touches = Array.from(e.changedTouches);

      if (touches.length === 1 && state.touches.length === 1) {
        // Check for swipe gesture
        const endTime = Date.now();
        const duration = endTime - state.startTime;
        const touch = touches[0];
        const deltaX = touch.clientX - state.startPosition.x;
        const deltaY = touch.clientY - state.startPosition.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        // Swipe detection: minimum distance of 50px and duration < 300ms
        if (distance > 50 && duration < 300) {
          const velocity = distance / duration;
          let direction: 'left' | 'right' | 'up' | 'down';

          // Determine swipe direction
          if (Math.abs(deltaX) > Math.abs(deltaY)) {
            direction = deltaX > 0 ? 'right' : 'left';
          } else {
            direction = deltaY > 0 ? 'down' : 'up';
          }

          if (handlers.onSwipe) {
            handlers.onSwipe(direction, velocity);
          }
        }
      }

      // Reset state
      state.touches = [];
      state.initialDistance = 0;
    };

    // Add event listeners with passive: false to allow preventDefault
    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [elementRef, handlers]);
}

export default useTouchGestures;
