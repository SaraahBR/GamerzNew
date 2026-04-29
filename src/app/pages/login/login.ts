import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { GamesService } from '../../services/games.service';
import { CanvasService } from '../../services/canvas.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class LoginComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private games = inject(GamesService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private canvasSvc = inject(CanvasService);

  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.canvasSvc.setPage(true, '.card, .btn-gradiente, .btn-google, input, label, h1');
  }

  ngOnDestroy() {
    this.canvasSvc.clearPage();
  }

  form = this.fb.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(3)]],
  });

  submitting = false;
  error?: string;

  async submit() {
    this.error = undefined;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    try {
      const { email, name } = this.form.value;
      await this.auth.login(email!, name || undefined);
      await this.games.refresh();

      const from = this.route.snapshot.queryParamMap.get('from') || '/jogos';
      this.router.navigateByUrl(from);
    } catch {
      this.error = 'Não foi possível efetuar login.';
    } finally {
      this.submitting = false;
    }
  }

  // Google: redireciona a PÁGINA inteira
  google(): void {
    const from = this.route.snapshot.queryParamMap.get('from') || '/jogos';
    if (typeof window !== 'undefined') {
      window.location.assign(`/api/auth/google/start?from=${encodeURIComponent(from)}`);
    }
  }
}
