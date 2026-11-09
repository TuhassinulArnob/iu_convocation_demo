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
    <div className={`relative bg-[#075C55] text-white py-16 sm:py-20 lg:py-24 overflow-hidden select-none ${className}`}>
      {/* Background Campus Gate Photo */}
      <div
        className="absolute inset-0 bg-cover bg-center transform scale-105"
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

      {/* Diagonal Pinstripe Lines Texture Overlay (Matching Original Website) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(135deg, rgba(255, 255, 255, 0.055) 0px, rgba(255, 255, 255, 0.055) 1.5px, transparent 1.5px, transparent 16px)',
        }}
      />

      {/* Hero Content Container */}
      <div className="relative max-w-[1450px] mx-auto px-6 sm:px-10 lg:px-14">
        {eyebrow && (
          <span className="text-sm sm:text-base font-bold text-[#F3A052] uppercase tracking-[0.2em] block mb-2 sm:mb-3 drop-shadow-sm">
            {eyebrow}
          </span>
        )}
        <h1 className="text-4xl sm:text-6xl lg:text-[72px] font-extrabold tracking-tight text-white leading-tight mb-2 sm:mb-3 drop-shadow-md">
          {title}
        </h1>
        <p className="text-base sm:text-xl lg:text-[22px] text-stone-100 font-normal max-w-3xl leading-relaxed drop-shadow-sm">
          {description}
        </p>
        {children && <div className="mt-6">{children}</div>}
      </div>
    </div>
  );
};
