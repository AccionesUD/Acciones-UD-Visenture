#!/usr/bin/env python3
import re
from typing import List, Tuple

def extract_special_tags(text: str) -> Tuple[str, List[str], List[str]]:
    """
    Extrae etiquetas XML especiales (como <x id="..."/>) que no deben ser traducidas
    y devuelve un texto limpio junto con los placeholders y las partes originales.
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
    
    # Especial: preservar siempre "Visenture"
    if "Visenture" in text_with_placeholders:
        placeholder = "__VISENTURE_FIX__"
        placeholders.append(placeholder)
        original_parts.append("Visenture")
        text_with_placeholders = text_with_placeholders.replace("Visenture", placeholder)
    
    return text_with_placeholders, placeholders, original_parts

def restore_special_parts(text: str, placeholders: List[str], original_parts: List[str]) -> str:
    """
    Restaura las etiquetas especiales y expresiones ICU originales en el texto traducido.
    También preserva las mayúsculas iniciales de las frases.
    """
    result = text
    
    # Primero, restaurar explícitamente Visenture si existe el placeholder
    visenture_placeholder = "__VISENTURE_FIX__"
    if visenture_placeholder.lower() in result.lower():
        pos = result.lower().find(visenture_placeholder.lower())
        if pos >= 0:
            # Usar el texto "Visenture" directamente
            result = result[:pos] + "Visenture" + result[pos + len(visenture_placeholder):]
    
    # Restaurar el resto de placeholders
    for placeholder, original in zip(placeholders, original_parts):
        if placeholder.lower() in result.lower():
            pos = result.lower().find(placeholder.lower())
            if pos >= 0:
                result = result[:pos] + original + result[pos + len(placeholder):]
        elif placeholder in result:
            result = result.replace(placeholder, original)
    
    # Siempre corregir "visenture" a "Visenture" al final
    if "visenture" in result.lower() and "visenture" != "Visenture".lower():
        pos = result.lower().find("visenture")
        while pos >= 0:
            # Reemplazar con la versión correcta manteniendo la capitalización
            result = result[:pos] + "Visenture" + result[pos+len("visenture"):]
            # Buscar la siguiente ocurrencia
            pos = result.lower().find("visenture", pos + len("Visenture"))
    
    # Preservar mayúscula en la primera letra no espaciada
    idx = 0
    while idx < len(result) and result[idx].isspace():
        idx += 1
    if idx < len(result) and result[idx].islower():
        result = result[:idx] + result[idx].upper() + result[idx+1:]

    return result

def test_visenture_fix():
    """Test para verificar que Visenture se preserve correctamente"""
    original = " Potencia tu Trading con <x id=\"START_TAG_SPAN\" ctype=\"x-span\" equiv-text=\"&lt;span class=&quot;text-emerald-600 dark:text-emerald-500&quot;&gt;\"/>Visenture<x id=\"CLOSE_TAG_SPAN\" ctype=\"x-span\" equiv-text=\"&lt;/span&gt;\"/>"
    
    print(f"Texto original: '{original}'")
    
    # 1. Extraer etiquetas XML y preservar Visenture
    text_with_placeholders, placeholders, originals = extract_special_tags(original)
    print(f"\nTexto con placeholders: '{text_with_placeholders}'")
    print(f"Placeholders: {placeholders}")
    print(f"Originales: {originals}")
    
    # 2. Simular traducción (con cambio a minúsculas de los placeholders)
    translated = text_with_placeholders.replace("Potencia tu Trading con", "Power your trading with")
    translated = translated.lower()  # Simular que el servicio de traducción convierte a minúsculas
    print(f"\nTexto traducido (simulando API): '{translated}'")
    
    # 3. Restaurar partes especiales
    restored = restore_special_parts(translated, placeholders, originals)
    print(f"\nTexto restaurado: '{restored}'")
    
    # Verificar que Visenture esté correcto
    success = "Visenture" in restored
    print(f"\nPrueba {'EXITOSA' if success else 'FALLIDA'}: Visenture preservado correctamente")

if __name__ == "__main__":
    print("=== PRUEBA DE SOLUCIÓN PARA PRESERVAR VISENTURE ===")
    test_visenture_fix()
