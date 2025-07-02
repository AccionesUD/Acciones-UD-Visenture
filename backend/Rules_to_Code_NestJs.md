# 📘 Estándares de Codificación Backend (NestJS)

## 🗣️ Importancia de la Comunicación y Consistencia
La comunicación clara dentro del equipo de desarrollo es clave para el éxito de cualquier proyecto. Al establecer y seguir un conjunto de reglas y estándares de codificación, garantizamos:
- Mantenibilidad del código a largo plazo.
- Facilidad para nuevos integrantes al integrarse al equipo.
- Reducción de errores y ambigüedades en la lógica del sistema.
- Mayor eficiencia al revisar y depurar código.

---

## 📦 1. Estructura de Proyecto
- Utilizar la estructura modular recomendada por NestJS.
- Cada módulo debe tener su propio controller, service, dto y entity.
- Los nombres de carpetas y archivos deben estar en `kebab-case`.

## 🧠 2. Separación de Responsabilidades
- **No se permite** incluir lógica de negocio en los **controladores**.
- Toda lógica debe residir en los **servicios** (`services`).
- Los **controladores** se limitan a recibir las peticiones, validar datos (con DTOs), y delegar a los servicios.

## 🔐 3. Variables de Entorno
- Usar únicamente las variables definidas en los archivos `.env`.
- Las variables deben accederse mediante `ConfigService`.
- **Prohibido** hardcodear valores sensibles (claves, URLs, tokens).

## 🧪 4. Buenas Prácticas de Desarrollo
- Usar DTOs para validar datos entrantes (`class-validator`).
- Utilizar interfaces o clases abstractas para contratos.
- Manejar errores con `try/catch` y `HttpException`.

## 🧾 5. Nombres y Estilo
- **camelCase** para variables y funciones.
- **PascalCase** para clases, DTOs, entidades y servicios.
- Nombres descriptivos y en inglés.

## 🧼 6. Limpieza de Código
- Prohibido dejar código comentado en producción.
- Pasar `eslint` o `prettier` antes de hacer `commit`.

## 🧰 7. Inyección de Dependencias
- Usar `@Injectable()` y el sistema de inyección de NestJS.
- No instanciar servicios manualmente.

## 🧬 8. Control de Versiones y Git
- Mensajes de commit: `type(scope): descripción`, ejemplo: `feat(auth): implement login endpoint`.
- Convención de ramas: `feature/`, `bugfix/`, `hotfix/`.

## 🧪 9. Pruebas
- Todo nuevo servicio debe incluir pruebas unitarias básicas.
- Usar `Jest` como framework de pruebas.

---
