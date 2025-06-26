import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { CommissionerService } from '../../../services/commissioner.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

export interface OrderTypeSelectionData {
  shareSymbol: string;
  orderType: 'buy' | 'sell';
}

@Component({
  selector: 'app-order-type-selection-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatRadioModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './order-type-selection-dialog.component.html',
  styleUrls: ['./order-type-selection-dialog.component.css']
})
export class OrderTypeSelectionDialogComponent implements OnInit {
  orderFor: 'self' | 'client' = 'self';
  clients: any[] = [];
  selectedClientId: number | null = null;
  isLoadingClients = false;

  constructor(
    public dialogRef: MatDialogRef<OrderTypeSelectionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: OrderTypeSelectionData,
    private commissionerService: CommissionerService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    // No se cargan los clientes al inicio
  }

  onOrderForChange(): void {
    if (this.orderFor === 'client' && this.clients.length === 0) {
      this.loadClients();
    }
  }

  loadClients(): void {
    this.isLoadingClients = true;
    this.commissionerService.getAssignedClientsForOrderSelection().subscribe({
      next: (clients) => {
        this.clients = clients;
        this.isLoadingClients = false;
        
        if (clients.length === 0) {
          this.snackBar.open('No tienes clientes asignados actualmente', 'Cerrar', {
            duration: 3000
          });
        }
      },
      error: (error) => {
        console.error('Error al cargar los clientes:', error);
        this.isLoadingClients = false;
        this.snackBar.open('Error al cargar la lista de clientes', 'Cerrar', {
          duration: 3000
        });
      }
    });
  }

  onConfirm(): void {
    if (this.orderFor === 'self') {
      this.dialogRef.close({ orderFor: 'self' });
    } else {
      if (this.selectedClientId) {
        this.dialogRef.close({ orderFor: 'client', clientId: this.selectedClientId });
      } else {
        // Opcional: mostrar error si no se selecciona cliente
      }
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
