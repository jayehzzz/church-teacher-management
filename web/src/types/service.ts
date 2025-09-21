export interface FirstTimerInline {
  name: string;
  added_at?: string;
  added_by?: string;
}

export interface AttendanceBreakdown {
  members: number;
  first_timers: number;
}

export type ServiceType = "Sunday service" | "Bacenta" | "Special event" | "Other";

export interface ServiceRecord {
  id: string;
  service_date: string; // ISO date e.g. 2025-08-24
  topic?: string;
  notes?: string;
  service_type?: ServiceType;

  attendance_adults?: number;
  attendance_children?: number;
  attendance_first_timers?: number; // derived but stored for convenience
  converts?: number;
  tithers?: number;

  attendees?: string[]; // member full names
  first_timers?: FirstTimerInline[];

  total_attendance?: number; // derived but stored for convenience
  attendance_breakdown?: AttendanceBreakdown; // derived but stored for convenience

  service_image_refs?: string[];

  created_at?: string;
  updated_at?: string;
}

export function computeAttendanceMetrics(attendees: string[] = [], firstTimers: FirstTimerInline[] = []) {
  const members = attendees.length;
  const first_timers = firstTimers.length;
  const total = members + first_timers;
  return {
    attendance_first_timers: first_timers,
    total_attendance: total,
    attendance_breakdown: { members, first_timers },
  } as const;
}



