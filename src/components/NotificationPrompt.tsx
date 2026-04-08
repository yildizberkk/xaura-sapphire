"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getNotificationPreference,
  requestNotificationPermission,
  scheduleNotifications,
  dismissNotificationPrompt,
  isIOS,
  isStandalone,
} from "@/lib/notifications";

interface NotificationPromptProps {
  show: boolean;
}

export default function NotificationPrompt({ show }: NotificationPromptProps) {
  const [visible, setVisible] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    if (!show) return;
    if (getNotificationPreference() !== "undecided") return;

    const timer = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(timer);
  }, [show]);

  const handleAccept = async () => {
    if (isIOS() && !isStandalone()) {
      setShowIOSGuide(true);
      return;
    }
    const granted = await requestNotificationPermission();
    if (granted) {
      scheduleNotifications();
    }
    setVisible(false);
  };

  const handleDismiss = () => {
    dismissNotificationPrompt();
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-0 inset-x-0 z-40 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
        >
          <div className="max-w-[440px] mx-auto rounded-2xl border border-white/10 bg-sky-deep/80 backdrop-blur-xl p-5 shadow-2xl">
            {!showIOSGuide ? (
              <>
                <p className="text-cream text-sm font-semibold mb-1">
                  Oturum hatırlatıcılarını açmak ister misiniz?
                </p>
                <p className="text-cream/50 text-xs mb-4">
                  Her oturum başlamadan 5 dk önce bildirim alın.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleAccept}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-gold-dark to-gold-light text-sky-deep text-sm font-bold active:scale-95 transition-transform"
                  >
                    Evet, hatırlat
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="flex-1 py-2.5 rounded-xl border border-white/10 text-cream/50 text-sm active:scale-95 transition-transform"
                  >
                    Şimdi değil
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-cream text-sm font-semibold mb-3">
                  Bildirimleri almak için Ana Ekrana ekleyin
                </p>
                <ol className="text-cream/60 text-xs space-y-2 mb-4 list-decimal list-inside">
                  <li>
                    Alttaki{" "}
                    <span className="inline-block text-cream/80">
                      Paylaş
                    </span>{" "}
                    ({"\u2B06"}) butonuna dokunun
                  </li>
                  <li>
                    <span className="text-cream/80">
                      Ana Ekrana Ekle
                    </span>{" "}
                    seçeneğini seçin
                  </li>
                  <li>
                    Uygulamayı ana ekrandan açın
                  </li>
                </ol>
                <button
                  onClick={handleDismiss}
                  className="w-full py-2.5 rounded-xl border border-white/10 text-cream/50 text-sm active:scale-95 transition-transform"
                >
                  Anlaşıldı
                </button>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
