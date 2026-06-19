'use client';

import Lottie from 'lottie-react';

type Props = {
  animationData: unknown;
  loop?: boolean;
  autoplay?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

export function LottiePlayer({ animationData, loop = true, autoplay = true, className, style }: Props) {
  return (
    <Lottie
      animationData={animationData}
      loop={loop}
      autoplay={autoplay}
      className={className}
      style={style}
      rendererSettings={{ preserveAspectRatio: 'xMidYMid meet' }}
    />
  );
}
