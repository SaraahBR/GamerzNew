import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { GamesService } from '../../services/games.service';

@Component({
  selector: 'app-jogos-novo',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './jogos-novo.component.html',
  styleUrls: ['./jogos-novo.component.css']
})
export class JogosNovoComponent {
  private fb = inject(FormBuilder);
  private games = inject(GamesService);
  private router = inject(Router);

  form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(2)]],
    img: ['', [Validators.required]],
    genre: ['', [Validators.required]],
    year: [2024, [Validators.required, Validators.min(1970), Validators.max(2100)]],
    dev: ['', Validators.required],
    pub: ['', Validators.required],
    steam: ['', Validators.required],
    description: ['', [Validators.required, Validators.minLength(10)]],
  });

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.value;
    this.games.addGame({
      title: v.title!,
      img: v.img!,
      genre: v.genre!.split(',').map(s => s.trim()).filter(Boolean),
      year: Number(v.year),
      dev: v.dev!,
      pub: v.pub!,
      description: v.description!,
      steam: v.steam!,
      favorite: false
    });
    this.router.navigateByUrl('/jogos');
  }
}
