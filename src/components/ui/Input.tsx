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
        <label htmlFor={id} className="mb-1.5 text-sm font-semibold text-slate-800 dark:text-slate-300">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
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
            w-full bg-slate-50 dark:bg-[#1a1a1a]
            border border-slate-200 dark:border-white/10
            text-slate-900 dark:text-white
            placeholder:text-slate-400 dark:placeholder:text-slate-500
            rounded-xl px-4 py-2.5 transition-all duration-200
            focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500
            disabled:opacity-60 disabled:cursor-not-allowed
            ${icon ? 'pl-10' : ''}
          `}
        />
      </div>
    </div>
  );
}
