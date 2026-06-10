// ============================================================
// HEBLI – Glassmorphism Card Component
// ============================================================

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export default function GlassCard({ children, className = '', hover = true, onClick }: GlassCardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -2, scale: 1.01 } : undefined}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      onClick={onClick}
      className={`rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-6 ${
        hover ? 'cursor-pointer' : ''
      } transition-colors duration-300 hover:bg-white/[0.05] hover:border-white/[0.1] ${className}`}
    >
      {children}
    </motion.div>
  );
}
