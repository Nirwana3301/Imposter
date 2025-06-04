export interface Player {
  id: number;
  name: string;
  isImposter: boolean;
  isRevealed: boolean; // Um zu steuern, ob die Karte schon aufgedeckt wurde
}
