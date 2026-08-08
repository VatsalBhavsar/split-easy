import { useEffect, useRef } from 'react';
import { PanResponder, Platform } from 'react-native';

const EDGE_ZONE = 30;    // px from left edge that activates the gesture
const CLAIM_DX = 12;     // min rightward movement before we claim the gesture
const TRIGGER_DX = 80;   // rightward distance that confirms navigation
const TRIGGER_VX = 0.4;  // or velocity threshold (fast flick)

export function useSwipeBack(onBack?: () => void): Record<string, any> {
  const onBackRef = useRef(onBack);
  useEffect(() => { onBackRef.current = onBack; }, [onBack]);

  const panResponder = useRef(
    PanResponder.create({
      // Never claim on the initial touch — let children handle taps normally
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,

      // Claim the gesture mid-move only when it started near the left edge
      // and is moving more horizontally than vertically
      onMoveShouldSetPanResponder: (_, gestureState) => {
        if (Platform.OS !== 'ios' || !onBackRef.current) return false;
        return (
          gestureState.x0 < EDGE_ZONE &&
          gestureState.dx > CLAIM_DX &&
          gestureState.dx > Math.abs(gestureState.dy)
        );
      },
      onMoveShouldSetPanResponderCapture: () => false,

      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > TRIGGER_DX || gestureState.vx > TRIGGER_VX) {
          onBackRef.current?.();
        }
      },
      onPanResponderTerminate: () => {},
    })
  ).current;

  return panResponder.panHandlers;
}
