import React from 'react';
import { View, ViewStyle, StyleProp } from 'react-native';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';

interface AnimatedContainerProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  type?: 'fade' | 'slide';
  duration?: number;
  delay?: number;
}

/**
 * AnimatedContainer - Wrapper para animações de entrada
 * 
 * @param children - Componentes filhos
 * @param type - Tipo de animação: 'fade' | 'slide'
 * @param duration - Duração da animação em ms (padrão: 200)
 * @param delay - Atraso antes de iniciar a animação (padrão: 0)
 * 
 * @example
 * // Fade in
 * <AnimatedContainer type="fade">
 *   <View>...</View>
 * </AnimatedContainer>
 * 
 * @example
 * // Slide up
 * <AnimatedContainer type="slide">
 *   <View>...</View>
 * </AnimatedContainer>
 */
export function AnimatedContainer({
  children,
  style,
  type = 'fade',
  duration = 200,
  delay = 0,
}: AnimatedContainerProps) {
  const getEnteringAnimation = () => {
    switch (type) {
      case 'fade':
        return FadeIn.duration(duration).delay(delay);
      case 'slide':
        return SlideInUp.duration(duration).delay(delay);
      default:
        return FadeIn.duration(duration).delay(delay);
    }
  };

  return (
    <Animated.View entering={getEnteringAnimation()} style={style}>
      {children}
    </Animated.View>
  );
}
