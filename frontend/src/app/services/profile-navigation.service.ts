import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProfileNavigationService {
  // Subject para compartir el tab activo entre componentes
  private activeTabSubject = new BehaviorSubject<string>('information');
  activeTab$ = this.activeTabSubject.asObservable();
  
  constructor() { }
  
  // Método para establecer la pestaña activa
  setActiveTab(tabName: string): void {
    this.activeTabSubject.next(tabName);
  }
}
