// ============================================================
// HEBLI – Staff Weekly Schedule (booked hours) — read-only
// Staff can hide/show this card; the choice is remembered per device.
// ============================================================

import { useMemo, useState } from 'react';
import { CalendarDays, Clock, Eye, EyeOff, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getStaffSchedule, WEEK_DAYS, todayWeekKey, scheduleWeeklyMinutes } from '@/utils/store';

function fmtHours(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

const HIDE_KEY = 'hebli_hide_schedule';

export default function MySchedule({ staffId }: { staffId: string }) {
  const schedule = useMemo(() => getStaffSchedule(staffId), [staffId]);
  const today = todayWeekKey();
  const weekly = scheduleWeeklyMinutes(schedule);

  const [open, setOpen] = useState<boolean>(() => localStorage.getItem(HIDE_KEY) !== '1');
  const toggle = () => {
    setOpen((v) => {
      const next = !v;
      localStorage.setItem(HIDE_KEY, next ? '0' : '1');
      return next;
    });
  };

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold tracking-wider uppercase text-white/50">
          <CalendarDays className="h-4 w-4 text-[#D4AF37]" />
          Mes horaires
        </h3>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[#D4AF37]/10 px-2.5 py-0.5 text-[10px] font-semibold text-[#D4AF37]">
            {fmtHours(weekly)} / semaine
          </span>
          <button
            onClick={toggle}
            className="inline-flex items-center gap-1 rounded-lg border border-white/[0.08] px-2.5 py-1 text-[11px] font-medium text-white/50 hover:text-white hover:bg-white/[0.05] transition-colors"
            title={open ? 'Masquer mes horaires' : 'Afficher mes horaires'}
          >
            {open ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{open ? 'Masquer' : 'Afficher'}</span>
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {WEEK_DAYS.map((d) => {
                const day = schedule[d.key];
                const isToday = d.key === today;
                return (
                  <div
                    key={d.key}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                      isToday ? 'border-[#D4AF37]/40 bg-[#D4AF37]/[0.08]' : 'border-white/[0.05] bg-white/[0.02]'
                    }`}
                  >
                    <span className={`font-medium ${isToday ? 'text-[#D4AF37]' : 'text-white/70'}`}>
                      {d.labelFr}
                      {isToday && <span className="ml-1.5 text-[9px] uppercase tracking-wider text-[#D4AF37]/70">· aujourd'hui</span>}
                    </span>
                    {day.working ? (
                      <span className="flex items-center gap-1.5 font-mono text-white/80">
                        <Clock className="h-3.5 w-3.5 text-white/30" />
                        {day.start} – {day.end}
                      </span>
                    ) : (
                      <span className="text-xs uppercase tracking-wider text-white/25">Repos</span>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
