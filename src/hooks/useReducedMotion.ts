/**
 * Baca preferensi reduced motion OS.
 * true → gunakan cross-fade / opacity, bukan spring/translate besar.
 */
import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Subscribe ke reduce-motion setting.
 * @returns true jika user meminta reduced motion
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (mounted) setReduced(v);
    });
    const sub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduced
    );
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  return reduced;
}
