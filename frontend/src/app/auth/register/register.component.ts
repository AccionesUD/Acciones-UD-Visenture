import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { mustMatch } from '../../helpers/must-match.validator'; // Validador personalizado
import { AuthService } from '../../services/auth.service'; // Asegúrate de que la ruta es correcta

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  imports: [CommonModule , ReactiveFormsModule,RouterModule]
})
export class RegisterComponent {
  registerForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      address: ['', [Validators.maxLength(80)]], // Opcional según el backend
      birthDate: ['', [Validators.required, this.validateAdultAge]],
      identification: ['', [Validators.required, Validators.pattern(/^\d{6,10}$/)]], // Según requisito del backend
      phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],  // Formato para Colombia
      email: ['', [Validators.required, Validators.email, Validators.maxLength(30)]], // Restricción de longitud
      password: ['', [Validators.required, Validators.maxLength(50), this.createStrongPasswordValidator()]],
      confirmPassword: ['', Validators.required]
    }, {
      validator: mustMatch('password', 'confirmPassword') // Validador personalizado
    });
  }

  // Validador para verificar que sea mayor de edad (18 años)
  validateAdultAge(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null; // Dejar que se encargue el validador required
    }
    
    const birthDate = new Date(control.value);
    if (isNaN(birthDate.getTime())) {
      return { invalidDate: true };
    }
    
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age < 18 ? { underAge: true } : null;
  }

  // Validador de contraseña fuerte para cumplir con los requisitos del backend
  createStrongPasswordValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      const value: string = control.value || '';
      
      // Validamos que tenga al menos: una mayúscula, un número y un carácter especial
      const hasUpperCase = /[A-Z]/.test(value);
      const hasNumber = /[0-9]/.test(value);
      const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(value);
      
      const valid = hasUpperCase && hasNumber && hasSpecialChar;
      
      return !valid ? { strongPassword: true } : null;
    };
  }

  // Getters para acceder fácil a los controles
  get name() { return this.registerForm.get('name'); }
  get address() { return this.registerForm.get('address'); }
  get birthDate() { return this.registerForm.get('birthDate'); }
  get identification() { return this.registerForm.get('identification'); }
  get phone() { return this.registerForm.get('phone'); }
  get email() { return this.registerForm.get('email'); }
  get password() { return this.registerForm.get('password'); }
  get confirmPassword() { return this.registerForm.get('confirmPassword'); }
  
  onSubmit() {
    if (this.registerForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';

    // Dividir el nombre completo de manera más segura
    const nombreCompleto = this.registerForm.value.name || '';
    let firstName = nombreCompleto;
    let lastName = '';
    
    if (nombreCompleto.includes(' ')) {
      const partes = nombreCompleto.split(' ');
      // Asegurarnos que nombre y apellido tengan al menos 3 caracteres
      if (partes[0].length >= 3) {
        firstName = partes[0];
        lastName = partes.slice(1).join(' ');
        
        // Si el apellido es muy corto, ajustarlo
        if (lastName.length < 3) {
          firstName = nombreCompleto;
          lastName = 'Apellido'; // Usamos un valor por defecto
        }
      } else {
        // Si el primer nombre es muy corto, usamos todo como primer nombre
        firstName = nombreCompleto;
        lastName = 'Apellido'; // Usamos un valor por defecto
      }
    } else {
      // Si no hay espacios, asumimos que solo se ingresó el nombre
      firstName = nombreCompleto;
      lastName = 'Apellido'; // Usamos un valor por defecto
    }

    // Formatear fecha como string ISO
    const birthDate = new Date(this.registerForm.value.birthDate);
    const formattedBirthDate = birthDate.toISOString().split('T')[0];


    // Validar formato de teléfono para Colombia (10 dígitos)
    let formattedPhone = this.registerForm.value.phone || '';
    if (!formattedPhone.startsWith('+57')) {
      formattedPhone = `+57${formattedPhone}`;
    }

    // Formato correcto para el backend siguiendo la estructura de CreateUserDto
    const userData = {
      identity_document: this.registerForm.value.identification,
      first_name: firstName,
      last_name: lastName,
      birthdate: formattedBirthDate,
      address: this.registerForm.value.address || '',
      phone: formattedPhone,
      account: {
        email: this.registerForm.value.email,
        password: this.registerForm.value.password
      }
    };

    console.log('Datos de registro enviados:', userData);

    // Enviar al backend
    this.authService.register(userData).subscribe({
      next: (response) => {
        this.isLoading = false;
        console.log('Registro exitoso:', response);
        this.router.navigate(['/login']); // Redirigir tras registro exitoso
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error detallado del registro:', err);
        if (err.error && Array.isArray(err.error.message)) {
          // Si el error contiene un array de mensajes, mostramos el primero
          this.errorMessage = err.error.message[0];
        } else {
          this.errorMessage = err.error?.message || 'Error en el registro. Verifica los datos ingresados.';
        }
      }
    });
  }
}
