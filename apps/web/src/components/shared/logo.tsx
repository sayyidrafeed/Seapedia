import * as React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'icon' | 'wordmark';
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ variant = 'wordmark', size = 'md', className, ...props }: LogoProps) {
  const sizeClasses = {
    sm: {
      img: 'h-6 w-auto',
      text: 'text-base',
      gap: 'gap-2',
    },
    md: {
      img: 'h-8 w-auto',
      text: 'text-lg',
      gap: 'gap-2.5',
    },
    lg: {
      img: 'h-10 w-auto',
      text: 'text-xl',
      gap: 'gap-3',
    },
  };

  const currentSize = sizeClasses[size];

  return (
    <div
      className={cn(
        'flex items-center select-none font-sans leading-none',
        currentSize.gap,
        className,
      )}
      {...props}
    >
      <img
        src="/seapedia-transparent.png"
        alt="Seapedia Logo"
        className={cn(currentSize.img, 'object-contain')}
        loading="lazy"
      />
      {variant === 'wordmark' && (
        <span className={cn('font-bold tracking-tight text-foreground', currentSize.text)}>
          Seapedia
        </span>
      )}
    </div>
  );
}
