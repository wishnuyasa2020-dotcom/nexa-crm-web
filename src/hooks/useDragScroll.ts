'use client';

import { useRef, useEffect } from 'react';

export function useDragScroll<T extends HTMLElement = HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let isDown = false;
    let startX: number;
    let startY: number;
    let scrollLeft: number;
    let scrollTop: number;
    let hasDragged = false;

    const onMouseDown = (e: MouseEvent) => {
      // Only left click
      if (e.button !== 0) return;
      isDown = true;
      hasDragged = false;
      
      // Store initial positions
      startX = e.pageX - el.offsetLeft;
      startY = e.pageY - el.offsetTop;
      scrollLeft = el.scrollLeft;
      scrollTop = el.scrollTop;
      
      el.style.cursor = 'grabbing';
      el.style.userSelect = 'none';
    };

    const onMouseLeave = () => {
      isDown = false;
      el.style.cursor = 'grab';
      el.style.removeProperty('user-select');
    };

    const onMouseUp = () => {
      isDown = false;
      el.style.cursor = 'grab';
      el.style.removeProperty('user-select');
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      
      const x = e.pageX - el.offsetLeft;
      const y = e.pageY - el.offsetTop;
      
      const walkX = (x - startX) * 1.5; // multiplier for speed
      const walkY = (y - startY) * 1.5;
      
      if (Math.abs(walkX) > 5 || Math.abs(walkY) > 5) {
        hasDragged = true;
      }
      
      el.scrollLeft = scrollLeft - walkX;
      el.scrollTop = scrollTop - walkY;
    };

    // Global click capture to prevent clicks when dragged
    const onClick = (e: MouseEvent) => {
      if (hasDragged) {
        e.preventDefault();
        e.stopPropagation();
        hasDragged = false;
      }
    };

    el.addEventListener('mousedown', onMouseDown);
    el.addEventListener('mouseleave', onMouseLeave);
    // Bind mouseup/mousemove to window to allow dragging outside element
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove, { passive: false });
    el.addEventListener('click', onClick, { capture: true });

    el.style.cursor = 'grab';

    return () => {
      el.removeEventListener('mousedown', onMouseDown);
      el.removeEventListener('mouseleave', onMouseLeave);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('click', onClick, { capture: true });
    };
  }, []);

  return ref;
}
