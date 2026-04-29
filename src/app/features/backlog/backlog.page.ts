import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { BacklogStore, BacklogStatus } from './backlog.store';
import { CanvasService } from '../../services/canvas.service';

const BACKLOG_EXCLUSIONS =
  '.backlog-form, .item-card, .btn, .chip, .danger, .ghost, input, select, textarea, h1, h2, label';

@Component({
  selector: 'app-backlog-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './backlog.page.html',
  styleUrls: ['./backlog.page.css'],
})
export class BacklogPage implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private store = inject(BacklogStore);
  private canvasSvc = inject(CanvasService);

  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.canvasSvc.setPage(true, BACKLOG_EXCLUSIONS);
  }

  ngOnDestroy() {
    this.canvasSvc.clearPage();
  }

  form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(2)]],
    platform: [''],
    img: [''],
    priority: ['media' as 'alta' | 'media' | 'baixa'],
    status: ['pendente' as BacklogStatus],
    notes: [''],
  });

  total(): number { return this.store.total(); }
  items() { return this.store.sorted(); }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const { title, platform, priority, status, notes, img } = this.form.getRawValue();
    this.store.add({
      title: title.trim(),
      platform: platform?.trim() || undefined,
      priority: priority || undefined,
      status,
      img: img?.trim() || '',
      notes: notes?.trim() || undefined,
    });
    this.form.reset({ title: '', platform: '', img: '', priority: 'media', status: 'pendente', notes: '' });
  }

  setStatus(id: number, status: BacklogStatus): void { this.store.update(id, { status }); }
  remove(id: number): void { this.store.remove(id); }
  clear(): void { this.store.clear(); }
}
