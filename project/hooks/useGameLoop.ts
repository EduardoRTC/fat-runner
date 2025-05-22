import { useCallback, useRef } from 'react';

export default function useGameLoop(callback: () => void) {
  const requestRef = useRef<number | null>(null);
  
  const animate = useCallback(() => {
    callback();
    requestRef.current = requestAnimationFrame(animate);
  }, [callback]);
  
  const startGameLoop = useCallback(() => {
    if (!requestRef.current) {
      requestRef.current = requestAnimationFrame(animate);
    }
  }, [animate]);
  
  const stopGameLoop = useCallback(() => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
  }, []);
  
  return { startGameLoop, stopGameLoop };
}