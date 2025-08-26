import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { GAMES, Game } from './games.data';

@Component({
  selector: 'app-jogo-detalhes',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './jogo-detalhes.component.html',
  styleUrls: ['./jogo-detalhes.component.css']
})
export class JogoDetalhesComponent {
  game?: Game;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.game = GAMES.find(g => g.id === id);
  }
}
