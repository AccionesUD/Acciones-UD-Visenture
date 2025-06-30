import { FormGroup, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

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

/**
 * Validador mejorado de teléfono que soporta múltiples formatos internacionales
 * Acepta:
 * - Formato con código de país: +1 234 567 890, +34 612345678
 * - Formato sin código pero con espacios/guiones: 612-345-678, 612 345 678
 * - Formato simple: 612345678
 */
export function phoneNumberValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null; // No validar si está vacío (usar required para ese caso)
    }

    // Normalizar el número (eliminar espacios, guiones, paréntesis)
    const phoneValue = control.value.replace(/[\s\-\(\)]/g, '');
    
    // Validar formato internacional con código de país
    const intlPhonePattern = /^\+[0-9]{1,4}[0-9]{6,14}$/;
    
    // Validar formato nacional (sin código)
    const nationalPhonePattern = /^[0-9]{6,14}$/;
    
    const isValidFormat = intlPhonePattern.test(phoneValue) || nationalPhonePattern.test(phoneValue);
    
    return isValidFormat ? null : { phoneFormat: { value: control.value } };
  };
}

/**
 * Validador para documentos de identidad
 * Personalizable para diferentes formatos según el país
 * Por defecto acepta formatos comunes como:
 * - DNI español: 12345678A
 * - NIF/CIF: A12345678
 * - Pasaportes: ABC123456
 * - SSN: 123-45-6789
 */
export function idDocumentValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    // Eliminar espacios y guiones para normalización
    const idValue = control.value.replace(/[\s\-]/g, '');
    
    // Validar formatos comunes:
    // DNI español: 8 números + 1 letra
    const dniPattern = /^[0-9]{8}[a-zA-Z]$/;
    
    // Pasaporte internacional: combinación de letras y números
    const passportPattern = /^[a-zA-Z0-9]{6,12}$/;
    
    // Formato genérico de ID: letras y números en combinación, longitud razonable
    const genericIdPattern = /^[a-zA-Z0-9]{5,20}$/;
    
    const isValidFormat = dniPattern.test(idValue) || 
                        passportPattern.test(idValue) || 
                        genericIdPattern.test(idValue);
    
    return isValidFormat ? null : { idFormat: { value: control.value } };
  };
}

/**
 * Validador para valores numéricos con opciones personalizables
 */
export function numericValueValidator(options: {
  allowDecimals?: boolean, 
  allowNegative?: boolean,
  min?: number,
  max?: number
} = {}): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    // Si es un string, convertir a número para validaciones
    const numValue = typeof control.value === 'string' 
      ? parseFloat(control.value.replace(',', '.'))
      : control.value;

    // Verificar si es un número válido
    if (isNaN(numValue)) {
      return { notNumeric: true };
    }

    // Verificar si permite decimales
    if (options.allowDecimals === false && !Number.isInteger(numValue)) {
      return { notInteger: true };
    }

    // Verificar si permite negativos
    if (options.allowNegative === false && numValue < 0) {
      return { negative: true };
    }

    // Verificar mínimo
    if (options.min !== undefined && numValue < options.min) {
      return { min: { required: options.min, actual: numValue } };
    }

    // Verificar máximo
    if (options.max !== undefined && numValue > options.max) {
      return { max: { required: options.max, actual: numValue } };
    }

    return null;
  };
}

/**
 * Obtiene un mensaje de error para un tipo de error de validación de formulario
 */
export function getValidationErrorMessage(errorType: string, fieldName: string): string {
  const errorMessages: { [key: string]: string } = {
    required: `El campo ${fieldName} es obligatorio`,
    email: 'Por favor, introduce un correo electrónico válido',
    minlength: `El campo ${fieldName} es demasiado corto`,
    maxlength: `El campo ${fieldName} es demasiado largo`,
    pattern: `El formato del campo ${fieldName} no es válido`,
    mustMatch: 'Los campos deben coincidir',
    phoneFormat: 'Introduce un número de teléfono válido (ej: +34 612345678)',
    idFormat: 'Formato de documento de identidad no válido',
    notNumeric: 'Debe ser un valor numérico',
    notInteger: 'Debe ser un número entero',
    negative: 'No se permiten valores negativos',
    min: 'El valor es menor al mínimo permitido',
    max: 'El valor es mayor al máximo permitido'
  };

  return errorMessages[errorType] || 'Campo no válido';
}