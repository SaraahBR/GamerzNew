import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { GAMES, Game } from './games.data';

@Component({
  selector: 'app-jogos',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './jogos.component.html',
  styleUrls: ['./jogos.component.css']
})
export class JogosComponent {
  games: Game[] = GAMES;
}
