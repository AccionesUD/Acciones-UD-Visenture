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
  styleUrls: ['./register.component.css'],
  imports: [CommonModule , ReactiveFormsModule,RouterModule]
})
export class RegisterComponent {
  registerForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService // Asegúrate de que la ruta es correcta
  ) {
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      address: ['', Validators.required],
      birthDate: ['', Validators.required],
      identification: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(8)]],
      phone: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(10)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, {
      validator: mustMatch('password', 'confirmPassword') // Validador personalizado
    });
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

    // Preparar los datos para el backend
    const userData = {
      nombre: this.registerForm.value.name,
      identificacion: this.registerForm.value.identification,
      fechaNacimiento: this.registerForm.value.birthDate,
      telefono: this.registerForm.value.phone,
      email: this.registerForm.value.email,
      password: this.registerForm.value.password
    };

    // Enviar al backend
    this.authService.register(userData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.router.navigate(['/login']); // Redirigir tras registro exitoso
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Error en el registro';
      }
    });
  }
}
