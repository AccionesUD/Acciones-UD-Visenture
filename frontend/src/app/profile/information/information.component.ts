import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { ProfileService } from '../../services/profile.service';
import { ProfileNavigationService } from '../../services/profile-navigation.service';
import { User, UpdateProfileDto } from '../../models/user.model';

@Component({
  selector: 'app-information',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    RouterModule
  ],
  templateUrl: './information.component.html',
  styleUrl: './information.component.css'
})
export class InformationComponent implements OnInit {
  profileForm: FormGroup;
  isEditing = false;
  isLoading = true;
  isSaving = false;
  profileData: User | null = null;
  formSubmitted = false;
  saveError: string | null = null;

  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService,
    private navigationService: ProfileNavigationService,
    private snackBar: MatSnackBar
  ) {
    this.profileForm = this.fb.group({
      first_name: [{value: '', disabled: true}],
      last_name: [{value: '', disabled: true}],
      identity_document: [{value: '', disabled: true}],
      email: [{value: '', disabled: true}, [Validators.required, Validators.email]],
      phone_number: [{value: '', disabled: true}, [Validators.required, Validators.pattern('^[+]?[0-9 ]{10,15}$')]],
      birthdate: [{value: '', disabled: true}]
    });
  }

  ngOnInit(): void {
    this.loadProfileData();
  }

  loadProfileData(): void {
    this.isLoading = true;
    this.formSubmitted = false;
    this.saveError = null;
    
    // Usamos el servicio para obtener los datos del perfil
    this.profileService.getUserProfile().subscribe({
      next: (data) => {
        // Guardamos los datos y actualizamos el formulario
        this.profileData = data;
        this.updateFormValues(data);
        this.isLoading = false;
        
        // Aseguramos que los campos editables estén deshabilitados inicialmente
        this.profileForm.get('email')?.disable();
        this.profileForm.get('phone_number')?.disable();
      },
      error: (err) => {
        console.error('Error al cargar datos del perfil:', err);
        this.isLoading = false;
        
        // Mostramos mensaje de error
        this.snackBar.open('Error al cargar los datos del perfil', 'Reintentar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        }).onAction().subscribe(() => {
          // Si el usuario hace clic en "Reintentar"
          this.loadProfileData();
        });
      }
    });
  }

  updateFormValues(data: User): void {
    this.profileForm.patchValue({
      first_name: data.first_name,
      last_name: data.last_name,
      identity_document: data.identity_document || 'No disponible',
      email: data.email,
      phone_number: data.phone_number,
      birthdate: data.birthdate ? new Date(data.birthdate).toLocaleDateString() : 'No disponible'
    });
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    this.formSubmitted = false;
    
    if (this.isEditing) {
      // Habilitar campos editables
      this.profileForm.get('email')?.enable();
      this.profileForm.get('phone_number')?.enable();
      
      // Aplicar focus al primer campo editable
      setTimeout(() => {
        const emailInput = document.getElementById('email-input');
        if (emailInput) {
          emailInput.focus();
        }
      }, 100);
    } else {
      // Deshabilitar campos y restaurar valores originales
      this.profileForm.get('email')?.disable();
      this.profileForm.get('phone_number')?.disable();
      
      if (this.profileData) {
        this.updateFormValues(this.profileData);
      }
    }
  }

  saveChanges(): void {
    this.formSubmitted = true;
    this.saveError = null;
    
    // Validamos el formulario
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      // Mostrar un mensaje de error específico
      this.snackBar.open('Por favor, complete correctamente todos los campos requeridos', 'Cerrar', {
        duration: 4000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    // Verificar si hubo cambios reales en los valores editables
    if (this.profileData &&
        this.profileData.email === this.profileForm.get('email')?.value &&
        this.profileData.phone_number === this.profileForm.get('phone_number')?.value) {
      
      // No hay cambios, solo cerramos el modo edición
      this.snackBar.open('No se detectaron cambios en el perfil', 'Cerrar', {
        duration: 3000
      });
      
      this.isEditing = false;
      this.formSubmitted = false;
      this.profileForm.get('email')?.disable();
      this.profileForm.get('phone_number')?.disable();
      return;
    }
    
    // Mostrar indicador de carga
    this.isSaving = true;
    
    // Preparamos solo los datos que necesitamos actualizar
    const updatedData: UpdateProfileDto = {
      email: this.profileForm.get('email')?.value,
      phone_number: this.profileForm.get('phone_number')?.value
    };

    // Guardamos los cambios mediante el servicio
    this.profileService.updateProfile(updatedData).subscribe({
      next: (response) => {
        this.isSaving = false;
        
        if (response.success) {
          // Éxito al actualizar
          this.snackBar.open('Perfil actualizado correctamente', 'Cerrar', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          
          // Actualizamos el estado del componente
          this.isEditing = false;
          this.formSubmitted = false;
          
          // Deshabilitar los campos editables
          this.profileForm.get('email')?.disable();
          this.profileForm.get('phone_number')?.disable();
          
          // Actualizar datos locales con la respuesta del servidor
          if (response.data) {
            this.profileData = response.data;
          } else if (this.profileData) {
            // Si no hay datos en la respuesta, actualizamos manualmente
            this.profileData = {
              ...this.profileData,
              ...updatedData
            };
          }
        } else {
          // Error al actualizar (según la API)
          this.saveError = response.message || 'Error al actualizar perfil';
          this.snackBar.open(this.saveError, 'Cerrar', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      },
      error: (err) => {
        // Error de comunicación o inesperado
        this.isSaving = false;
        this.saveError = 'Error al comunicarse con el servidor';
        console.error('Error al actualizar perfil:', err);
        this.snackBar.open(this.saveError, 'Cerrar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  getEmailErrorMessage(): string {
    const emailControl = this.profileForm.get('email');
    if (emailControl?.hasError('required')) {
      return 'El correo electrónico es requerido';
    }
    return emailControl?.hasError('email') ? 'Introduzca un correo electrónico válido' : '';
  }

  getPhoneErrorMessage(): string {
    const phoneControl = this.profileForm.get('phone_number');
    if (phoneControl?.hasError('required')) {
      return 'El número de teléfono es requerido';
    }
    return phoneControl?.hasError('pattern') ? 'Introduzca un número de teléfono válido' : '';
  }
  
  // Método para navegar a la pestaña de seguridad
  goToSecurity(): void {
    // Asegurémonos de usar el mismo nombre de pestaña que en profile.component.html
    this.navigationService.setActiveTab('security');
  }
}
