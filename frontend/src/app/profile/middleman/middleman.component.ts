import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { UsersService } from '../../services/user.service';
import { User } from '../../models/user.model';
import { HireCommissionerModalComponent } from '../../shared/modals/hire-commissioner-modal/hire-commissioner-modal.component';

@Component({
  selector: 'app-middleman',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatCardModule
  ],
  templateUrl: './middleman.component.html',
  styleUrls: ['./middleman.component.css']
})
export class MiddlemanComponent implements OnInit {
  
  displayedColumns: string[] = ['name', 'email', 'actions'];
  dataSource = new MatTableDataSource<any>([]);
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  isLoading = true;
  error: string | null = null;

  constructor(
    private usersService: UsersService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadCommissioners();
  }

  loadCommissioners(): void {
    this.isLoading = true;
    this.usersService.getUsersFromAccounts().subscribe({
      next: (users: User[]) => {
        // Filtramos para quedarnos solo con los comisionistas
        const commissioners = users.filter(user => user.roles && user.roles.includes('comisionista'));
        this.dataSource.data = commissioners.map(c => ({
          ...c,
          name: `${c.first_name} ${c.last_name}`
        }));
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'No se pudo cargar la lista de comisionistas.';
        this.isLoading = false;
        console.error(err);
      }
    });
  }

  openHireModal(commissioner: any): void {
    const dialogRef = this.dialog.open(HireCommissionerModalComponent, {
      width: '500px',
      data: { commissioner }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Lógica futura si se confirma la contratación
      }
    });
  }
}