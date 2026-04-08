import { Day, EventInfo, Session, SessionStatus } from "./types";

export const EVENT_INFO: EventInfo = {
  name: "Sapphire Momentum II",
  subtitle: "2nd Anniversary Edition",
  dates: "24-26 Nisan",
  location: "Kremlin Palace, Antalya",
  address:
    "Kundu Mah. Yaşar Sobutay Bulv. Kremlin Otel Sit. No:98/10 No: A201 Aksu / Antalya",
};

export const SCHEDULE: Day[] = [
  {
    day: "Cuma",
    dayEN: "Friday",
    date: "2025-04-25",
    mc: "Sinan Güler & Ayşe Özçobanlar",
    sessions: [
      { start: "10:00", end: "12:30", title: "Giriş", type: "general" },
      { start: "12:30", end: "14:30", title: "Öğle Yemeği", type: "meal" },
      {
        start: "16:15",
        end: "17:30",
        title: "Ruby Okulu",
        speaker: "Gürkan Kandemir",
        type: "session",
      },
      {
        start: "17:30",
        end: "20:30",
        title: "Serbest Zaman ve Akşam Yemeği",
        type: "meal",
      },
      { start: "20:30", end: null, title: "Kapı Açılış", type: "general" },
      {
        start: "20:45",
        end: null,
        title: "2. Yıl Dönümü Açılış Konuşması",
        speaker: "Nuran & Gürkan Kandemir",
        type: "keynote",
      },
      { start: "21:15", end: null, title: "Konser", type: "entertainment" },
    ],
  },
  {
    day: "Cumartesi",
    dayEN: "Saturday",
    date: "2025-04-26",
    mc: "Esra & Kadir Turgut",
    sessions: [
      { start: "07:00", end: "09:30", title: "Kahvaltı", type: "meal" },
      {
        start: "09:30",
        end: "10:15",
        title: "İkna Problemi Değil İnanç Problemi",
        speaker: "Yusuf Erdem Bakır",
        type: "session",
      },
      { start: "10:15", end: "10:30", title: "Ara", type: "break" },
      {
        start: "10:30",
        end: "11:15",
        title: "Network'te Servet Mantığı",
        speaker: "Kadir Yıldız",
        type: "session",
      },
      { start: "11:15", end: "11:30", title: "Ara", type: "break" },
      {
        start: "11:30",
        end: "12:30",
        title: "İnsanlar Neden Katılır Neden Kalır",
        speaker: "Yaşar Güler",
        type: "session",
      },
      { start: "12:30", end: "13:45", title: "Öğle Yemeği", type: "meal" },
      {
        start: "13:45",
        end: "15:15",
        title: "Kişisel Marka ve Storytelling ile Güven İnşası",
        speaker: "Serdar Örs",
        type: "session",
      },
      { start: "15:15", end: "15:30", title: "Ara", type: "break" },
      {
        start: "15:30",
        end: "16:30",
        title: "Sistem Kurmak: Sen Olmadan Çalışan Organizasyon",
        speaker: "Şule Ünal",
        type: "session",
      },
      { start: "16:30", end: "18:00", title: "Ara", type: "break" },
      {
        start: "18:00",
        end: null,
        title: "Vizyon Liderliği",
        speaker: "Ayberk Dedecan",
        type: "session",
      },
      { start: null, end: null, title: "Akşam Yemeği", type: "meal" },
      {
        start: "21:00",
        end: null,
        title: "Takdir Töreni",
        subtitle: "SP Kutlaması Son ve Yenisi",
        type: "ceremony",
      },
    ],
  },
  {
    day: "Pazar",
    dayEN: "Sunday",
    date: "2025-04-27",
    mc: "Metin Kılıç & Meral Çimen",
    sessions: [
      { start: "07:00", end: "09:30", title: "Kahvaltı", type: "meal" },
      {
        start: "09:45",
        end: "10:30",
        title: "Küpe Modeli - İşin Anayası",
        speaker: "Erdal Çakır",
        type: "session",
      },
      { start: "10:30", end: "10:45", title: "Ara", type: "break" },
      {
        start: "10:45",
        end: "12:00",
        title: "Küresel Vizyon İnşası",
        speaker: "Jean Marc Colaïanni",
        type: "session",
      },
      {
        start: "12:00",
        end: "13:00",
        title: "Oda Boşaltma ve Coffee Break",
        type: "break",
      },
      {
        start: "13:15",
        end: "15:00",
        title: "Kapanış Konuşması",
        speaker: "Gürkan Kandemir",
        type: "keynote",
      },
    ],
  },
];

