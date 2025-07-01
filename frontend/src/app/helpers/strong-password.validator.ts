import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

// Validador de contraseña fuerte: al menos una mayúscula, un número y un carácter especial
export function strongPasswordValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value: string = control.value || '';
    if (!value) return null;
    const hasUpperCase = /[A-Z]/.test(value);
    const hasNumber = /[0-9]/.test(value);
    const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?]+/.test(value);
    const valid = hasUpperCase && hasNumber && hasSpecialChar;
    return !valid ? { strongPassword: true } : null;
  };
}
