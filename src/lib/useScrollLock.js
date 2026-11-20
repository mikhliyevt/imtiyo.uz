import { useEffect } from 'react';

let activeLocks = 0;
let prevBodyOverflow = '';
let prevHtmlOverflow = '';
let prevBodyPaddingRight = '';

/**
 * Reference-counted body scroll lock for modals/drawers.
 * Prevents background page scrolling via mouse wheel or touchpad while open.
 */
export function useScrollLock(locked) {
  useEffect(() => {
    if (!locked || typeof document === 'undefined') return;

    if (activeLocks === 0) {
      prevBodyOverflow = document.body.style.overflow;
      prevHtmlOverflow = document.documentElement.style.overflow;
      prevBodyPaddingRight = document.body.style.paddingRight;

      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
    }
    activeLocks += 1;

    return () => {
      activeLocks = Math.max(0, activeLocks - 1);
      if (activeLocks === 0) {
        document.documentElement.style.overflow = prevHtmlOverflow;
        document.body.style.overflow = prevBodyOverflow;
        document.body.style.paddingRight = prevBodyPaddingRight;
      }
    };
  }, [locked]);
}

export default useScrollLock;
