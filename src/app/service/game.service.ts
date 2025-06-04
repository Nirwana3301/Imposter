// src/app/service/game.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Player } from '../interfaces/player';

interface WordEntry {
  secretWord: string;
  hintWord: string;
}

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

  // NEU: Subject für den Startspieler der Diskussion
  private discussionStartingPlayerNameSubject = new BehaviorSubject<string | null>(null);
  discussionStartingPlayerName$ = this.discussionStartingPlayerNameSubject.asObservable();

  private availableWords: WordEntry[] = [
    { secretWord: 'Apfel', hintWord: 'Obstsorte' },
    { secretWord: 'Banane', hintWord: 'Gelbes Obst' },
    { secretWord: 'Kirsche', hintWord: 'Kleines rotes Obst' },
    { secretWord: 'Fahrrad', hintWord: 'Fortbewegungsmittel' },
    { secretWord: 'Auto', hintWord: 'Motorisiert' },
    { secretWord: 'Eieruhr', hintWord: 'Zeitmessung' },
    // ... (deine Wortliste)
  ];

  private _players: Player[] = [];
  private _secretWord: string = '';
  private _numImposters: number = 0;
  private _giveHintToImposter: boolean = false;
  private _discussionStartingPlayerName: string | null = null; // NEU: Interner Speicher

  constructor() {}

  setupGame(playerNames: string[], numImposters: number, giveHintToImposter: boolean): boolean {
    // ... (bestehende Logik) ...
    // Reset für den Startspieler bei neuem Spielaufbau
    this._discussionStartingPlayerName = null;
    this.discussionStartingPlayerNameSubject.next(null);
    // ... (bestehende Logik) ...
    // Dies stellt sicher, dass bei einem neuen Spiel der vorherige Startspieler gelöscht wird.
    // Der eigentliche Startspieler wird erst am Ende der Enthüllungsphase gesetzt.
    if (playerNames.length === 0 || numImposters <= 0 || numImposters >= playerNames.length) {
      console.error("Invalid game setup parameters");
      return false;
    }

    this._numImposters = numImposters;
    this._giveHintToImposter = giveHintToImposter;

    const randomWordEntry = this.availableWords[Math.floor(Math.random() * this.availableWords.length)];
    this._secretWord = randomWordEntry.secretWord;
    const currentRoundHintWord = randomWordEntry.hintWord;

    this.secretWordSubject.next(this._secretWord);

    this._players = playerNames.map((name, index) => ({
      id: index,
      name: name,
      isImposter: false,
      isRevealed: false,
      hintWord: undefined,
    }));

    let impostersAssigned = 0;
    const playerIndices = this._players.map((_, i) => i);

    while (impostersAssigned < this._numImposters) {
      const randomIndex = Math.floor(Math.random() * playerIndices.length);
      const playerIndexToMakeImposter = playerIndices.splice(randomIndex, 1)[0];

      if (!this._players[playerIndexToMakeImposter].isImposter) {
        this._players[playerIndexToMakeImposter].isImposter = true;
        if (this._giveHintToImposter) {
          this._players[playerIndexToMakeImposter].hintWord = currentRoundHintWord;
        }
        impostersAssigned++;
      }
    }

    this.playersSubject.next([...this._players]);
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
    if (currentIndex < this._players.length) {
      this._players[currentIndex].isRevealed = false; // Karte des aktuellen Spielers zurücksetzen
    }

    if (currentIndex + 1 < this._players.length) {
      this.currentTurnIndexSubject.next(currentIndex + 1);
      this.playersSubject.next([...this._players]);
    } else {
      // Alle Spieler haben ihre Rolle gesehen, Übergang zur Diskussionsphase
      this.gamePhaseSubject.next('discussion');
      // Wähle zufällig einen Startspieler für die Diskussion
      if (this._players.length > 0) {
        const randomIndex = Math.floor(Math.random() * this._players.length);
        this._discussionStartingPlayerName = this._players[randomIndex].name;
        this.discussionStartingPlayerNameSubject.next(this._discussionStartingPlayerName);
      } else {
        // Fallback, sollte nicht passieren bei korrektem Spielablauf
        this._discussionStartingPlayerName = null;
        this.discussionStartingPlayerNameSubject.next(null);
      }
    }
  }

  resolveGame(): void {
    this.gamePhaseSubject.next('resolved');
    this._players.forEach(p => p.isRevealed = true);
    this.playersSubject.next([...this._players]);
  }

  startNewRound(): void {
    this._players = [];
    this._secretWord = '';
    this._giveHintToImposter = false;
    this._discussionStartingPlayerName = null; // NEU: Zurücksetzen
    this.discussionStartingPlayerNameSubject.next(null); // NEU: Zurücksetzen
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
