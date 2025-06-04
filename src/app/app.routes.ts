import { Routes } from '@angular/router';
import {SetupComponent} from './setup/setup';
import {GameComponent} from './game/game';

export const routes: Routes = [
  { path: 'setup', component: SetupComponent },
  { path: 'game', component: GameComponent },
  { path: '', redirectTo: '/setup', pathMatch: 'full' },
  { path: '**', redirectTo: '/setup' } // Fallback
];

