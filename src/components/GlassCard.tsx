import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', id, onClick }) => (
  <div
    id={id}
    onClick={onClick}
    className={`
      rounded-3xl
      bg-white
      border border-black/[0.04]
      shadow-[0_4px_16px_rgba(0,0,0,0.02)]
      ${className}
    `}
  >
    {children}
  </div>
);
