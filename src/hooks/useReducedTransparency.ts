/**
 * Baca preferensi reduced transparency OS (iOS).
 * true → solid surfaces, drop blur/glass (Apple HIG accessibility).
 */
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

/**
 * Subscribe ke reduce-transparency.
 * Android/web: selalu false (API tidak setara; blur fallback tetap dipakai).
 */
export function useReducedTransparency(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;

    let mounted = true;
    void AccessibilityInfo.isReduceTransparencyEnabled().then((v) => {
      if (mounted) setReduced(v);
    });

    const sub = AccessibilityInfo.addEventListener(
      'reduceTransparencyChanged',
      setReduced
    );

    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  return reduced;
}
