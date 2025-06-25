#!/usr/bin/env python3
import re
import sys
import json
import urllib.request
import urllib.parse
import time
from typing import Dict, Optional, Tuple, List
import html
import builtins
_orig_print = builtins.print
print = lambda *args, **kwargs: None

# Añadimos constantes para palabras clave de ICU que no deben traducirse
ICU_KEYWORDS = ['select', 'plural', 'VAR_SELECT', 'VAR_PLURAL', 'true', 'false', 'other', '=0', '=1', '=2']

def extract_special_tags(text: str) -> Tuple[str, List[str], List[str]]:
    """
    Extrae etiquetas XML especiales (como <x id="..."/>) que no deben ser traducidas
    y devuelve un texto limpio junto con los placeholders y las partes originales.
    
    Args:
        text: El texto que puede contener etiquetas XML especiales
        
    Returns:
        Tuple con:
        - El texto con placeholders en lugar de etiquetas especiales
        - Una lista de placeholders usados para reemplazar las etiquetas
        - Una lista de las etiquetas originales
    """
    # Patrón mejorado para detectar etiquetas XML especiales como <x id="START_TAG_SPAN" ctype="x-span" equiv-text="..."/>
    xml_tag_pattern = r'<x\s+id="[^"]+"\s+[^>]+?/>'
    
    placeholders = []
    original_parts = []
    
    # Copiar el texto original para ir reemplazando las etiquetas
    text_with_placeholders = text
    
    # Reemplazar etiquetas XML especiales con placeholders
    matches = re.finditer(xml_tag_pattern, text)
    for idx, match in enumerate(matches):
        xml_tag = match.group(0)
        placeholder = f"__XML_TAG_PLACEHOLDER_{idx}__"
        placeholders.append(placeholder)
        original_parts.append(xml_tag)
        text_with_placeholders = text_with_placeholders.replace(xml_tag, placeholder, 1)
    
    # También detectar etiquetas HTML regulares como <span>, <div>, etc.
    html_tag_pattern = r'</?[a-zA-Z][^>]*>'
    
    matches = re.finditer(html_tag_pattern, text_with_placeholders)
    for idx, match in enumerate(matches):
        html_tag = match.group(0)
        placeholder = f"__HTML_TAG_PLACEHOLDER_{len(placeholders) + idx}__"
        placeholders.append(placeholder)
        original_parts.append(html_tag)
        text_with_placeholders = text_with_placeholders.replace(html_tag, placeholder, 1)

    # Lista especial de nombres que NO queremos traducir
    no_translate_names = ['Visenture']
    for name in no_translate_names:
        if name in text_with_placeholders:
            placeholder = f"__NO_TRANSLATE_{len(placeholders)}__"
            placeholders.append(placeholder)
            original_parts.append(name)
            text_with_placeholders = text_with_placeholders.replace(name, placeholder, 1)

    return text_with_placeholders, placeholders, original_parts

def extract_icu_parts(text: str) -> Tuple[List[str], List[str]]:
    """
    Extrae partes de expresiones ICU que no deben ser traducidas y devuelve un texto limpio
    junto con los placeholders y las partes originales.
    
    Args:
        text: El texto que puede contener expresiones ICU
        
    Returns:
        Tuple con:
        - Una lista de placeholders usados para reemplazar las partes ICU
        - Una lista de las partes ICU originales
    """
    # Detectar si es una expresión ICU completa
    icu_pattern = r'\{([^{}]+(?:\{[^{}]*\}[^{}]*)+)\}'
    icu_keyword_pattern = r'\b(select|plural|VAR_SELECT|VAR_PLURAL|true|false|other|=\d+)\b'
    
    placeholders = []
    original_parts = []
    
    # Reemplazar partes de ICU con placeholders
    matches = re.finditer(icu_pattern, text)
    for idx, match in enumerate(matches):
        full_icu_expr = match.group(0)
        icu_content = match.group(1)
        
        # Verificar si tiene palabras clave ICU
        if re.search(icu_keyword_pattern, icu_content):
            placeholder = f"__ICU_PLACEHOLDER_{idx}__"
            placeholders.append(placeholder)
            original_parts.append(full_icu_expr)
    
    return placeholders, original_parts

