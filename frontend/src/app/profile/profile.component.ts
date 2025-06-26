import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProfileService } from '../services/profile.service';
import { ProfileNavigationService } from '../services/profile-navigation.service';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Subscription } from 'rxjs';

// Importamos todos los componentes de las subsecciones
import { InformationComponent } from './information/information.component';
import { PreferencesComponent } from './preferences/preferences.component';
import { SecurityComponent } from './security/security.component';
import { SuscriptionComponent } from './suscription/suscription.component';
import { MiddlemanComponent } from './middleman/middleman.component';
import { HistoricalComponent } from './historical/historical.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTabsModule,
    MatIconModule,
    MatButtonModule,
    InformationComponent,
    PreferencesComponent,
    SecurityComponent,
    SuscriptionComponent,
    MiddlemanComponent,
    HistoricalComponent
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit, OnDestroy {
  activeTab = 'information';
  userName: string = '';
  private subscription: Subscription = new Subscription();

  constructor(
    private profileService: ProfileService,
    private navigationService: ProfileNavigationService
  ) {}

  ngOnInit(): void {
    this.loadUserInfo();
    
    // Suscribirse a los cambios de navegación
    this.subscription.add(
      this.navigationService.activeTab$.subscribe(tab => {
        this.activeTab = tab;
      })
    );
  }

  ngOnDestroy(): void {
    // Limpiar suscripciones para evitar fugas de memoria
    this.subscription.unsubscribe();
  }

  loadUserInfo(): void {
    this.profileService.getUserProfileInfo().subscribe(
      userInfo => {
        this.userName = userInfo.name || 'Usuario';
      }
    );
  }

  setActiveTab(tabName: string): void {
    this.navigationService.setActiveTab(tabName);
  }
}
