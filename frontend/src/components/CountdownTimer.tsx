import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { EVENT_CONFIG, getRegistrationStatus } from '../config/registrationConfig';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

export const CountdownTimer: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  // Target: 02 February 2027, 09:00 AM BST (+06:00) from central configuration
  const targetTime = new Date(EVENT_CONFIG.ceremonyDatetime).getTime();
  const { status, isOpen, deadlineText } = getRegistrationStatus();

  const calculateTimeLeft = (): TimeLeft => {
    const now = new Date().getTime();
    const difference = targetTime - now;

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      isExpired: false,
    };
  };

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetTime]);

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs md:text-sm font-semibold text-white/90">
        <span className="bg-black/30 px-2 py-1 rounded">{pad(timeLeft.days)}d</span>
        <span>:</span>
        <span className="bg-black/30 px-2 py-1 rounded">{pad(timeLeft.hours)}h</span>
        <span>:</span>
        <span className="bg-black/30 px-2 py-1 rounded">{pad(timeLeft.minutes)}m</span>
        <span>:</span>
        <span className="bg-black/30 px-2 py-1 rounded">{pad(timeLeft.seconds)}s</span>
      </div>
    );
  }

  return (
    <div className="bg-[#153A37]/80 backdrop-blur-md border border-white/10 rounded-2xl p-4 md:p-5 text-white shadow-xl max-w-md w-full">
      <div className="flex items-center justify-between text-xs font-semibold tracking-wider text-stone-300 uppercase pb-3 border-b border-white/10 mb-3">
        <div className="flex items-center gap-2 text-gold-warm">
          <span className="text-base">⏳</span>
          <span>COUNTDOWN TO THE CEREMONY</span>
        </div>
        <div className="flex items-center gap-1.5 text-stone-300">
          <Calendar className="w-3.5 h-3.5" />
          <span>02 Feb 2027</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 text-center">
        {/* Days */}
        <div className="bg-[#0b2422]/90 rounded-xl p-2 md:p-3 border border-white/5 flex flex-col justify-center items-center shadow-inner">
          <span className="text-2xl md:text-3xl font-extrabold text-[#F3A052] font-mono tracking-tight">
            {pad(timeLeft.days)}
          </span>
          <span className="text-[10px] md:text-xs font-bold text-stone-400 tracking-wider uppercase mt-1">
            DAYS
          </span>
        </div>

        {/* Hours */}
        <div className="bg-[#0b2422]/90 rounded-xl p-2 md:p-3 border border-white/5 flex flex-col justify-center items-center shadow-inner">
          <span className="text-2xl md:text-3xl font-extrabold text-[#F3A052] font-mono tracking-tight">
            {pad(timeLeft.hours)}
          </span>
          <span className="text-[10px] md:text-xs font-bold text-stone-400 tracking-wider uppercase mt-1">
            HOURS
          </span>
        </div>

        {/* Minutes */}
        <div className="bg-[#0b2422]/90 rounded-xl p-2 md:p-3 border border-white/5 flex flex-col justify-center items-center shadow-inner">
          <span className="text-2xl md:text-3xl font-extrabold text-[#F3A052] font-mono tracking-tight">
            {pad(timeLeft.minutes)}
          </span>
          <span className="text-[10px] md:text-xs font-bold text-stone-400 tracking-wider uppercase mt-1">
            MINUTES
          </span>
        </div>

        {/* Seconds */}
        <div className="bg-[#0b2422]/90 rounded-xl p-2 md:p-3 border border-white/5 flex flex-col justify-center items-center shadow-inner">
          <span className="text-2xl md:text-3xl font-extrabold text-[#F3A052] font-mono tracking-tight animate-pulse">
            {pad(timeLeft.seconds)}
          </span>
          <span className="text-[10px] md:text-xs font-bold text-stone-400 tracking-wider uppercase mt-1">
            SECONDS
          </span>
        </div>
      </div>

      {/* Registration Status & Deadline Strip */}
      <div className="mt-3.5 pt-2.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] font-medium text-stone-300">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold uppercase tracking-wider border ${
            isOpen
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
              : 'bg-rose-500/20 text-rose-300 border-rose-400/30'
          }`}
        >
          {isOpen ? (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          )}
          <span>{status}</span>
        </span>
        <span className="text-stone-300">
          Registration Deadline:{' '}
          <strong className="text-[#F3A052] font-bold">{deadlineText}</strong>
        </span>
      </div>
    </div>
  );
};
