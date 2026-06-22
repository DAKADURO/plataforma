import React from 'react';

export default function Card({ 
  children, 
  className = '',
  hoverEffect = false
}: { 
  children: React.ReactNode; 
  className?: string;
  hoverEffect?: boolean;
}) {
  return (
    <div
      className={`
        bg-white dark:bg-[var(--bg-surface)]
        border border-[var(--border)]
        rounded-2xl
        transition-all duration-200 ease-out
        ${hoverEffect 
          ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]' 
          : 'shadow-[var(--shadow-sm)]'}
        ${className}
      `}
      style={{
        background: 'var(--bg-surface)',
        borderColor: 'var(--border)',
        boxShadow: hoverEffect ? undefined : 'var(--shadow-sm)',
      }}
    >
      {children}
    </div>
  );
}
