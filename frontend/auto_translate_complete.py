#!/usr/bin/env python3
import re
import sys
import json
import urllib.request
import urllib.parse
import time
from typing import Dict, Optional
import html

class AutomaticTranslator:
    """
    Traductor completamente automático que toma todos los textos del archivo XLIFF
    y los traduce usando APIs gratuitas sin necesidad de diccionarios predefinidos.
    """
    
    def __init__(self):
        self.translation_cache = {}
        self.request_count = 0
        self.max_requests_per_minute = 30  # Límite conservador
        
    def translate_text(self, text: str, target_lang: str, source_lang: str = 'es') -> str:
        """
        Traduce un texto automáticamente usando múltiples APIs como fallback.
        """
        # Limpiar y validar texto
        clean_text = text.strip()
        if not clean_text or len(clean_text) < 2:
            return text
            
        # Verificar en caché
        cache_key = f"{source_lang}_{target_lang}_{clean_text}"
        if cache_key in self.translation_cache:
            return self.translation_cache[cache_key]
        
        # Control de rate limiting
        if self.request_count >= self.max_requests_per_minute:
            print("Rate limit reached, waiting...")
            time.sleep(60)
            self.request_count = 0
        
        # Intentar diferentes métodos de traducción
        translated = None
        
        # Método 1: Google Translate (gratuito)
        try:
            translated = self._translate_with_google(clean_text, target_lang, source_lang)
            if translated and translated != clean_text:
                self.translation_cache[cache_key] = translated
                return translated
        except Exception as e:
            print(f"Google Translate failed: {e}")
        
        # Método 2: MyMemory API (gratuito)
        try:
            translated = self._translate_with_mymemory(clean_text, target_lang, source_lang)
            if translated and translated != clean_text:
                self.translation_cache[cache_key] = translated
                return translated
        except Exception as e:
            print(f"MyMemory failed: {e}")
        
        # Método 3: LibreTranslate (si está disponible)
        try:
            translated = self._translate_with_libretranslate(clean_text, target_lang, source_lang)
            if translated and translated != clean_text:
                self.translation_cache[cache_key] = translated
                return translated
        except Exception as e:
            print(f"LibreTranslate failed: {e}")
        
        # Si todo falla, devolver texto original
        print(f"Warning: Could not translate '{clean_text}' to {target_lang}")
        return clean_text
    
    def _translate_with_google(self, text: str, target_lang: str, source_lang: str) -> Optional[str]:
        """Traduce usando Google Translate API gratuita."""
        try:
            self.request_count += 1
            
            # Codificar texto para URL
            encoded_text = urllib.parse.quote(text)
            
            # Construir URL
            url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl={source_lang}&tl={target_lang}&dt=t&q={encoded_text}"
            
            # Hacer petición
            req = urllib.request.Request(url, headers={
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            })
            
            with urllib.request.urlopen(req, timeout=10) as response:
                result = json.loads(response.read().decode())
                
                if result and len(result) > 0 and result[0] and len(result[0]) > 0:
                    translated_text = result[0][0][0]
                    # Pequeña pausa para evitar rate limiting
                    time.sleep(0.2)
                    return translated_text
                    
        except Exception as e:
            print(f"Google Translate error: {e}")
            return None
        
        return None
    
    def _translate_with_mymemory(self, text: str, target_lang: str, source_lang: str) -> Optional[str]:
        """Traduce usando MyMemory API (gratuita)."""
        try:
            self.request_count += 1
            
            # MyMemory usa códigos de idioma diferentes
            lang_map = {
                'es': 'es',
                'en': 'en',
                'fr': 'fr',
                'ru': 'ru'
            }
            
            source_code = lang_map.get(source_lang, source_lang)
            target_code = lang_map.get(target_lang, target_lang)
            
            # Codificar texto para URL
            encoded_text = urllib.parse.quote(text)
            
            # Construir URL
            url = f"https://api.mymemory.translated.net/get?q={encoded_text}&langpair={source_code}|{target_code}"
            
            # Hacer petición
            req = urllib.request.Request(url, headers={
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
            })
            
            with urllib.request.urlopen(req, timeout=10) as response:
                result = json.loads(response.read().decode())
                
                if result and 'responseData' in result and result['responseData']:
                    translated_text = result['responseData']['translatedText']
                    if translated_text and translated_text.lower() != text.lower():
                        time.sleep(0.1)
                        return translated_text
                        
        except Exception as e:
            print(f"MyMemory error: {e}")
            return None
        
        return None
    
    def _translate_with_libretranslate(self, text: str, target_lang: str, source_lang: str) -> Optional[str]:
        """Traduce usando LibreTranslate (servidor público si está disponible)."""
        try:
            self.request_count += 1
            
            # Datos para la petición POST
            data = {
                'q': text,
                'source': source_lang,
                'target': target_lang,
                'format': 'text'
            }
            
            # Codificar datos
            data_encoded = urllib.parse.urlencode(data).encode('utf-8')
            
            # Hacer petición a servidor público de LibreTranslate
            req = urllib.request.Request(
                'https://libretranslate.de/translate',
                data=data_encoded,
                headers={
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
                }
            )
            
            with urllib.request.urlopen(req, timeout=15) as response:
                result = json.loads(response.read().decode())
                
                if result and 'translatedText' in result:
                    translated_text = result['translatedText']
                    if translated_text and translated_text.lower() != text.lower():
                        time.sleep(0.3)
                        return translated_text
                        
        except Exception as e:
            print(f"LibreTranslate error: {e}")
            return None
        
        return None

