import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { mustMatch } from '../../helpers/must-match.validator'; // Validador personalizado

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
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, {
      validator: mustMatch('password', 'confirmPassword') // Validador personalizado
    });
  }

  // Getters para acceder fácil a los controles
  get name() { return this.registerForm.get('name'); }
  get email() { return this.registerForm.get('email'); }
  get password() { return this.registerForm.get('password'); }
  get confirmPassword() { return this.registerForm.get('confirmPassword'); }

  onSubmit() {
    if (this.registerForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';

    // Simulación de registro (reemplazar con llamada HTTP real)
    setTimeout(() => {
      console.log('Datos de registro:', this.registerForm.value);
      this.isLoading = false;
      this.router.navigate(['/login']); // Redirigir tras registro
    }, 1500);
  }
}