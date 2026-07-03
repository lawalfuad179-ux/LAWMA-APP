'use client';

import { useEffect, useRef } from 'react';

const MOBILE_QUERY = '(max-width: 767px)';
const CLOSE_THRESHOLD_PX = 80;
const SNAP_BACK_TRANSITION = 'transform 0.25s cubic-bezier(0.32, 0.72, 0, 1)';

/**
 * Swipe-down-to-close for a bottom sheet, driven only by touches on
 * `handleRef` (the drag-handle bar), not the sheet body. Mobile viewports
 * only — these sheets render as centered modals with no handle on desktop.
 */
export function useSwipeDownToClose(
  handleRef: React.RefObject<HTMLElement | null>,
  sheetRef: React.RefObject<HTMLElement | null>,
  onClose: () => void,
) {
  const startY = useRef(0);
  const dragging = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const handle = handleRef.current;
    const sheet = sheetRef.current;
    if (!handle || !sheet) return;

    function onTouchStart(e: TouchEvent) {
      if (!window.matchMedia(MOBILE_QUERY).matches) return;
      startY.current = e.touches[0].clientY;
      dragging.current = true;
      sheet!.style.transition = 'none';
    }

    function onTouchMove(e: TouchEvent) {
      if (!dragging.current) return;
      const delta = e.touches[0].clientY - startY.current;
      if (delta > 0) sheet!.style.transform = `translateY(${delta}px)`;
    }

    function onTouchEnd(e: TouchEvent) {
      if (!dragging.current) return;
      dragging.current = false;
      const delta = e.changedTouches[0].clientY - startY.current;
      sheet!.style.transition = SNAP_BACK_TRANSITION;
      sheet!.style.transform = '';
      if (delta > CLOSE_THRESHOLD_PX) onCloseRef.current();
      window.setTimeout(() => { sheet!.style.transition = ''; }, 260);
    }

    handle.addEventListener('touchstart', onTouchStart, { passive: true });
    handle.addEventListener('touchmove', onTouchMove, { passive: true });
    handle.addEventListener('touchend', onTouchEnd);
    return () => {
      handle.removeEventListener('touchstart', onTouchStart);
      handle.removeEventListener('touchmove', onTouchMove);
      handle.removeEventListener('touchend', onTouchEnd);
    };
  }, [handleRef, sheetRef]);
}
