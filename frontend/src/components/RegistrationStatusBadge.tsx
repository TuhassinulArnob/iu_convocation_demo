import React from 'react';
import { getRegistrationStatus } from '../config/registrationConfig';

interface RegistrationStatusBadgeProps {
  className?: string;
  showDeadline?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark' | 'transparent';
}

export const RegistrationStatusBadge: React.FC<RegistrationStatusBadgeProps> = ({
  className = '',
  showDeadline = false,
  size = 'md',
  variant = 'light',
}) => {
  const { status, isOpen, deadlineText } = getRegistrationStatus();

  const sizeClasses = {
    sm: 'text-[11px] px-2.5 py-0.5',
    md: 'text-xs px-3 py-1',
    lg: 'text-sm px-4 py-1.5',
  };

  const variantClasses = {
    light: isOpen
      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
      : 'bg-rose-100 text-rose-800 border-rose-300',
    dark: isOpen
      ? 'bg-emerald-950/80 text-emerald-200 border-emerald-400/40 backdrop-blur-md'
      : 'bg-rose-950/80 text-rose-200 border-rose-400/40 backdrop-blur-md',
    transparent: isOpen
      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
      : 'bg-rose-500/20 text-rose-300 border-rose-400/30',
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-wider border shadow-sm ${sizeClasses[size]} ${variantClasses[variant]}`}
      >
        {isOpen ? (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        ) : (
          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
        )}
        <span>{status}</span>
      </span>

      {showDeadline && (
        <span
          className={`font-semibold ${
            variant === 'dark' || variant === 'transparent'
              ? 'text-amber-200'
              : 'text-stone-700'
          }`}
        >
          Registration Deadline:{' '}
          <strong
            className={
              variant === 'dark' || variant === 'transparent'
                ? 'text-[#F3A052]'
                : 'text-teal-dark font-extrabold'
            }
          >
            {deadlineText}
          </strong>
        </span>
      )}
    </div>
  );
};
