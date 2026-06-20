'use client';

import Lottie from 'lottie-react';

type Props = {
  animationData: unknown;
  loop?: boolean;
  autoplay?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onComplete?: () => void;
};

export function LottiePlayer({ animationData, loop = true, autoplay = true, className, style, onComplete }: Props) {
  return (
    <Lottie
      animationData={animationData}
      loop={loop}
      autoplay={autoplay}
      className={className}
      style={style}
      onComplete={onComplete}
      rendererSettings={{ preserveAspectRatio: 'xMidYMid meet' }}
    />
  );
}
