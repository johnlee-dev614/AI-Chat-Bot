import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AppState {
  ageVerified: boolean;
  setAgeVerified: (verified: boolean) => void;
  disclaimerAcknowledged: boolean;
  setDisclaimerAcknowledged: (ack: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      ageVerified: false,
      setAgeVerified: (verified) => set({ ageVerified: verified }),
      disclaimerAcknowledged: false,
      setDisclaimerAcknowledged: (ack) => set({ disclaimerAcknowledged: ack }),
    }),
    {
      name: "chat-app-storage",
    }
  )
);
