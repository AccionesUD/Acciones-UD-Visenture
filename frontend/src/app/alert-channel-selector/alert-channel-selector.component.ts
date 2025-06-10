import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-alert-channel-selector',
  imports: [FormsModule, CommonModule],
  templateUrl: './alert-channel-selector.component.html',
  styleUrl: './alert-channel-selector.component.css'
})
export class AlertChannelSelectorComponent {
saved = false;

  channels = [
    { id: 'email', label: 'Correo Electrónico', enabled: true },
    { id: 'sms', label: 'SMS', enabled: false },
    { id: 'whatsapp', label: 'WhatsApp', enabled: false }
  ];

  onSubmit(): void {
    const selected = this.channels.filter(c => c.enabled).map(c => c.id);
    
    // Simular guardado de configuración
    console.log('Canales seleccionados:', selected);

    // Aquí iría lógica para guardar en base de datos o backend
    localStorage.setItem('alert-preferences', JSON.stringify(selected));

    this.saved = true;
    setTimeout(() => this.saved = false, 3000); // Ocultar mensaje después de 3s
  }
}
