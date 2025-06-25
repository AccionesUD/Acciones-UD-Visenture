import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuditAlert } from '../../models/audit.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface AssignAlertDialogData {
  alert: AuditAlert;
}

@Component({
  selector: 'app-assign-alert-dialog',
  templateUrl: './assign-alert-dialog.component.html',
  styleUrls: ['./assign-alert-dialog.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule
  ]
})
export class AssignAlertDialogComponent implements OnInit {
  assignForm: FormGroup;
  alert: AuditAlert;
  users: User[] = [];
  loading = false;

  constructor(
    public dialogRef: MatDialogRef<AssignAlertDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AssignAlertDialogData,
    private fb: FormBuilder,
    private http: HttpClient
  ) {
    this.alert = data.alert;
    this.assignForm = this.fb.group({
      userId: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    // En un entorno de producción, se usaría un servicio específico para usuarios
    // Para desarrollo, usaremos datos simulados
    setTimeout(() => {
      this.users = [
        { id: 1, name: 'Administrador Sistema', email: 'admin@system.com', role: 'ADMIN' },
        { id: 2, name: 'Auditor Principal', email: 'auditor@system.com', role: 'AUDITOR' },
        { id: 3, name: 'Oficial Cumplimiento', email: 'compliance@system.com', role: 'COMPLIANCE' }
      ];
      this.loading = false;
    }, 500);

    // Implementación real comentada
    /*
    this.http.get<User[]>(`${environment.apiUrl}/users?role=COMPLIANCE,AUDITOR,ADMIN`)
      .subscribe({
        next: (users) => {
          this.users = users;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
    */
  }

  onSubmit(): void {
    if (this.assignForm.valid) {
      this.dialogRef.close({
        alertId: this.alert.id,
        userId: this.assignForm.value.userId
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
