import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import {Player} from '../interfaces/player';
import {GameService} from '../service/game.service';

@Component({
  selector: 'app-game',
  templateUrl: './game.html',
  standalone: true
})
export class GameComponent implements OnInit, OnDestroy {
  currentPlayer: Player | null = null;
  secretWord: string = '';
  gamePhase: 'setup' | 'reveal' | 'discussion' | 'resolved' = 'reveal';
  allPlayers: Player[] = []; // Für die Auflösung

  private playersSub!: Subscription;
  private wordSub!: Subscription;
  private turnSub!: Subscription;
  private phaseSub!: Subscription;

  isCardRevealedForCurrentPlayer: boolean = false;

  constructor(public gameService: GameService, private router: Router) {}

  ngOnInit(): void {
    this.phaseSub = this.gameService.gamePhase$.subscribe(phase => {
      this.gamePhase = phase;
      if (phase === 'setup') {
        this.router.navigate(['/setup']); // Wenn Service resettet wird, zurück zum Setup
      }
      if (phase === 'resolved') {
        this.allPlayers = this.gameService.getPlayers(); // Alle Spieler für die Auflösung holen
      }
    });

    this.playersSub = this.gameService.players$.subscribe(players => {
      // Aktualisiert currentPlayer, falls sich die Liste ändert (z.B. isRevealed)
      // Wird auch für die Auflösungsansicht verwendet
      this.allPlayers = players;
      this.updateCurrentPlayerView();
    });

    this.wordSub = this.gameService.secretWord$.subscribe(word => this.secretWord = word);

    this.turnSub = this.gameService.currentTurnIndex$.subscribe(() => {
      this.updateCurrentPlayerView();
      this.isCardRevealedForCurrentPlayer = false; // Karte für neuen Spieler ist wieder verdeckt
    });

    // Initialen Spieler setzen
    this.updateCurrentPlayerView();
    if (!this.currentPlayer && this.gameService.getPlayers().length === 0) {
      console.log("Keine Spieler initialisiert, zurück zum Setup.");
      this.router.navigate(['/setup']);
    }
  }

  private updateCurrentPlayerView(): void {
    this.currentPlayer = this.gameService.getCurrentPlayer();
    if (this.currentPlayer) {
      // Überprüfen, ob die Karte für den aktuellen Spieler *im Service* bereits als revealed markiert ist
      // Dies ist nützlich, wenn man z.B. zurück navigiert oder die Komponente neu geladen wird.
      this.isCardRevealedForCurrentPlayer = this.currentPlayer.isRevealed;
    }
  }

  revealCard(): void {
    this.gameService.revealCardForCurrentPlayer();
    this.isCardRevealedForCurrentPlayer = true;
  }

  nextPlayer(): void {
    this.gameService.nextPlayer();
    // isCardRevealedForCurrentPlayer wird im turnSub oder updateCurrentPlayerView zurückgesetzt
  }

  resolveGame(): void {
    this.gameService.resolveGame();
  }

  startNewRound(): void {
    this.gameService.startNewRound();
    // Navigation zum Setup wird durch phaseSub in ngOnInit gehandhabt
  }

  ngOnDestroy(): void {
    this.playersSub?.unsubscribe();
    this.wordSub?.unsubscribe();
    this.turnSub?.unsubscribe();
    this.phaseSub?.unsubscribe();
  }
}
