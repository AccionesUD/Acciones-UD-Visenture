import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-success-forgot-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, RouterLink],
  template: `
    <div class="bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 p-8 rounded-xl text-center max-w-sm mx-auto">
      <div class="flex justify-center mb-5">
        <div class="bg-emerald-100 dark:bg-emerald-900/30 rounded-full p-3">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>
      <h2 class="text-xl font-bold mb-2" i18n="@@forgotPassword.success.title">¡Correo enviado!</h2>
      <p class="mb-6" i18n="@@forgotPassword.success.message">Revisa tu bandeja y sigue las instrucciones para restablecer tu contraseña.</p>      <div class="mt-4 flex flex-col space-y-3">
        <a routerLink="/test-reset-password" (click)="dialogRef.close()" 
           class="inline-block w-full py-3 px-6 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 transition">
          <ng-container i18n="@@resetPassword.button">Restablecer contraseña</ng-container>
        </a>
        <a routerLink="/login" (click)="dialogRef.close()" 
           class="inline-block w-full py-2 px-6 border border-emerald-500 text-emerald-600 dark:text-emerald-400 dark:border-emerald-500 rounded-lg hover:bg-emerald-50 dark:hover:bg-slate-700 transition text-center">
          <ng-container i18n="@@forgotPassword.returnToLogin">Volver a iniciar sesión</ng-container>
        </a>
      </div>
    </div>
  `
})
export class SuccessForgotDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<SuccessForgotDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}
}
