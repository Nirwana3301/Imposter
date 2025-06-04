// src/app/setup/setup.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { GameService } from '../service/game.service';
import {NgOptimizedImage} from '@angular/common';

const LOCAL_STORAGE_KEY_PLAYERS = 'imposterGamePlayers';

@Component({
  selector: 'app-setup',
  templateUrl: './setup.html',
  imports: [
    ReactiveFormsModule,
    NgOptimizedImage
  ],
  standalone: true
})
export class SetupComponent implements OnInit {
  public setupForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private gameService: GameService,
    private router: Router
  ) {
    this.setupForm = this.fb.group({
      playerNames: this.fb.array([]),
      numImposters: [1, [Validators.required, Validators.min(1)]],
      giveHint: [false] // Neues Formularfeld für die Hilfswort-Option, standardmäßig deaktiviert
    });
  }

  ngOnInit(): void {
    this.loadAndInitializePlayers();
  }

  private loadAndInitializePlayers(): void {
    const storedPlayers = this.getPlayersFromLocalStorage();
    let playersToLoad: string[] = [];

    if (storedPlayers && storedPlayers.length > 0) {
      playersToLoad = storedPlayers;
    }

    if (playersToLoad.length === 0) {
      playersToLoad.push('');
    }

    playersToLoad.forEach(name => {
      this.playerNames.push(this.fb.control(name, Validators.required));
    });
  }

  private getPlayersFromLocalStorage(): string[] | null {
    if (typeof localStorage !== 'undefined') {
      const storedData = localStorage.getItem(LOCAL_STORAGE_KEY_PLAYERS);
      if (storedData) {
        try {
          const players = JSON.parse(storedData);
          if (Array.isArray(players) && players.every(p => typeof p === 'string')) {
            return players;
          }
        } catch (e) {
          console.error('Fehler beim Parsen der Spieler aus dem localStorage:', e);
          localStorage.removeItem(LOCAL_STORAGE_KEY_PLAYERS);
          return null;
        }
      }
    }
    return null;
  }

  private savePlayersToLocalStorage(playerNames: string[]): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY_PLAYERS, JSON.stringify(playerNames));
    } else {
      console.warn('localStorage ist nicht verfügbar. Spieler wurden nicht gespeichert.');
    }
  }

  get playerNames(): FormArray {
    return this.setupForm.get('playerNames') as FormArray;
  }

  addPlayer(): void {
    this.playerNames.push(this.fb.control('', Validators.required));
  }

  removePlayer(index: number): void {
    if (this.playerNames.length > 1) {
      this.playerNames.removeAt(index);
    } else {
      alert('Es muss mindestens ein Spieler vorhanden sein.');
    }
  }

  onSubmit(): void {
    if (this.setupForm.valid) {
      const names: string[] = this.playerNames.value
        .map((name: string) => name.trim())
        .filter((name: string) => name !== '');

      const numImposters: number = this.setupForm.value.numImposters;
      const giveHint: boolean = this.setupForm.value.giveHint; // Wert der Checkbox auslesen

      if (names.length === 0) {
        alert('Bitte geben Sie mindestens einen gültigen Spielernamen ein.');
        return;
      }

      if (numImposters >= names.length) {
        alert('Die Anzahl der Imposter muss kleiner als die Anzahl der Spieler sein.');
        return;
      }

      this.savePlayersToLocalStorage(names);

      // 'giveHint' an setupGame übergeben
      if (this.gameService.setupGame(names, numImposters, giveHint)) {
        this.router.navigate(['/game']);
      } else {
        alert('Fehler beim Setup des Spiels. Bitte überprüfe die Eingaben.');
      }
    } else {
      alert('Bitte füllen Sie alle erforderlichen Felder korrekt aus.');
      this.setupForm.markAllAsTouched();
    }
  }
}
