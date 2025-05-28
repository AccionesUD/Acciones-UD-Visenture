import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

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
    
    try {
      this.authService.login({ email, password }).subscribe({
        next: (response) => {
          console.log('Backend respondió:', response);
          // En nuestro backend, siempre se requiere MFA
          this.userEmailForToken = email;
          this.loginStage = 'token';
          this.isLoading = false;
          this.tokenResendMessage = null;
          
          // Limpiar el formulario de token por si hubiera un valor anterior
          this.tokenForm.reset();
        },
        error: (err) => {
          console.error('Error en solicitud de autenticación:', err);
          // Obtener mensaje de error del backend si está disponible
          this.errorMessage = err.error?.message || err.message || 'Correo electrónico o contraseña incorrectos.';
          this.isLoading = false;
        }
      });
    } catch (error: any) {
      console.error('Error inesperado al iniciar sesión:', error);
      this.errorMessage = error?.message || 'Error inesperado al iniciar sesión.';
      this.isLoading = false;
    }
  }  submitToken(): void {
    this.errorMessage = null;
    if (this.tokenForm.invalid) {
      this.tokenForm.markAllAsTouched();
      return;
    }      
    
    this.isLoading = true;
    // Extraemos el token y nos aseguramos de que sea un string y en mayúsculas
    const token = String(this.tokenForm.get('token')?.value).toUpperCase();
    
    // Si hubo cambios, actualizamos el valor en el formulario
    if (token !== this.tokenForm.get('token')?.value) {
      this.tokenForm.get('token')?.setValue(token, { emitEvent: false });
    }
    
    console.log('Enviando token:', token);

    if (!this.userEmailForToken) {
      this.errorMessage = 'Error de sesión. Por favor, inicia sesión nuevamente.';
      this.isLoading = false;
      this.loginStage = 'credentials';
      return;
    }
    
    // Verificamos nuevamente el formato del token antes de enviarlo
    const tokenRegex = /^[0-9A-Z]{6}$/;
    if (!tokenRegex.test(token)) {
      this.errorMessage = 'El código debe ser de 6 caracteres (números o letras mayúsculas).';
      this.isLoading = false;
      return;
    }
    
    console.log('Datos para verificación MFA:', {token, email: this.userEmailForToken});
    
    try {
      this.authService.verifyMfa({token, email: this.userEmailForToken}).subscribe({
        next: (response) => {
          console.log('Login exitoso!', response);
          this.router.navigate(['/dashboard']);
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error al verificar token:', err);
          // Obtener mensaje de error del backend si está disponible
          this.errorMessage = err.error?.message || err.message || 'Token incorrecto. Intente de nuevo.';
          this.isLoading = false;
        }
      });
    } catch (error: any) {
      console.error('Error inesperado al verificar token:', error);
      this.errorMessage = error?.message || 'Error inesperado al verificar el código.';
      this.isLoading = false;
    }
  }  resendToken(): void {
    if (!this.userEmailForToken) return;

    this.isResendingToken = true;
    this.errorMessage = null;
    this.tokenResendMessage = null;
    console.log('Solicitando reenvío de token para:', this.userEmailForToken);

    this.authService.resendToken(this.userEmailForToken).subscribe({
      next: (response) => {
        console.log('Respuesta de reenvío de token:', response);
        this.isResendingToken = false;
        
        if (response.success) {
          this.tokenResendMessage = 'Se ha enviado un nuevo código a tu correo.';
        } else {
          this.errorMessage = response.message || 'No se pudo reenviar el código. Intenta más tarde.';
        }
      },
      error: (err) => {
        console.error('Error al reenviar token:', err);
        this.isResendingToken = false;
        this.errorMessage = err.error?.message || 'No se pudo reenviar el código. Intenta más tarde.';
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