def translate_xlf_file_automatic(source_file_path: str, target_lang: str, output_dir: str = None):
    """
    Traduce un archivo XLIFF de manera completamente automática.
    Crea una copia del archivo original para el idioma objetivo y lo traduce.
    """
    import os
    import shutil
    
    translator = AutomaticTranslator()
    
    # Determinar directorio de salida
    if output_dir is None:
        output_dir = os.path.dirname(source_file_path)
    
    # Crear nombre del archivo de salida
    base_name = os.path.basename(source_file_path)
    name_without_ext = os.path.splitext(base_name)[0]
    output_file = os.path.join(output_dir, f"{name_without_ext}.{target_lang}.xlf")
    
    print(f"🚀 Starting automatic translation to {target_lang}...")
    print(f"📁 Source file: {source_file_path}")
    print(f"📁 Output file: {output_file}")
    print("⏳ This may take several minutes depending on the number of strings...")
    
    # Crear copia del archivo original
    try:
        shutil.copy2(source_file_path, output_file)
        print(f"✅ Created copy for {target_lang}: {output_file}")
    except Exception as e:
        print(f"❌ Error creating copy: {e}")
        return
    
    # Leer el contenido del archivo copiado
    with open(output_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Buscar todas las unidades de traducción
    pattern = r'<(?:ns0:)?trans-unit[^>]*>.*?</(?:ns0:)?trans-unit>'
    
    total_translations = 0
    successful_translations = 0
    skipped_translations = 0
    
    def replace_trans_unit(match):
        nonlocal total_translations, successful_translations, skipped_translations
        trans_unit = match.group(0)
        
        # Buscar el texto source
        source_pattern = r'<(?:ns0:)?source>(.*?)</(?:ns0:)?source>'
        source_match = re.search(source_pattern, trans_unit, re.DOTALL)
        
        if source_match:
            total_translations += 1
            source_text = source_match.group(1)
            source_text_clean = source_text.strip()
            
            # Determinar el namespace a usar
            ns_prefix = "ns0:" if "ns0:" in trans_unit else ""
            
            # Solo traducir textos que no contengan elementos XML complejos y no estén vacíos
            if '<x id=' in source_text or '</' in source_text or not source_text_clean:
                skipped_translations += 1
                print(f"Skipped complex/empty text: '{source_text_clean[:50]}...'")
                return trans_unit
            
            # Verificar si ya tiene target
            has_target = f'<{ns_prefix}target>' in trans_unit
            
            if not has_target:
                # Traducir el texto
                print(f"Translating ({total_translations}): '{source_text_clean[:60]}...'")
                translated_text = translator.translate_text(source_text_clean, target_lang)
                
                if translated_text and translated_text != source_text_clean:
                    successful_translations += 1
                    
                    # Preservar espacios del texto original
                    if source_text.startswith(' ') and not translated_text.startswith(' '):
                        translated_text = ' ' + translated_text
                    if source_text.endswith(' ') and not translated_text.endswith(' '):
                        translated_text = translated_text + ' '
                    
                    # Añadir elemento target
                    target_element = f'\n        <{ns_prefix}target>{translated_text}</{ns_prefix}target>'
                    trans_unit = trans_unit.replace(f'</{ns_prefix}source>', f'</{ns_prefix}source>{target_element}')
                    
                    print(f"✓ Translated: '{source_text_clean}' -> '{translated_text}'")
                else:
                    print(f"✗ Failed to translate: '{source_text_clean}'")
            else:
                # Ya tiene target, verificar si necesita actualización
                target_pattern = f'<{ns_prefix}target>(.*?)</{ns_prefix}target>'
                target_match = re.search(target_pattern, trans_unit)
                
                if target_match:
                    current_target = target_match.group(1).strip()
                    
                    # Solo actualizar si el target está vacío o es igual al source
                    if not current_target or current_target == source_text_clean:
                        print(f"Updating empty target ({total_translations}): '{source_text_clean[:60]}...'")
                        translated_text = translator.translate_text(source_text_clean, target_lang)
                        
                        if translated_text and translated_text != source_text_clean:
                            successful_translations += 1
                            
                            # Preservar espacios
                            if source_text.startswith(' ') and not translated_text.startswith(' '):
                                translated_text = ' ' + translated_text
                            if source_text.endswith(' ') and not translated_text.endswith(' '):
                                translated_text = translated_text + ' '
                            
                            # Actualizar target
                            trans_unit = re.sub(target_pattern, f'<{ns_prefix}target>{translated_text}</{ns_prefix}target>', trans_unit)
                            print(f"✓ Updated: '{source_text_clean}' -> '{translated_text}'")
                        else:
                            print(f"✗ Failed to update: '{source_text_clean}'")
        
        return trans_unit
    
    # Aplicar las traducciones
    content = re.sub(pattern, replace_trans_unit, content, flags=re.DOTALL)
    
    # Escribir el archivo actualizado
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"\n=== Translation Summary ===")
    print(f"Total strings found: {total_translations}")
    print(f"Successfully translated: {successful_translations}")
    print(f"Skipped (complex/empty): {skipped_translations}")
    print(f"Failed translations: {total_translations - successful_translations - skipped_translations}")
    if total_translations > 0:
        success_rate = (successful_translations / (total_translations - skipped_translations)) * 100 if (total_translations - skipped_translations) > 0 else 0
        print(f"Success rate: {success_rate:.1f}%")
    print(f"File saved: {output_file}")

