import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { BacklogStore, BacklogStatus } from './backlog.store';

@Component({
  selector: 'app-backlog-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './backlog.page.html',
  styleUrls: ['./backlog.page.css'],
})
export class BacklogPage {
  private fb = inject(FormBuilder);
  private store = inject(BacklogStore);

  // Form usado no (ngSubmit)="submit()"
  form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(2)]],
    platform: [''],
    img: [''], 
    priority: ['media' as 'alta' | 'media' | 'baixa'],
    status: ['pendente' as BacklogStatus],
    notes: [''],
  });

  /** Chamado pelo template: {{ total() }} */
  total(): number {
    return this.store.total();
  }

  /** Chamado pelo template: *ngFor="let it of items()" */
  items() {
    return this.store.sorted();
  }

  /** Chamado pelo (ngSubmit)="submit()" do formulário */
  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { title, platform, priority, status, notes, img } = this.form.getRawValue();

    this.store.add({
      title: title.trim(),
      platform: platform?.trim() || undefined,
      priority: priority || undefined,
      status,
      img: img?.trim() || '', 
      notes: notes?.trim() || undefined,
    });

    // limpa o form 
    this.form.reset({
      title: '',
      platform: '',
      img: '',
      priority: 'media',
      status: 'pendente',
      notes: '',
    });
  }

  setStatus(id: number, status: BacklogStatus): void {
    this.store.update(id, { status });
  }

  remove(id: number): void {
    this.store.remove(id);
  }

  clear(): void {
    this.store.clear();
  }
}
