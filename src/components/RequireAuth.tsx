// ============================================================
// HEBLI Phase 2C — server-authenticated route guard
// Uses /api/v2/auth/me (HTTP-only session), never localStorage.
// ============================================================

import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { getServerSession } from '@/utils/api';
import type { StaffRole } from '@/types';

interface Props {
  children: React.ReactNode;
  role?: StaffRole;
}

export default function RequireAuth({ children, role }: Props) {
  const [state, setState] = useState<'checking' | 'allowed' | 'denied'>('checking');

  useEffect(() => {
    let alive = true;
    getServerSession()
      .then((session) => {
        if (!alive) return;
        const ok = !role || session.data.role === role;
        setState(ok ? 'allowed' : 'denied');
      })
      .catch(() => { if (alive) setState('denied'); });
    return () => { alive = false; };
  }, [role]);

  if (state === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B1512]">
        <Loader2 className="h-7 w-7 animate-spin text-[#D4AF37]" />
      </div>
    );
  }
  if (state === 'denied') return <Navigate to="/staff" replace />;
  return <>{children}</>;
}
