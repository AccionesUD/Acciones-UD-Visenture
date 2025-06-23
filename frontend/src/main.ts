/// <reference types="@angular/localize" />
import '@angular/localize/init';

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { TRANSLATIONS, TRANSLATIONS_FORMAT } from '@angular/core';

/**
 * Detecta el idioma preferido del usuario desde localStorage o el navegador.
 * @returns El código del idioma (ej. 'es', 'en').
 */
function getLanguage(): string {
  if (typeof window === 'undefined') {
    return 'es'; // Default para SSR o entornos sin window
  }

  const savedLang = window.localStorage.getItem('preferred-language');
  if (savedLang && ['es', 'en', 'fr', 'ru'].includes(savedLang)) {
    console.log(`🔄 Using saved language: ${savedLang}`);
    return savedLang;
  }

  const browserLang = navigator.language.split('-')[0];
  if (['es', 'en', 'fr', 'ru'].includes(browserLang)) {
    console.log(`🔄 Using browser language: ${browserLang}`);
    return browserLang;
  }

  console.log('🔄 Using default language: es');
  return 'es';
}

// --- El nuevo corazón del sistema ---

// 1. Obtener el idioma actual
const language = getLanguage();

// 2. Exponer una función global simple para cambiar de idioma
if (typeof window !== 'undefined') {
  (window as any).changeAppLanguage = (newLang: string) => {
    if (['es', 'en', 'fr', 'ru'].includes(newLang)) {
      localStorage.setItem('preferred-language', newLang);
      window.location.reload();
    }
  };
  // También exponemos el idioma actual para que los componentes puedan leerlo si es necesario
  (window as any).currentAppLanguage = language;
}


// 3. Si el idioma no es el base (español), cargar el archivo de traducción
if (language === 'es') {
  // Si es español, arrancar la aplicación directamente sin cargar traducciones
  bootstrapApplication(AppComponent, appConfig).catch((err) =>
    console.error(err)
  );
} else {
  // Si es otro idioma, buscar el archivo XLIFF y luego arrancar
  console.log(`⏳ Loading translation file for: ${language}`);
  fetch(`assets/locale/messages.${language}.xlf`)
    .then((response) => {
      console.log(`✅ Fetch response status: ${response.status}`);
      if (!response.ok) {
        throw new Error(`Could not find translation file for ${language}. Status: ${response.status}`);
      }
      return response.text();
    })
    .then((translations) => {
      console.log(`🚀 Bootstrapping application with '${language}' translations.`);
      // Arrancar la aplicación con las traducciones cargadas
      bootstrapApplication(AppComponent, {
        ...appConfig,
        providers: [
          ...appConfig.providers,
          { provide: TRANSLATIONS, useValue: translations },
          { provide: TRANSLATIONS_FORMAT, useValue: 'xlf' },
        ],
      });
    })
    .catch((err) => {
      console.error('❌ Error loading translations, falling back to default language', err);
      // Si falla la carga, arrancar en español
      bootstrapApplication(AppComponent, appConfig);
    });
}

