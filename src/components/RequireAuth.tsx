// ============================================================
// HEBLI – Route guard for staff pages
// Blocks direct URL access (e.g. /owner) unless the user is logged
// in with the required role. Otherwise redirects to /staff (PIN login).
// ============================================================

import { Navigate } from 'react-router-dom';
import { getCurrentUser } from '@/utils/store';
import type { StaffRole } from '@/types';

interface Props {
  children: React.ReactNode;
  role?: StaffRole;          // optional required role (e.g. 'Administrator')
}

export default function RequireAuth({ children, role }: Props) {
  const user = getCurrentUser();

  // Not logged in → go to the PIN login.
  if (!user) return <Navigate to="/staff" replace />;

  // Wrong role (e.g. a barista trying to open /owner) → send to login.
  if (role && user.role !== role) return <Navigate to="/staff" replace />;

  return <>{children}</>;
}