function parseTime(timeStr: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return { hours, minutes };
}

function timeToMinutes(timeStr: string): number {
  const { hours, minutes } = parseTime(timeStr);
  return hours * 60 + minutes;
}

/** Get hours and minutes in Istanbul timezone from a Date */
function getIstanbulTime(date: Date): { hours: number; minutes: number } {
  const timeStr = date.toLocaleTimeString("en-GB", {
    timeZone: "Europe/Istanbul",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const [hours, minutes] = timeStr.split(":").map(Number);
  return { hours, minutes };
}

function nowToMinutes(date: Date): number {
  const { hours, minutes } = getIstanbulTime(date);
  return hours * 60 + minutes;
}

export function getSessionsForDay(dayIndex: number): Session[] {
  return SCHEDULE[dayIndex]?.sessions ?? [];
}

export function getSessionStatus(
  session: Session,
  now: Date
): SessionStatus {
  if (!session.start) return "upcoming";

  const currentMinutes = nowToMinutes(now);
  const startMinutes = timeToMinutes(session.start);

  if (session.end) {
    const endMinutes = timeToMinutes(session.end);
    if (currentMinutes >= endMinutes) return "completed";
    if (currentMinutes >= startMinutes) return "active";
    return "upcoming";
  }

  // Session with no end time: use next session's start as implicit end
  const dayIndex = SCHEDULE.findIndex((d) => d.sessions.includes(session));
  if (dayIndex === -1) return "upcoming";

  const sessions = SCHEDULE[dayIndex].sessions;
  const sessionIndex = sessions.indexOf(session);
  const nextSession = sessions[sessionIndex + 1];

  if (nextSession?.start) {
    const nextStartMinutes = timeToMinutes(nextSession.start);
    if (currentMinutes >= nextStartMinutes) return "completed";
  }

  if (currentMinutes >= startMinutes) return "active";
  return "upcoming";
}

export function getCurrentDayIndex(now: Date): number {
  const dateStr = now.toLocaleDateString("en-CA", {
    timeZone: "Europe/Istanbul",
  });

  for (let i = 0; i < SCHEDULE.length; i++) {
    if (SCHEDULE[i].date === dateStr) return i;
  }

  if (dateStr < SCHEDULE[0].date) return 0;
  return SCHEDULE.length - 1;
}

export function getActiveSession(
  dayIndex: number,
  now: Date
): Session | null {
  const sessions = getSessionsForDay(dayIndex);
  return (
    sessions.find((s) => getSessionStatus(s, now) === "active") ?? null
  );
}

export function getNextSpeakerSession(
  dayIndex: number,
  now: Date
): Session | null {
  const sessions = getSessionsForDay(dayIndex);
  return (
    sessions.find(
      (s) => s.speaker && getSessionStatus(s, now) === "upcoming"
    ) ?? null
  );
}

export function getSessionRemainingSeconds(
  session: Session,
  now: Date
): number | null {
  if (!session.end) return null;

  const { hours, minutes } = parseTime(session.end);
  const istanbul = getIstanbulTime(now);
  const endMinutesTotal = hours * 60 + minutes;
  const nowMinutesTotal = istanbul.hours * 60 + istanbul.minutes;
  const nowSeconds = now.getSeconds();

  const diffSeconds =
    (endMinutesTotal - nowMinutesTotal) * 60 - nowSeconds;
  return diffSeconds > 0 ? diffSeconds : 0;
}
