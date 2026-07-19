/**
 * Ink theme reveal — port dari rs-4/labs ink-toggle.
 *
 * Alur:
 * 1. ThemeToggle captureScreen → ThemeContext.ink di-set
 * 2. Overlay decode screenshot (Skia useImage)
 * 3. Flip theme di bawah (setSessionMode)
 * 4. Tetesan goo (metaball blur+ColorMatrix) jatuh, lalu gelombang dstOut
 *    menghapus screenshot → tema baru terlihat di "lubang" liquid
 * 5. Cleanup unmount overlay
 *
 * Canvas tetap mount (child kosong saat idle) agar tidak remount mid-frame.
 */
import { useAppTheme } from '@/context/ThemeContext';
import { hapticCommit } from '@/lib/haptics';
import {
  Blur,
  Canvas,
  Circle,
  ColorMatrix,
  Group,
  Image as SkiaImage,
  Paint,
  useImage,
} from '@shopify/react-native-skia';
import { useEffect, useRef } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import {
  Easing,
  runOnJS,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const HEAD_R = 14;
const TAIL_R = 7;

/** Pertajam alpha setelah blur → efek metaball/goo sticky. */
const GOO_MATRIX = [
  1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 40, -18,
];

/**
 * Overlay full-screen di root. Hanya menggambar saat `ink` aktif + image ready.
 */
export function ThemeInkOverlay() {
  const { ink, setSessionMode, endInkTransition } = useAppTheme();
  const { width, height } = useWindowDimensions();
  const shot = useImage(ink?.shotUri ?? null);
  const startedForUri = useRef<string | null>(null);

  // Refs: callback stabil untuk effect (hindari eslint-disable + stale closure)
  const setSessionModeRef = useRef(setSessionMode);
  const endInkRef = useRef(endInkTransition);
  const layoutRef = useRef({ width, height });

  useEffect(() => {
    setSessionModeRef.current = setSessionMode;
    endInkRef.current = endInkTransition;
    layoutRef.current = { width, height };
  }, [setSessionMode, endInkTransition, width, height]);

  const originX = useSharedValue(width / 2);
  const originY = useSharedValue(height * 0.2);
  const sourceR = useSharedValue(0);
  const dropY = useSharedValue(0);
  const dropR = useSharedValue(0);
  const stretch = useSharedValue(0);
  const poolR = useSharedValue(0);

  // Screenshot ready → flip theme di bawah, mulai drip
  useEffect(() => {
    if (!ink || !shot) return;
    if (startedForUri.current === ink.shotUri) return;
    startedForUri.current = ink.shotUri;

    const { originX: ox, originY: oy, nextDark } = ink;
    const { height: h, width: w } = layoutRef.current;
    const floorY = h - 8;
    const coverR = Math.hypot(w, h) + 120;

    const splashHaptic = () => {
      void hapticCommit('medium');
    };

    const cleanup = () => {
      startedForUri.current = null;
      endInkRef.current();
    };

    const t = setTimeout(() => {
      setSessionModeRef.current(nextDark ? 'dark' : 'light');

      originX.value = ox;
      originY.value = oy;
      sourceR.value = 0;
      dropR.value = 0;
      stretch.value = 0;
      poolR.value = 0;
      dropY.value = oy;

      sourceR.value = withSequence(
        withTiming(11, { duration: 220, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 200, easing: Easing.in(Easing.quad) })
      );
      dropR.value = withTiming(HEAD_R, {
        duration: 280,
        easing: Easing.out(Easing.quad),
      });
      stretch.value = withDelay(
        280,
        withSequence(
          withTiming(36, { duration: 200, easing: Easing.out(Easing.quad) }),
          withTiming(28, { duration: 120 }),
          withTiming(2, { duration: 60 })
        )
      );

      dropY.value = withSequence(
        withTiming(oy + 16, {
          duration: 280,
          easing: Easing.out(Easing.quad),
        }),
        withTiming(
          floorY,
          { duration: 380, easing: Easing.in(Easing.cubic) },
          (finished) => {
            if (!finished) return;
            runOnJS(splashHaptic)();
            dropR.value = withTiming(0, { duration: 90 });
            poolR.value = 60;
            poolR.value = withTiming(
              coverR,
              {
                duration: 650,
                easing: Easing.bezier(0.33, 0, 0.15, 1),
              },
              (done) => {
                if (done) runOnJS(cleanup)();
              }
            );
          }
        )
      );
    }, 48);

    return () => clearTimeout(t);
  }, [ink, shot, originX, originY, sourceR, dropY, dropR, stretch, poolR]);

  const tailY = useDerivedValue(() => dropY.value - stretch.value);
  const tailR = useDerivedValue(() =>
    Math.min(TAIL_R, 2 + stretch.value * 0.25)
  );

  const show = Boolean(ink && shot);

  return (
    <Canvas
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, styles.canvas]}
    >
      {show && shot ? (
        <>
          <SkiaImage
            image={shot}
            x={0}
            y={0}
            width={width}
            height={height}
            fit="cover"
          />
          {/* goo: dstOut menghapus screenshot → tema baru di "lubang" */}
          <Group
            layer={
              <Paint blendMode="dstOut">
                <Blur blur={8} />
                <ColorMatrix matrix={GOO_MATRIX} />
              </Paint>
            }
          >
            <Circle cx={originX} cy={originY} r={sourceR} color="black" />
            <Circle cx={originX} cy={dropY} r={dropR} color="black" />
            <Circle cx={originX} cy={tailY} r={tailR} color="black" />
            {/* Wave pool center slightly below screen edge */}
            <Circle cx={originX} cy={height + 60} r={poolR} color="black" />
          </Group>
        </>
      ) : null}
    </Canvas>
  );
}

const styles = StyleSheet.create({
  // Di atas navigasi; di bawah toast (9999) agar toast tetap terbaca
  canvas: {
    zIndex: 9000,
    elevation: 9000,
  },
});
