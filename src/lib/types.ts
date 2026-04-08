export type SessionType =
  | "general"
  | "meal"
  | "session"
  | "keynote"
  | "entertainment"
  | "ceremony"
  | "break";

export type SessionStatus =
  | "completed"
  | "active"
  | "next"
  | "upcoming";

export type EventState =
  | "pre-event"
  | "during-event"
  | "between-days"
  | "post-event";

export interface Session {
  start: string | null; // "HH:MM" or null
  end: string | null;   // "HH:MM" or null
  title: string;
  titleEN?: string;
  speaker?: string;
  subtitle?: string;
  type: SessionType;
}

export interface Day {
  day: string;        // "Cuma" | "Cumartesi" | "Pazar"
  dayEN: string;      // "Friday" | "Saturday" | "Sunday"
  date: string;       // "2025-04-25"
  mc: string;
  sessions: Session[];
}

export interface EventInfo {
  name: string;
  subtitle: string;
  dates: string;
  location: string;
  address: string;
}
