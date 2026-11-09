import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';

interface Props {
  variant?: 'banner' | 'card' | 'inline';
  className?: string;
}

export const DisclaimerBanner: React.FC<Props> = ({ variant = 'card', className = '' }) => {
  if (variant === 'banner') {
    return (
      <div className={`bg-amber-500 text-stone-900 text-xs md:text-sm font-semibold py-2 px-4 text-center flex items-center justify-center gap-2 shadow-sm ${className}`}>
        <AlertTriangle className="w-4 h-4 text-stone-900 shrink-0" />
        <span>
          DEMO WEBSITE — For educational and testing purposes only. No real registration or payment is processed.
        </span>
      </div>
    );
  }

  return (
    <div className={`bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg shadow-sm text-stone-800 ${className}`}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
        <div className="text-xs md:text-sm leading-relaxed">
          <p className="font-bold text-amber-900 tracking-wide uppercase">
            UNOFFICIAL DEMONSTRATION PROJECT
          </p>
          <p className="mt-1 text-stone-700">
            This website is an independently developed educational UI/UX and software demonstration inspired by the public-facing Islamic University Bangladesh 5th Convocation 2027 portal. It is <strong>NOT</strong> the official university website and is <strong>NOT</strong> affiliated with, endorsed by, or operated by Islamic University Bangladesh.
          </p>
        </div>
      </div>
    </div>
  );
};
