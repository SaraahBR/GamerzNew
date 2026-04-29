import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { GamesService } from '../../services/games.service';
import { ToastService } from '../../shared/ui/toast.service';
import { CanvasService } from '../../services/canvas.service';

const NOVO_EXCLUSIONS =
  '.novo-card, .btn-gradiente, input, textarea, label, select, h1';

@Component({
  selector: 'app-jogos-novo',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './jogos-novo.html',
  styleUrls: ['./jogos-novo.css'],
})
export class JogosNovoComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private games = inject(GamesService);
  private router = inject(Router);
  private toasts = inject(ToastService);
  private canvasSvc = inject(CanvasService);

  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.canvasSvc.setPage(true, NOVO_EXCLUSIONS);
  }

  ngOnDestroy() {
    this.canvasSvc.clearPage();
  }

  submitting = false;

  form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(2)]],
    img: ['', [Validators.required]],
    genre: ['', [Validators.required]],
    year: [new Date().getFullYear(), [Validators.required, Validators.min(1970), Validators.max(2100)]],
    dev: ['', Validators.required],
    pub: ['', Validators.required],
    steam: ['', Validators.required],
    description: ['', [Validators.required, Validators.minLength(10)]],
  });

  async submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toasts.warning('Preencha todos os campos obrigatórios.', { title: 'Formulário incompleto', timeout: 2500 });
      return;
    }

    this.submitting = true;
    const v = this.form.value;

    try {
      const created = await this.games.addGame({
        title: v.title!,
        img: v.img!,
        genre: v.genre!.split(',').map(s => s.trim()).filter(Boolean),
        year: Number(v.year),
        dev: v.dev!,
        pub: v.pub!,
        description: v.description!,
        steam: v.steam!,
        favorite: false,
      });

      this.toasts.success('Jogo salvo com sucesso!', { timeout: 2200 });
      this.form.reset({ title: '', img: '', genre: '', year: new Date().getFullYear(), dev: '', pub: '', steam: '', description: '' });
      this.router.navigate(['/jogos'], { queryParams: { added: created.id } });
    } catch (e: any) {
      if (e?.code === 'login_required') {
        this.toasts.danger('Você precisa estar logado para adicionar jogos.', { title: 'Login necessário' });
      } else {
        this.toasts.danger('Não foi possível adicionar o jogo.', { title: 'Erro' });
      }
    } finally {
      this.submitting = false;
    }
  }
}
