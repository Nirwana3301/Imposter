// src/app/game/game.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Player } from '../interfaces/player';
import { GameService } from '../service/game.service';

@Component({
  selector: 'app-game',
  templateUrl: './game.html',
  standalone: true
  // Kein 'imports' Array hier, da die Direktiven (@switch, @if, @for) jetzt Teil von Angular Core sind
  // und nicht mehr separat importiert werden müssen, wenn die Komponente standalone ist
  // und das Component Template diese direkt nutzt.
})
export class GameComponent implements OnInit, OnDestroy {
  currentPlayer: Player | null = null;
  secretWord: string = '';
  gamePhase: 'setup' | 'reveal' | 'discussion' | 'resolved' = 'reveal';
  allPlayers: Player[] = [];
  isCardRevealedForCurrentPlayer: boolean = false;
  discussionStartingPlayer: string | null = null; // NEU: Für den Startspieler

  private playersSub!: Subscription;
  private wordSub!: Subscription;
  private turnSub!: Subscription;
  private phaseSub!: Subscription;
  private discussionStarterSub!: Subscription; // NEU: Subscription

  constructor(public gameService: GameService, private router: Router) {}

  ngOnInit(): void {
    this.phaseSub = this.gameService.gamePhase$.subscribe(phase => {
      this.gamePhase = phase;
      if (phase === 'setup') {
        this.router.navigate(['/setup']);
      }
      if (phase === 'resolved') {
        this.allPlayers = this.gameService.getPlayers();
      }
    });

    this.playersSub = this.gameService.players$.subscribe(players => {
      this.allPlayers = players;
      this.updateCurrentPlayerView();
    });

    this.wordSub = this.gameService.secretWord$.subscribe(word => this.secretWord = word);

    this.turnSub = this.gameService.currentTurnIndex$.subscribe(() => {
      this.updateCurrentPlayerView();
      this.isCardRevealedForCurrentPlayer = false;
    });

    // NEU: Startspieler für Diskussion abonnieren
    this.discussionStarterSub = this.gameService.discussionStartingPlayerName$.subscribe(name => {
      this.discussionStartingPlayer = name;
    });

    this.updateCurrentPlayerView();
    if (!this.currentPlayer && this.gameService.getPlayers().length === 0) {
      console.log("Keine Spieler initialisiert, zurück zum Setup.");
      this.router.navigate(['/setup']);
    }
  }

  private updateCurrentPlayerView(): void {
    this.currentPlayer = this.gameService.getCurrentPlayer();
    if (this.currentPlayer) {
      this.isCardRevealedForCurrentPlayer = this.currentPlayer.isRevealed;
    }
  }

  revealCard(): void {
    this.gameService.revealCardForCurrentPlayer();
    this.isCardRevealedForCurrentPlayer = true;
  }

  nextPlayer(): void {
    this.gameService.nextPlayer();
  }

  resolveGame(): void {
    this.gameService.resolveGame();
  }

  startNewRound(): void {
    this.gameService.startNewRound();
  }

  ngOnDestroy(): void {
    this.playersSub?.unsubscribe();
    this.wordSub?.unsubscribe();
    this.turnSub?.unsubscribe();
    this.phaseSub?.unsubscribe();
    this.discussionStarterSub?.unsubscribe(); // NEU: Unsubscribe
  }
}