def restore_special_parts(text: str, placeholders: List[str], original_parts: List[str]) -> str:
    """
    Restaura las etiquetas especiales y nombres no traducibles en el texto traducido.
    
    Args:
        text: El texto traducido con placeholders
        placeholders: Lista de placeholders usados
        original_parts: Lista de partes originales
        
    Returns:
        El texto con las partes especiales restauradas
    """
    result = text
    
    # Primera pasada: reemplazar placeholders exactos
    for i, (placeholder, original) in enumerate(zip(placeholders, original_parts)):
        if placeholder in result:
            result = result.replace(placeholder, original)
    
    # Segunda pasada: insensible a mayúsculas/minúsculas para los que faltan
    for placeholder, original in zip(placeholders, original_parts):
        lowercase_placeholder = placeholder.lower()
        if lowercase_placeholder in result.lower():
            # Buscar la posición exacta en el resultado
            pos = result.lower().find(lowercase_placeholder)
            if pos >= 0:
                # Reemplazar manteniendo el caso
                end_pos = pos + len(lowercase_placeholder)
                result = result[:pos] + original + result[end_pos:]
    
    # Restauración especial para Visenture (si se tradujo incorrectamente)
    if 'Visenture' not in result and 'visenture' in result.lower():
        pos = result.lower().find('visenture')
        if pos >= 0:
            end_pos = pos + len('visenture')
            result = result[:pos] + 'Visenture' + result[end_pos:]

    # Preservar mayúscula en la primera letra no espaciada
    idx = 0
    while idx < len(result) and result[idx].isspace():
        idx += 1
    if idx < len(result) and result[idx].islower():
        result = result[:idx] + result[idx].upper() + result[idx+1:]

    return result

