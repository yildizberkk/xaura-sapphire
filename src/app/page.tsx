"use client";

import { useState, useCallback, useEffect } from "react";
import { useCurrentTime, getEventState } from "@/lib/time";
import { getCurrentDayIndex, getSessionsForDay, SCHEDULE } from "@/lib/schedule";
import SkyBackground from "@/components/SkyBackground";
import Header from "@/components/Header";
import DayTabs from "@/components/DayTabs";
import SessionList from "@/components/SessionList";
import ContextualMessage from "@/components/ContextualMessage";
import BoardingIntro from "@/components/BoardingIntro";
import NotificationPrompt from "@/components/NotificationPrompt";
import { registerServiceWorker, scheduleNotifications, getNotificationPreference } from "@/lib/notifications";

export default function Home() {
  const now = useCurrentTime();
  const eventState = getEventState(now);
  const autoDayIndex = getCurrentDayIndex(now);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [introComplete, setIntroComplete] = useState(false);
  const handleIntroComplete = useCallback(() => setIntroComplete(true), []);

  useEffect(() => {
    registerServiceWorker().then(() => {
      if (getNotificationPreference() === "granted") {
        scheduleNotifications();
      }
    });
  }, []);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && getNotificationPreference() === "granted") {
        scheduleNotifications();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  const dayIndex = selectedDay ?? autoDayIndex;
  const sessions = getSessionsForDay(dayIndex);

  return (
    <>
      {!introComplete && <BoardingIntro onComplete={handleIntroComplete} />}

      <SkyBackground now={now} />

      <main className="relative min-h-screen flex flex-col max-w-[440px] mx-auto">
        <Header />

        <ContextualMessage eventState={eventState} now={now} />

        <DayTabs
          activeIndex={dayIndex}
          onSelect={(index) => setSelectedDay(index)}
        />

        {/* MC info */}
        <p className="text-center text-[10px] text-cream/30 mb-2">
          MC: {SCHEDULE[dayIndex].mc}
        </p>

        <SessionList sessions={sessions} now={now} />
      </main>

      <NotificationPrompt show={introComplete} />
    </>
  );
}