def translate_all_languages(source_file_path: str, output_dir: str = None):
    """
    Traduce el archivo base a todos los idiomas soportados.
    """
    languages = ['en', 'fr', 'ru']
    
    print(f"🌍 Starting translation to all languages...")
    print(f"📁 Source file: {source_file_path}")
    
    for lang in languages:
        print(f"\n{'='*50}")
        print(f"🔄 Translating to {lang.upper()}...")
        print(f"{'='*50}")
        
        try:
            translate_xlf_file_automatic(source_file_path, lang, output_dir)
            print(f"✅ {lang.upper()} translation completed!")
        except Exception as e:
            print(f"❌ Error translating to {lang}: {e}")
    
    print(f"\n🎉 All translations completed!")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso:")
        print("  python auto_translate_complete.py <archivo.xlf> [idioma]")
        print("  python auto_translate_complete.py <archivo.xlf> all")
        print("")
        print("Idiomas soportados: en, fr, ru, all")
        print("")
        print("Ejemplos:")
        print("  python auto_translate_complete.py src/locale/messages.xlf en")
        print("  python auto_translate_complete.py src/locale/messages.xlf all")
        print("")
        print("El script creará copias del archivo original para cada idioma")
        print("sin modificar el archivo fuente.")
        sys.exit(1)
    
    source_file_path = sys.argv[1]
    
    # Verificar que el archivo existe
    try:
        with open(source_file_path, 'r') as f:
            pass
    except FileNotFoundError:
        print(f"❌ Error: Archivo {source_file_path} no encontrado")
        sys.exit(1)
    
    if len(sys.argv) >= 3:
        language = sys.argv[2]
        
        if language == 'all':
            print(f"🚀 Iniciando traducción automática a TODOS los idiomas")
            print("⚠️  Este proceso puede tomar varios minutos...")
            print("💡 Se usarán múltiples APIs de traducción como fallback")
            
            try:
                translate_all_languages(source_file_path)
                print(f"\n✅ Todas las traducciones completadas")
            except Exception as e:
                print(f"\n❌ Error durante las traducciones: {e}")
                sys.exit(1)
        
        elif language in ['en', 'fr', 'ru']:
            print(f"🚀 Iniciando traducción automática a {language}")
            print("⚠️  Este proceso puede tomar varios minutos...")
            print("💡 Se usarán múltiples APIs de traducción como fallback")
            
            try:
                translate_xlf_file_automatic(source_file_path, language)
                print(f"\n✅ Traducción completada para {language}")
            except Exception as e:
                print(f"\n❌ Error durante la traducción: {e}")
                sys.exit(1)
        else:
            print("❌ Idioma no soportado. Use: en, fr, ru, all")
            sys.exit(1)
    else:
        # Si no se especifica idioma, traducir a todos
        print(f"🚀 No se especificó idioma, traduciendo a TODOS los idiomas")
        print("⚠️  Este proceso puede tomar varios minutos...")
        
        try:
            translate_all_languages(source_file_path)
            print(f"\n✅ Todas las traducciones completadas")
        except Exception as e:
            print(f"\n❌ Error durante las traducciones: {e}")
            sys.exit(1)
