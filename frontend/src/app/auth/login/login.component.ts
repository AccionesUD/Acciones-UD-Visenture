import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../auth.service';

// Validador personalizado para el token MFA
function mfaTokenValidator(control: AbstractControl): ValidationErrors | null {
  const token = control.value;
  if (!token) return null;
  
  // Verificar que sea exactamente 6 caracteres alfanuméricos (letras mayúsculas y números)
  const isValid = /^[0-9A-Z]{6}$/.test(token);
  
  return isValid ? null : { invalidMfaToken: true };
}

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule]
})

export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  tokenForm!: FormGroup;
  loginStage: 'credentials' | 'token' = 'credentials';
  isLoading = false;
  isResendingToken = false;
  errorMessage: string | null = null;
  userEmailForToken: string | null = null;
  tokenResendMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {}
  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]], 
      password: ['', [Validators.required, Validators.minLength(6)]]
    });    this.tokenForm = this.fb.group({
      token: ['', [
        Validators.required, 
        Validators.minLength(6), 
        Validators.maxLength(6),
        Validators.pattern('^[0-9A-Z]{6}$'), // Acepta números y letras mayúsculas
        mfaTokenValidator // Validador personalizado
      ]]
    });
  }

  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }
  get token() { return this.tokenForm.get('token'); }  submitCredentials(): void {
    this.errorMessage = null;
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched(); 
      return;
    }

    this.isLoading = true;
    const { email, password } = this.loginForm.value;
    console.log('Enviando credenciales:', { email, password });this.authService.login({ email, password }).subscribe({
      next: (response) => {
        console.log('Backend respondió:', response);
        if (response.requireMfa) {
          this.userEmailForToken = email;
          this.loginStage = 'token';
          this.isLoading = false;
          this.tokenResendMessage = null;
        } else {
          // Si no se requiere MFA (caso raro en nuestra app que siempre lo requiere)
          this.router.navigate(['/dashboard']);
          this.isLoading = false;
        }
      },      error: (err) => {
        console.error('Error en solicitud de autenticación:', err);
        this.errorMessage = 'Correo electrónico o contraseña incorrectos.';
        this.isLoading = false;
      }
    });
  }

  submitToken(): void {
    this.errorMessage = null;
    if (this.tokenForm.invalid) {
      this.tokenForm.markAllAsTouched();
      return;
    }      this.isLoading = true;
    // Extraemos el token y nos aseguramos de que sea un string
    const token = String(this.tokenForm.get('token')?.value);
    console.log('Enviando token:', token);

    if (!this.userEmailForToken) {
      this.errorMessage = 'Error de sesión. Por favor, inicia sesión nuevamente.';
      this.isLoading = false;
      this.loginStage = 'credentials';
      return;
    }
        console.log('Datos para verificación MFA:', {token, email: this.userEmailForToken});
    this.authService.verifyMfa({token, email: this.userEmailForToken}).subscribe({
      next: (response) => {
        console.log('Login exitoso!', response);
        this.router.navigate(['/dashboard']);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al verificar token:', err);        this.errorMessage = 'Token incorrecto. Intente de nuevo.';
        this.isLoading = false;
      }
    });
  }

  resendToken(): void {
    if (!this.userEmailForToken) return;

    this.isResendingToken = true;
    this.errorMessage = null;
    this.tokenResendMessage = null;
    console.log('Solicitando reenvío de token para:', this.userEmailForToken);

    this.authService.resendToken(this.userEmailForToken).subscribe({
      next: (response) => {
        console.log('Solicitud de reenvío de token exitosa.', response);
        this.tokenResendMessage = 'Se ha enviado un nuevo código a tu correo.';
        this.isResendingToken = false;
      },
      error: (err) => {
        console.error('Error al reenviar token:', err);
        this.errorMessage = 'No se pudo reenviar el código. Intenta más tarde.';
        this.isResendingToken = false;
      }
    });
  }
  
  backToCredentials(): void {
    this.loginStage = 'credentials';
    this.errorMessage = null;
    this.tokenResendMessage = null;
    this.tokenForm.reset();
  }
}