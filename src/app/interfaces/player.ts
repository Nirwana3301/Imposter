// src/app/interfaces/player.ts
export interface Player {
  id: number;
  name: string;
  isImposter: boolean;
  isRevealed: boolean;
  hintWord?: string; // Optional: Hilfswort für den Imposter
}
