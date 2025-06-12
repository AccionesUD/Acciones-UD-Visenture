import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProfileService } from '../services/profile.service';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

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
})
export class ProfileComponent implements OnInit {
  activeTab = 'information';
  userName: string = '';

  constructor(private profileService: ProfileService) {}

  ngOnInit(): void {
    this.loadUserInfo();
  }

  loadUserInfo(): void {
    this.profileService.getUserProfileInfo().subscribe(
      userInfo => {
        this.userName = userInfo.name || 'Usuario';
      }
    );
  }

  setActiveTab(tabName: string): void {
    this.activeTab = tabName;
  }
}
