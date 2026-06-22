import React from 'react';

export default function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled = false,
  className = '',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  className?: string;
}) {
  const styles: Record<string, React.CSSProperties> = {
    primary:   { background: 'var(--accent)', color: '#fff', border: '1px solid transparent' },
    secondary: { background: 'var(--bg-surface-alt)', color: 'var(--text-primary)', border: '1px solid var(--border)' },
    ghost:     { background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)' },
    danger:    { background: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid transparent' },
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={styles[variant]}
      className={`
        inline-flex items-center justify-center gap-2
        px-4 py-2 rounded-xl text-sm font-semibold
        transition-all duration-150 select-none
        hover:opacity-90 hover:-translate-y-px active:translate-y-0
        disabled:opacity-40 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {children}
    </button>
  );
}
