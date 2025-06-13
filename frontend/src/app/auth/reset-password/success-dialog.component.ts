import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-success-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, RouterLink],
  template: `
    <div class="bg-white dark:bg-slate-800 text-gray-900 dark:text-white p-8 rounded-xl text-center">
      <div class="flex justify-center mb-5">
        <div class="bg-emerald-100 dark:bg-emerald-900/30 rounded-full p-3">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>
      <h2 class="text-xl font-bold mb-2 text-gray-900 dark:text-white">¡Contraseña actualizada!</h2>
      <p class="mb-6 text-gray-600 dark:text-gray-300">Tu contraseña ha sido restablecida exitosamente.</p>
      <div class="mt-4">
        <a routerLink="/login" (click)="closeDialog()" class="w-full inline-block py-3 px-6 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white font-medium rounded-lg transition duration-200">
          Iniciar sesión
        </a>
      </div>
    </div>
  `,
  styles: []
})
export class SuccessDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<SuccessDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  closeDialog(): void {
    this.dialogRef.close();
  }
}
