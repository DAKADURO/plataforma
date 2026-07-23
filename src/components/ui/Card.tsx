import React from 'react';

type CardVariant = 'default' | 'elevated' | 'interactive';

export default function Card({
  children,
  className = '',
  variant = 'default',
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  variant?: CardVariant;
  onClick?: () => void;
}) {
  const base = 'rounded-2xl border transition-all duration-200';

  const variantStyles: Record<CardVariant, React.CSSProperties> = {
    default:     { background: 'var(--bg-surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-sm)' },
    elevated:    { background: 'var(--bg-surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-md)' },
    interactive: { background: 'var(--bg-surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-sm)', cursor: 'pointer' },
  };

  return (
    <div
      onClick={onClick}
      className={`${base} ${variant === 'interactive' ? 'hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]' : ''} ${className}`}
      style={variantStyles[variant]}
      onMouseEnter={variant === 'interactive' ? e => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border-focus)') : undefined}
      onMouseLeave={variant === 'interactive' ? e => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border)') : undefined}
    >
      {children}
    </div>
  );
}
