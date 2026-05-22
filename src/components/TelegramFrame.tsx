import React from 'react';
import { Flame, Crown, Zap } from 'lucide-react';
import { motion } from 'motion/react';

interface TelegramFrameProps {
  children: React.ReactNode;
  streakDays: number;
  isPremium: boolean;
  matchaSparks?: number;
}

export default function TelegramFrame({
  children,
  streakDays,
  isPremium,
  matchaSparks
}: TelegramFrameProps) {
  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#1A1A1A] flex items-center justify-center font-sans overflow-x-hidden relative">
      
      {/* Light sage-green fluid brand glows - Animated slow ocean float loops */}
      <motion.div
        animate={{
          scale: [1, 1.12, 0.95, 1.05, 1],
          x: ["0%", "8%", "-7%", "4%", "0%"],
          y: [0, 20, -15, 8, 0]
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          repeatType: "mirror",
          ease: "easeInOut"
        }}
        className="absolute top-0 right-1/4 w-[480px] h-[480px] bg-[#E8F5EE]/50 blur-[130px] rounded-full pointer-events-none z-0"
      />
      <motion.div
        animate={{
          scale: [1, 0.92, 1.08, 1, 0.95],
          x: ["0%", "-6%", "5%", "-3%", "0%"],
          y: [0, -20, 15, -8, 0]
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          repeatType: "mirror",
          ease: "easeInOut"
        }}
        className="absolute bottom-0 left-1/4 w-[420px] h-[420px] bg-[#C8E6D4]/30 blur-[140px] rounded-full pointer-events-none z-0"
      />

      {/* Main Core Viewport: responsive columns max-w-[460px] on desktop, 100% infinite flex on mobile */}
      <div className="w-full max-w-[460px] min-h-screen bg-[#F5F5F0] relative z-10 flex flex-col shadow-[0_0_80px_rgba(0,0,0,0.02)] sm:border-x border-black/[0.04]">
        
        {/* Authentic Telegram Mini App Header */}
        <header className="sticky top-0 z-40 bg-white border-b border-black/[0.03] px-5 py-4 flex items-center justify-between select-none">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00C896] animate-pulse shrink-0" />
            <span className="font-display font-black text-[12.5px] uppercase tracking-wider text-[#1A1A1A]">MATCHA BOT</span>
          </div>

          <div className="flex items-center gap-4">
            {matchaSparks !== undefined && (
              <motion.div 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-1.5 cursor-pointer text-[#D19200] group select-none relative"
                title="Your Matcha Sparks balance"
              >
                {/* Clean, background-free active Zap icon */}
                <Zap className="w-3.5 h-3.5 stroke-[2.5] text-[#D19200] fill-amber-300/20 group-hover:fill-amber-400 group-hover:text-amber-600 transition duration-300 animate-[pulse_2s_infinite]" />
                <span className="text-[11px] font-mono font-black tracking-widest leading-none">
                  {matchaSparks} <span className="text-[9px] font-bold text-[#D19200]/70">⚡</span>
                </span>
              </motion.div>
            )}
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

