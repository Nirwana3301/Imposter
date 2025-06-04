import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {Player} from '../interfaces/player';


@Injectable({
  providedIn: 'root',
})
export class GameService {
  private playersSubject = new BehaviorSubject<Player[]>([]);
  players$ = this.playersSubject.asObservable();

  private secretWordSubject = new BehaviorSubject<string>('');
  secretWord$ = this.secretWordSubject.asObservable();

  private currentTurnIndexSubject = new BehaviorSubject<number>(0);
  currentTurnIndex$ = this.currentTurnIndexSubject.asObservable();

  private gamePhaseSubject = new BehaviorSubject<'setup' | 'reveal' | 'discussion' | 'resolved'>('setup');
  gamePhase$ = this.gamePhaseSubject.asObservable();

  private availableWords: string[] = [
    'Apfel', 'Banane', 'Kirsche', 'Datum', 'Holunder',
    'Fahrrad', 'Auto', 'Bus', 'Zug', 'Flugzeug',
    'Eieruhr', 'Sanduhr', 'Stoppuhr', 'Wecker', 'Sonnenuhr',
    'Tisch', 'Stuhl', 'Sofa', 'Bett', 'Schrank',
    'Hund', 'Katze', 'Maus', 'Elefant', 'Giraffe'
  ]; // Beispielwörter, erweitere diese Liste!

  private _players: Player[] = [];
  private _secretWord: string = '';
  private _numImposters: number = 0;

  constructor() {}

  setupGame(playerNames: string[], numImposters: number): boolean {
    if (playerNames.length === 0 || numImposters <= 0 || numImposters >= playerNames.length) {
      console.error("Invalid game setup parameters");
      return false; // Ungültige Eingabe
    }

    this._numImposters = numImposters;
    this._players = playerNames.map((name, index) => ({
      id: index,
      name: name,
      isImposter: false,
      isRevealed: false, // Wichtig für die UI-Logik
    }));

    // Wähle ein zufälliges Wort
    this._secretWord = this.availableWords[Math.floor(Math.random() * this.availableWords.length)];
    this.secretWordSubject.next(this._secretWord);

    // Wähle zufällige Imposter
    let impostersAssigned = 0;
    const playerIndices = this._players.map((_, i) => i); // Array von Indizes

    while (impostersAssigned < this._numImposters) {
      const randomIndex = Math.floor(Math.random() * playerIndices.length);
      const playerIndexToMakeImposter = playerIndices.splice(randomIndex, 1)[0]; // Wähle und entferne Index

      if (!this._players[playerIndexToMakeImposter].isImposter) {
        this._players[playerIndexToMakeImposter].isImposter = true;
        impostersAssigned++;
      }
    }

    this.playersSubject.next([...this._players]); // Kopie übergeben, um Change Detection zu triggern
    this.currentTurnIndexSubject.next(0);
    this.gamePhaseSubject.next('reveal');
    return true;
  }

  revealCardForCurrentPlayer(): void {
    const currentIndex = this.currentTurnIndexSubject.value;
    if (currentIndex < this._players.length) {
      this._players[currentIndex].isRevealed = true;
      this.playersSubject.next([...this._players]);
    }
  }

  nextPlayer(): void {
    const currentIndex = this.currentTurnIndexSubject.value;
    // Aktuelle Karte wieder "verstecken" für den nächsten Spieler (optional, aber guter UX)
    if (currentIndex < this._players.length) {
      this._players[currentIndex].isRevealed = false; // Karte des aktuellen Spielers zurücksetzen
    }

    if (currentIndex + 1 < this._players.length) {
      this.currentTurnIndexSubject.next(currentIndex + 1);
      this.playersSubject.next([...this._players]); // Update, falls isRevealed zurückgesetzt wurde
    } else {
      // Alle Spieler haben ihre Rolle gesehen
      this.gamePhaseSubject.next('discussion');
    }
  }

  resolveGame(): void {
    this.gamePhaseSubject.next('resolved');
    // Alle Karten aufdecken für die Auflösung
    this._players.forEach(p => p.isRevealed = true);
    this.playersSubject.next([...this._players]);
  }

  startNewRound(): void {
    this._players = [];
    this._secretWord = '';
    this.playersSubject.next([]);
    this.secretWordSubject.next('');
    this.currentTurnIndexSubject.next(0);
    this.gamePhaseSubject.next('setup');
  }

  getCurrentPlayer(): Player | null {
    const index = this.currentTurnIndexSubject.value;
    return this._players[index] || null;
  }

  getPlayers(): Player[] {
    return this._players;
  }

  getSecretWord(): string {
    return this._secretWord;
  }
}
