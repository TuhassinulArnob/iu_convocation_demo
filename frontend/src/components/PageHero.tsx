import React from 'react';

interface PageHeroProps {
  title: string;
  description: string;
  eyebrow?: string;
  className?: string;
  children?: React.ReactNode;
}

export const PageHero: React.FC<PageHeroProps> = ({
  title,
  description,
  eyebrow = '5TH CONVOCATION 2027',
  className = '',
  children,
}) => {
  return (
    <div className={`relative bg-[#075C55] text-white py-12 sm:py-16 lg:py-18 overflow-hidden select-none w-full ${className}`}>
      {/* Background Campus Gate Photo without overflowing transform scale */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('/assets/reference/background_mainGateImage.webp')`,
          filter: 'contrast(105%) brightness(95%)',
        }}
      />

      {/* Balanced Teal/Emerald Gradient Overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(110deg, rgba(7, 92, 85, 0.78) 0%, rgba(7, 92, 85, 0.65) 50%, rgba(21, 58, 55, 0.60) 100%)',
        }}
      />

      {/* Diagonal Pinstripe Lines Texture Overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0px, rgba(255, 255, 255, 0.05) 1.5px, transparent 1.5px, transparent 16px)',
        }}
      />

      {/* Hero Content Container (Refined 48-52px Title, 16-17px Subtitle) */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {eyebrow && (
          <span className="text-[11px] sm:text-xs font-semibold text-[#F3A052] uppercase tracking-[0.16em] block mb-1.5 drop-shadow-sm">
            {eyebrow}
          </span>
        )}
        <h1 className="text-3xl sm:text-4xl lg:text-[50px] font-bold tracking-tight text-white leading-tight mb-2 drop-shadow-sm">
          {title}
        </h1>
        <p className="text-sm sm:text-base lg:text-[17px] text-stone-100 font-normal max-w-2xl leading-relaxed drop-shadow-sm">
          {description}
        </p>
        {children && <div className="mt-5">{children}</div>}
      </div>
    </div>
  );
};
