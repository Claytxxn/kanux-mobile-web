/**
 * useTransition Hook
 * Animações de transição suaves para componentes e telas
 * Duração: 200ms | Easing: ease-out
 */

import { useEffect } from 'react';
import { useAnimatedStyle, useSharedValue, withTiming, withSpring } from 'react-native-reanimated';

type TransitionType = 'fade-in' | 'slide-up' | 'scale-in';

interface UseTransitionOptions {
  type?: TransitionType;
  duration?: number;
  delay?: number;
}

interface UseTransitionResult {
  animatedStyle: ReturnType<typeof useAnimatedStyle>;
  isVisible: boolean;
}

/**
 * Hook para animações de transição
 * 
 * @param options - Configurações da animação
 * @returns Objeto com estilo animado e estado de visibilidade
 * 
 * @example
 * // Fade in padrão (200ms)
 * const { animatedStyle } = useTransition();
 * 
 * @example
 * // Slide up com duração customizada
 * const { animatedStyle } = useTransition({ type: 'slide-up', duration: 300 });
 */
export function useTransition(options: UseTransitionOptions = {}): UseTransitionResult {
  const {
    type = 'fade-in',
    duration = 200,
    delay = 0,
  } = options;

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(type === 'slide-up' ? 20 : 0);
  const scale = useSharedValue(type === 'scale-in' ? 0.95 : 1);

  useEffect(() => {
    const timeout = setTimeout(() => {
      opacity.value = withTiming(1, { duration });
      translateY.value = withTiming(0, { duration });
      scale.value = withTiming(1, { duration });
    }, delay);

    return () => clearTimeout(timeout);
  }, [opacity, translateY, scale, duration, delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return {
    animatedStyle,
    isVisible: opacity.value === 1,
  };
}
