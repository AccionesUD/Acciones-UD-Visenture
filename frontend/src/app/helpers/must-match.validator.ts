import { FormGroup } from '@angular/forms';

// Función validadora para asegurar que dos campos coinciden (útil para validación de contraseñas)
export function MustMatch(controlName: string, matchingControlName: string) {
  return (formGroup: FormGroup) => {
    const control = formGroup.controls[controlName];
    const matchingControl = formGroup.controls[matchingControlName];

    if (!matchingControl) {
      return;
    }

    if (matchingControl.errors && !matchingControl.errors['mustMatch']) {
      return;
    }
    
    if (control.value !== matchingControl.value) {
      matchingControl.setErrors({ mustMatch: true });
    } else {
      matchingControl.setErrors(null);
    }
  };
}

// Alias para compatibilidad con código existente
export function mustMatch(controlName: string, matchingControlName: string) {
  return MustMatch(controlName, matchingControlName);
}