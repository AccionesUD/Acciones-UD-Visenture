/// <reference types="@angular/localize" />

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { loadTranslations } from '@angular/localize';

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
  console.log('🚀 Bootstrapping application in base language: Spanish');
  bootstrapApplication(AppComponent, appConfig).catch((err) =>
    console.error(err)
  );
} else {
  // Si es otro idioma, buscar el archivo XLIFF y luego arrancar
  console.log(`⏳ Loading translation file for: ${language}`);
  fetch(`assets/locale/messages.${language}.xlf`)
    .then(response => {
      console.log(`✅ Fetch response status: ${response.status}`);
      if (!response.ok) {
        throw new Error(`Could not find translation file for ${language}. Status: ${response.status}`);
      }
      return response.text();
    })
    .then(translationsXml => {
      console.log(`� Parsing translations for '${language}'`);
      
      // Crear un objeto que contenga las traducciones
      const translationPairs: { [key: string]: string } = {};
      
      try {
        if (typeof DOMParser !== 'undefined') {
          // En navegador, usar DOMParser
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(translationsXml, 'text/xml');
          
          // Verificar si el parsing fue exitoso
          const parseError = xmlDoc.getElementsByTagName('parsererror');
          if (parseError.length > 0) {
            console.error('❌ XML Parse error:', parseError[0].textContent);
            throw new Error('XML parsing failed');
          }
          
          console.log('✅ XML parsed successfully');
          
          // Extraer las traducciones
          const transUnits = xmlDoc.getElementsByTagName('trans-unit');
          console.log(`Found ${transUnits.length} translation units in the XLIFF file`);
          
          for (let i = 0; i < transUnits.length; i++) {
            const transUnit = transUnits[i];
            const id = transUnit.getAttribute('id');
            const targetNodes = transUnit.getElementsByTagName('target');
            
            if (id && targetNodes.length > 0 && targetNodes[0].textContent) {
              // Añadir la traducción con el ID correcto
              translationPairs[id] = targetNodes[0].textContent.trim();
              
              // También probamos con el formato :@@id: que es como Angular busca las traducciones
              const altId = `:@@${id}:`;
              translationPairs[altId] = targetNodes[0].textContent.trim();
            }
          }
          console.log(`✅ Loaded ${Object.keys(translationPairs).length} translations from XLIFF file`);
        } else {
          throw new Error('DOMParser not available, this might be a server-side rendering issue');
        }
      } catch (error) {
        console.error('❌ Error parsing XLIFF translations', error);
        throw error;
      }
      
      // Cargar las traducciones antes del bootstrap usando loadTranslations
      console.log(`🚀 Loading translations and bootstrapping application`);
      // Establecer el idioma actual
      $localize.locale = language;
      // Cargar las traducciones
      loadTranslations(translationPairs);
      
      // Arrancar la aplicación (después de cargar las traducciones)
      return bootstrapApplication(AppComponent, appConfig);
    })
    .catch(err => {
      console.error('❌ Error in translation process, falling back to default language', err);
      // Si falla la carga, arrancar en español
      return bootstrapApplication(AppComponent, appConfig);
    });
}

