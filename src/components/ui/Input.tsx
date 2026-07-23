import React from 'react';

export default function Input({
  id,
  label,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  required = false,
  className = '',
  disabled = false,
  icon,
}: {
  id: string;
  label?: string;
  value: string | number | undefined;
  onChange: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;
  type?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col ${className}`}>
      {label && (
        <label htmlFor={id} className="mb-1.5 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          {label} {required && <span style={{ color: 'var(--danger)' }}>*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" style={{ color: 'var(--text-muted)' }}>
            {icon}
          </div>
        )}
        <input
          id={id}
          type={type}
          value={value ?? ''}
          onChange={onChange as React.ChangeEventHandler<HTMLInputElement>}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`
            w-full rounded-xl px-4 py-2.5 transition-all duration-200 outline-none
            focus:ring-2 focus:ring-[var(--border-focus)] border
            disabled:opacity-60 disabled:cursor-not-allowed
            ${icon ? 'pl-10' : ''}
          `}
          style={{
            background: 'var(--bg-surface-alt)',
            borderColor: 'var(--border)',
            color: 'var(--text-primary)',
          }}
        />
      </div>
    </div>
  );
}
