// ============================================================
// HEBLI – Route guard for staff pages
// Blocks direct URL access (e.g. /owner) unless the user is a REAL,
// active staff member with the required role. We re-validate the saved
// session against the live staff list (id + pin + active + role) so a
// faked/edited localStorage user can't get in.
// ============================================================

import { Navigate } from 'react-router-dom';
import { getCurrentUser, getStaff } from '@/utils/store';
import type { StaffRole } from '@/types';

interface Props {
  children: React.ReactNode;
  role?: StaffRole; // optional required role (e.g. 'Administrator')
}

export default function RequireAuth({ children, role }: Props) {
  const saved = getCurrentUser();
  if (!saved) return <Navigate to="/staff" replace />;

  // Re-validate against the real staff records — the saved user must exist,
  // be active, and match by id + pin (so a tampered localStorage entry fails).
  const real = getStaff().find(
    (s) => s.id === saved.id && s.pin === saved.pin && s.active,
  );
  if (!real) return <Navigate to="/staff" replace />;

  // Role check uses the REAL record's role (not the saved/editable one).
  if (role && real.role !== role) return <Navigate to="/staff" replace />;

  return <>{children}</>;
}
