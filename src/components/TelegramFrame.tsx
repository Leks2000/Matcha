import React from 'react';
import { Flame, Crown } from 'lucide-react';

interface TelegramFrameProps {
  children: React.ReactNode;
  streakDays: number;
  isPremium: boolean;
}

export default function TelegramFrame({
  children,
  streakDays,
  isPremium
}: TelegramFrameProps) {
  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#1A1A1A] flex items-center justify-center font-sans overflow-x-hidden relative">
      
      {/* Light sage-green fluid brand glows */}
      <div className="absolute top-0 right-1/2 translate-x-1/2 w-[450px] h-[450px] bg-[#E8F5EE]/40 blur-[130px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-[#C8E6D4]/20 blur-[140px] rounded-full pointer-events-none z-0" />

      {/* Main Core Viewport: responsive columns max-w-[460px] on desktop, 100% infinite flex on mobile */}
      <div className="w-full max-w-[460px] min-h-screen bg-[#F5F5F0] relative z-10 flex flex-col shadow-[0_0_80px_rgba(0,0,0,0.02)] sm:border-x border-black/[0.04]">
        
        {/* Authentic Telegram Mini App Header */}
        <header className="sticky top-0 z-40 bg-white border-b border-black/[0.03] px-5 py-4 flex items-center justify-between select-none">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00C896] animate-pulse shrink-0" />
            <span className="font-display font-black text-[12.5px] uppercase tracking-wider text-[#1A1A1A]">MATCHA BOT</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-[#00A876] font-extrabold uppercase tracking-widest bg-[#E8F5EE] px-2 py-0.5 rounded-md">TMA INSTANT</span>
          </div>
        </header>

        {/* Core content stream */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {children}
        </div>
      </div>
    </div>
  );
}

