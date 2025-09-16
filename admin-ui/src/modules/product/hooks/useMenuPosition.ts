import { useEffect, useRef, useState } from 'react';

export const useMenuPosition = (active, setActive) => {
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActive(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [setActive]);

  useEffect(() => {
    if (active && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const menuWidth = 192;
      const menuHeight = 80;
      let top = rect.bottom + 4;
      let left = rect.right - menuWidth;
      if (left < 8) left = 8;
      if (top + menuHeight > window.innerHeight - 8) {
        top = rect.top - menuHeight - 4;
      }
      setPosition({ top, left });
    }
  }, [active]);

  return { buttonRef, menuRef, menuPosition: position };
};
