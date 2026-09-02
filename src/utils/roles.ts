// ============================================================
// HEBLI – Dynamic Staff Title (based on role + star rating)
// ============================================================
//
// Waiter (internal role value is still "Cashier" so existing
//         data + sync keep working — only the LABEL changed):
//   1★ → "Serveur"
//   2★ → "Left Hand"
//   3★ → "Shift Manager"
//
// Barista:
//   1★ → "Barista Jr"
//   2★ → "Barista"
//   3★ → "Head Barista"
//
// Administrator: always shown as "Owner"
// If no rating set yet, falls back to plain role name.
// ============================================================

import type { Staff, StaffRole } from '@/types';

const TITLES: Record<StaffRole, Record<1 | 2 | 3, string>> = {
  Cashier: {
    1: 'Serveur',
    2: 'Left Hand',
    3: 'Shift Manager',
  },
  Barista: {
    1: 'Barista Jr',
    2: 'Barista',
    3: 'Head Barista',
  },
  Administrator: {
    1: 'Owner',
    2: 'Owner',
    3: 'Owner',
  },
};

export function getStaffTitle(staff: Pick<Staff, 'role' | 'rating'>): string {
  const rating = staff.rating;
  if (rating && [1, 2, 3].includes(rating)) {
    return TITLES[staff.role][rating as 1 | 2 | 3];
  }
  // No rating yet — default fallbacks
  if (staff.role === 'Cashier') return 'Serveur';
  if (staff.role === 'Barista') return 'Barista';
  return 'Owner';
}
