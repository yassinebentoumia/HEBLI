// ============================================================
// HEBLI – Premium Gold Button Component
// ============================================================

import { motion } from 'framer-motion';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface GoldButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export default function GoldButton({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: GoldButtonProps) {
  const sizeClasses = {
    sm: 'px-4 py-2 text-xs tracking-wider',
    md: 'px-6 py-3 text-sm tracking-wider',
    lg: 'px-8 py-4 text-base tracking-wider',
  };

  const variantClasses = {
    primary:
      'bg-gradient-to-r from-[#D4AF37] to-amber-500 text-black font-semibold hover:from-amber-400 hover:to-[#D4AF37] shadow-lg shadow-[#D4AF37]/20',
    secondary:
      'bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:border-white/20',
    outline:
      'bg-transparent text-[#D4AF37] border border-[#D4AF37]/50 hover:bg-[#D4AF37]/10 hover:border-[#D4AF37]',
    ghost: 'bg-transparent text-white/70 hover:text-white hover:bg-white/5',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-sans uppercase transition-all duration-300 ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...(props as any)}
    >
      {children}
    </motion.button>
  );
}
