import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

function initializeApp() {
  bootstrapApplication(AppComponent, appConfig)
    .catch((err) => {
      console.error('Error durante el arranque de la aplicación:', err);
    });
}

initializeApp();