def restore_icu_parts(text: str, placeholders: List[str], original_parts: List[str]) -> str:
    """
    Restaura las expresiones ICU originales en el texto traducido.
    
    Args:
        text: El texto traducido con placeholders
        placeholders: Lista de placeholders usados
        original_parts: Lista de partes ICU originales
        
    Returns:
        El texto con las expresiones ICU restauradas
    """
    result = text
    for placeholder, original in zip(placeholders, original_parts):
        result = result.replace(placeholder, original)
    return result

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
        Preserva expresiones ICU, etiquetas XML especiales y entidades HTML.
        """
        # Limpiar y validar texto
        clean_text = text.strip()
        if not clean_text or len(clean_text) < 2:
            return text
        
        # Debug para textos con etiquetas XML
        if '<x id=' in clean_text:
            print(f"\nDEBUG: Texto original con etiquetas XML: '{clean_text}'")
            
        # Detectar y extraer etiquetas XML especiales y HTML para preservarlas
        text_with_xml_placeholders, xml_placeholders, xml_originals = extract_special_tags(clean_text)
        
        # Debug para ver qué placeholders se han creado
        if xml_placeholders:
            print(f"DEBUG: Se extrajeron {len(xml_placeholders)} etiquetas XML")
            print(f"DEBUG: Texto con placeholders: '{text_with_xml_placeholders}'")
        
        # Detectar y extraer expresiones ICU para preservarlas
        icu_placeholders, icu_originals = extract_icu_parts(text_with_xml_placeholders)
        
        # Si hay expresiones ICU, reemplazarlas con placeholders antes de traducir
        text_to_translate = text_with_xml_placeholders
        for placeholder, original in zip(icu_placeholders, icu_originals):
            text_to_translate = text_to_translate.replace(original, placeholder)
            
        # Si después de extraer etiquetas y expresiones ICU el texto está vacío, devolver el original
        if not text_to_translate.strip():
            return text
            
        # Manejar textos muy largos dividiéndolos en oraciones
        max_len = 2000  # Reducido para mayor seguridad
        if len(clean_text) > max_len:
            # Primero intentar dividir por oraciones
            parts = re.split(r'(?<=[\.\!\?])\s+', clean_text)
            
            # Si una oración sigue siendo demasiado larga o solo hay una oración larga, 
            # dividir por comas, puntos y coma o cualquier otro delimitador adecuado
            translated_parts = []
            for part in parts:
                if len(part) > max_len:
                    subparts = re.split(r'(?<=[\,\;\:])\s+', part)
                    for subpart in subparts:
                        # Si aún así es muy largo, dividir en fragmentos más pequeños
                        if len(subpart) > max_len:
                            # Dividir en fragmentos de longitud segura
                            for i in range(0, len(subpart), max_len//2):  # Usar la mitad del máximo para garantizar superposición
                                chunk = subpart[i:i+max_len//2]
                                if chunk:
                                    translated_parts.append(self.translate_text(chunk, target_lang, source_lang))
                        else:
                            if subpart:
                                translated_parts.append(self.translate_text(subpart, target_lang, source_lang))
                else:
                    if part:
                        translated_parts.append(self.translate_text(part, target_lang, source_lang))
                    
            translated_full = ' '.join(translated_parts)
            
            # Restaurar expresiones ICU y etiquetas XML/HTML
            translated_full = restore_icu_parts(translated_full, icu_placeholders, icu_originals)
            translated_full = restore_special_parts(translated_full, xml_placeholders, xml_originals)
            
            # Debug para ver cómo se están manejando las etiquetas especiales
            if xml_placeholders:
                print(f"DEBUG: Restored {len(xml_placeholders)} special XML tags")
                
            cache_key = f"{source_lang}_{target_lang}_{clean_text}"
            self.translation_cache[cache_key] = translated_full
            return translated_full

        # Verificar en caché
        cache_key = f"{source_lang}_{target_lang}_{clean_text}"
        if cache_key in self.translation_cache:
            cached_result = self.translation_cache[cache_key]
            print(f"DEBUG: Usando resultado en caché: '{cached_result}'")
            return cached_result
        
        # Control de rate limiting
        if self.request_count >= self.max_requests_per_minute:
            time.sleep(60)
            self.request_count = 0
        
        # Intentar diferentes métodos de traducción
        translated = None
        
        # Método 1: Google Translate (gratuito)
        try:
            translated = self._translate_with_google(text_to_translate, target_lang, source_lang)
            if translated and translated != text_to_translate:
                # Restaurar expresiones ICU en el texto traducido
                if icu_placeholders:
                    print(f"DEBUG: Restaurando expresiones ICU")
                    translated = restore_icu_parts(translated, icu_placeholders, icu_originals)
                    
                # Restaurar etiquetas XML
                if xml_placeholders:
                    print(f"DEBUG: Restaurando etiquetas XML. Texto antes: '{translated}'")
                    translated = restore_special_parts(translated, xml_placeholders, xml_originals)
                    print(f"DEBUG: Texto después: '{translated}'")
                    
                self.translation_cache[cache_key] = translated
                return translated
        except Exception as e:
            print(f"Google Translate failed: {e}")
        
        # Método 2: MyMemory API (gratuito)
        try:
            translated = self._translate_with_mymemory(text_to_translate, target_lang, source_lang)
            if translated and translated != text_to_translate:
                # Restaurar expresiones ICU en el texto traducido
                if icu_placeholders:
                    print(f"DEBUG: Restaurando expresiones ICU (MyMemory)")
                    translated = restore_icu_parts(translated, icu_placeholders, icu_originals)
                    
                # Restaurar etiquetas XML
                if xml_placeholders:
                    print(f"DEBUG: Restaurando etiquetas XML (MyMemory). Texto antes: '{translated}'")
                    translated = restore_special_parts(translated, xml_placeholders, xml_originals)
                    print(f"DEBUG: Texto después (MyMemory): '{translated}'")
                    
                self.translation_cache[cache_key] = translated
                return translated
        except Exception as e:
            print(f"MyMemory failed: {e}")
        
        # Método 3: LibreTranslate (si está disponible)
        try:
            translated = self._translate_with_libretranslate(text_to_translate, target_lang, source_lang)
            if translated and translated != text_to_translate:
                # Restaurar expresiones ICU en el texto traducido
                if icu_placeholders:
                    print(f"DEBUG: Restaurando expresiones ICU (LibreTranslate)")
                    translated = restore_icu_parts(translated, icu_placeholders, icu_originals)
                    
                # Restaurar etiquetas XML
                if xml_placeholders:
                    print(f"DEBUG: Restaurando etiquetas XML (LibreTranslate). Texto antes: '{translated}'")
                    translated = restore_special_parts(translated, xml_placeholders, xml_originals)
                    print(f"DEBUG: Texto después (LibreTranslate): '{translated}'")
                    
                self.translation_cache[cache_key] = translated
                return translated
        except Exception as e:
            print(f"LibreTranslate failed: {e}")
        
        # Sistema de reintentos con espera exponencial
        max_retries = 3
        retry_count = 0
        
        while retry_count < max_retries:
            retry_count += 1
            delay = 2 ** retry_count  # Retraso exponencial: 2, 4, 8 segundos
            
            print(f"Translation attempt failed. Retrying in {delay} seconds (attempt {retry_count}/{max_retries})...")
            time.sleep(delay)
            
            # Reintentar en orden diferente para maximizar posibilidades de éxito
            services = [
                (self._translate_with_google, "Google"),
                (self._translate_with_mymemory, "MyMemory"),
                (self._translate_with_libretranslate, "LibreTranslate")
            ]
            
            # Alternar el orden de los servicios a probar en cada reintento
            retry_services = services[retry_count % len(services):] + services[:retry_count % len(services)]
            
            for translate_func, service_name in retry_services:
                try:
                    print(f"Retrying with {service_name}...")
                    translated = translate_func(text_to_translate, target_lang, source_lang)
                    if translated and translated != text_to_translate:
                        # Restaurar expresiones ICU en el texto traducido
                        if icu_placeholders:
                            print(f"DEBUG: Restaurando expresiones ICU (reintento)")
                            translated = restore_icu_parts(translated, icu_placeholders, icu_originals)
                            
                        # Restaurar etiquetas XML
                        if xml_placeholders:
                            print(f"DEBUG: Restaurando etiquetas XML (reintento). Texto antes: '{translated}'")
                            translated = restore_special_parts(translated, xml_placeholders, xml_originals)
                            print(f"DEBUG: Texto después (reintento): '{translated}'")
                            
                        self.translation_cache[cache_key] = translated
                        print(f"Retry successful with {service_name}")
                        return translated
                except Exception as e:
                    print(f"{service_name} retry failed: {e}")
        
        # Si todo falla después de los reintentos, devolver texto original
        print(f"Warning: Could not translate '{text_to_translate[:50]}...' to {target_lang} after {max_retries} retry attempts")
        return text  # Devolvemos el texto original completo
    
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
    import datetime
    
    translator = AutomaticTranslator()
    
    # Determinar directorio de salida
    if output_dir is None:
        output_dir = os.path.dirname(source_file_path)
    
    # Crear nombre del archivo de salida
    base_name = os.path.basename(source_file_path)
    name_without_ext = os.path.splitext(base_name)[0]
    output_file = os.path.join(output_dir, f"{name_without_ext}.{target_lang}.xlf")
    
    # Crear nombre del archivo de registro
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    log_file = os.path.join(output_dir, f"translation_{target_lang}_{timestamp}.log")
    
    print(f"🚀 Starting automatic translation to {target_lang}...")
    print(f"📁 Source file: {source_file_path}")
    print(f"📁 Output file: {output_file}")
    print(f"📝 Log file: {log_file}")
    print("⏳ This may take several minutes depending on the number of strings...")
    
    # Eliminar o neutralizar prints internos en translate_xlf_file_automatic
    # Iniciar registro de log
    with open(log_file, 'w', encoding='utf-8') as log:
        log.write(f"Translation log for {target_lang}\n")
        log.write(f"Source file: {source_file_path}\n")
        log.write(f"Output file: {output_file}\n")
        log.write(f"Date: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        log.write("="*50 + "\n\n")
    
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
            
            # Solo saltar textos vacíos, ahora manejamos correctamente las etiquetas XML
            if not source_text_clean:
                skipped_translations += 1
                return trans_unit
                
            # Detectar si el texto tiene etiquetas XML especiales, ahora las procesamos correctamente
            has_special_tags = '<x id=' in source_text or '</' in source_text
            if has_special_tags:                
                # Mostrar información sobre las etiquetas presentes
                if '<x id=' in source_text:
                    # Contar cuántas etiquetas XML especiales hay
                    xml_tag_count = len(re.findall(r'<x\s+id="[^"]+"\s+[^>]+?/>', source_text))
                    print(f"   → Contiene {xml_tag_count} etiquetas XML especiales <x id.../>")
                if '</' in source_text:
                    # Contar etiquetas HTML normales
                    html_tag_count = len(re.findall(r'</?[a-zA-Z][^>]*>', source_text))
                    print(f"   → Contiene {html_tag_count} etiquetas HTML normales")
            
            # Detectar expresiones ICU en el texto source
            icu_pattern = r'\{([A-Z_]+),[^{}]+\}'
            has_icu = re.search(icu_pattern, source_text_clean)
            if has_icu:
                print(f"Detected ICU expression in: '{source_text_clean[:50]}...'")
                # Si es una expresión ICU, la manejaremos con nuestra función especial de traducción que preserva las keywords
            
            # Verificar si ya tiene target
            has_target = f'<{ns_prefix}target>' in trans_unit
            
            if not has_target:
                # Detectar entidades HTML en el texto original
                has_html_entities = '&' in source_text_clean and (';' in source_text_clean)
                
                # Verificar si tiene etiquetas XML especiales
                has_special_tags = '<x id=' in source_text_clean or '</' in source_text_clean
                
                # Traducir el texto
                if has_special_tags:
                    print(f"Translating text with XML tags ({total_translations}): '{source_text_clean[:60]}...'")
                else:
                    print(f"Translating ({total_translations}): '{source_text_clean[:60]}...'")
                    
                translated_text = translator.translate_text(source_text_clean, target_lang)
                
                if translated_text and translated_text != source_text_clean:
                    successful_translations += 1
                    
                    # Preservar espacios del texto original
                    if source_text.startswith(' ') and not translated_text.startswith(' '):
                        translated_text = ' ' + translated_text
                    if source_text.endswith(' ') and not translated_text.endswith(' '):
                        translated_text = translated_text + ' '
                    
                    # Restaurar entidades HTML que pudieron ser cambiadas durante la traducción
                    if has_html_entities:
                        # Buscar entidades HTML en el texto fuente
                        html_entities = re.findall(r'&[a-zA-Z0-9#]+;', source_text_clean)
                        
                        # Para cada entidad HTML encontrada en el texto original,
                        # verifica si debe ser restaurada en el texto traducido
                        for entity in html_entities:
                            entity_text = html.unescape(entity)  # Convertir a caracter normal
                            entity_char = entity_text  # El carácter que representa la entidad
                            
                            # Si el carácter está en la traducción, asegurarse de que está como entidad HTML
                            if entity_char in translated_text and entity not in translated_text:
                                translated_text = translated_text.replace(entity_char, entity)
                    
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
                        # Detectar entidades HTML en el texto original
                        has_html_entities = '&' in source_text_clean and (';' in source_text_clean)
                        
                        print(f"Updating empty target ({total_translations}): '{source_text_clean[:60]}...'")
                        translated_text = translator.translate_text(source_text_clean, target_lang)
                        
                        if translated_text and translated_text != source_text_clean:
                            successful_translations += 1
                            
                            # Preservar espacios
                            if source_text.startswith(' ') and not translated_text.startswith(' '):
                                translated_text = ' ' + translated_text
                            if source_text.endswith(' ') and not translated_text.endswith(' '):
                                translated_text = translated_text + ' '
                            
                            # Restaurar entidades HTML que pudieron ser cambiadas durante la traducción
                            if has_html_entities:
                                # Buscar entidades HTML en el texto fuente
                                html_entities = re.findall(r'&[a-zA-Z0-9#]+;', source_text_clean)
                                
                                # Para cada entidad HTML encontrada en el texto original,
                                # verifica si debe ser restaurada en el texto traducido
                                for entity in html_entities:
                                    entity_text = html.unescape(entity)  # Convertir a caracter normal
                                    entity_char = entity_text  # El carácter que representa la entidad
                                    
                                    # Si el carácter está en la traducción, asegurarse de que está como entidad HTML
                                    if entity_char in translated_text and entity not in translated_text:
                                        translated_text = translated_text.replace(entity_char, entity)
                            
                            # Actualizar target
                            trans_unit = re.sub(target_pattern, f'<{ns_prefix}target>{translated_text}</{ns_prefix}target>', trans_unit)
                            print(f"✓ Updated: '{source_text_clean}' -> '{translated_text}'")
                        else:
                            print(f"✗ Failed to update: '{source_text_clean}'")
        
        return trans_unit
    
    # Lista para mantener seguimiento de traducciones faltantes
    missing_translations = []
    
    # Extraer los IDs de las unidades de traducción que no pudieron ser traducidas
    id_pattern = r'<(?:ns0:)?trans-unit\s+id=["\']([^"\']+)["\']'
    
    def find_missing_translations(match):
        trans_unit = match.group(0)
        
        # Buscar el ID de la unidad de traducción
        id_match = re.search(id_pattern, trans_unit)
        unit_id = id_match.group(1) if id_match else "unknown"
        
        # Verificar si tiene source pero no target
        has_source = "<source>" in trans_unit or "<ns0:source>" in trans_unit
        has_target = "<target>" in trans_unit or "<ns0:target>" in trans_unit
        
        if has_source and not has_target:
            # Extraer texto source
            source_pattern = r'<(?:ns0:)?source>(.*?)</(?:ns0:)?source>'
            source_match = re.search(source_pattern, trans_unit, re.DOTALL)
            source_text = source_match.group(1) if source_match else ""
            
            # Añadir a la lista de traducciones faltantes
            missing_translations.append((unit_id, source_text.strip()))
        
        return trans_unit
    
    # Buscar traducciones faltantes
    re.sub(pattern, find_missing_translations, content, flags=re.DOTALL)
    
    # Aplicar las traducciones
    content = re.sub(pattern, replace_trans_unit, content, flags=re.DOTALL)
    
    # Escribir el archivo actualizado
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(content)
    
    # Actualizar el archivo de registro con traducciones faltantes
    with open(log_file, 'a', encoding='utf-8') as log:
        log.write("\n=== Translation Summary ===\n")
        log.write(f"Total strings found: {total_translations}\n")
        log.write(f"Successfully translated: {successful_translations}\n")
        log.write(f"Skipped (complex/empty): {skipped_translations}\n")
        log.write(f"Failed translations: {total_translations - successful_translations - skipped_translations}\n")
        
        if total_translations > 0:
            success_rate = (successful_translations / (total_translations - skipped_translations)) * 100 if (total_translations - skipped_translations) > 0 else 0
            log.write(f"Success rate: {success_rate:.1f}%\n\n")
        
        if missing_translations:
            log.write("\n=== Missing Translations ===\n")
            for unit_id, source_text in missing_translations:
                log.write(f"ID: {unit_id}\n")
                log.write(f"Source: {source_text[:100]}{'...' if len(source_text) > 100 else ''}\n")
                log.write("-" * 50 + "\n")
    
    # Al final de translate_xlf_file_automatic, reemplazar summary prints con final_print
    final_print("\n=== Translation Summary ===")
    final_print(f"Total strings found: {total_translations}")
    final_print(f"Successfully translated: {successful_translations}")
    final_print(f"Skipped (complex/empty): {skipped_translations}")
    final_print(f"Failed translations: {total_translations - successful_translations - skipped_translations}")
    if total_translations > 0:
        success_rate = (successful_translations / (total_translations - skipped_translations)) * 100 if (total_translations - skipped_translations) > 0 else 0
        final_print(f"Success rate: {success_rate:.1f}%")
    final_print(f"File saved: {output_file}")
    final_print(f"Missing translations: {len(missing_translations)} (see log file for details)")

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

# Restaurar print original para mensajes finales
def final_print(*args, **kwargs):
    _orig_print(*args, **kwargs)
