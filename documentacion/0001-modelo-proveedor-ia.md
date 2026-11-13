# ADR-0001: Uso de modelos LLM vía API backend para extracción estructurada de datos

- Estado: Aceptado
- Fecha: 2026-11-13
- Decide: Equipo de Arquitectura y Cumplimiento Normativo

## Contexto

El sistema requiere extraer y normalizar datos desde currículums y perfiles a esquemas estructurados JSON en español. Las restricciones principales son: costo predecible, baja latencia, confidencialidad estricta y garantía de que los datos de postulantes no se usen para entrenar modelos fundacionales.

## Decisión

El modelo seleccionado se consume exclusivamente mediante API desde el backend del servidor (`src/lib/ai/client.ts`), autenticado con variables de entorno (`AI_API_KEY`). Ninguna clave ni llamada a la API de IA existe en el cliente web. Se utiliza un acuerdo comercial de no retención de datos (*zero data retention*) con el proveedor.

## Alternativas descartadas

- Modelos locales autohospedados (ej. Llama 3 on-premise): descartado por el alto coste y complejidad de infraestructura de GPUs dedicadas en etapa inicial.
- Consultas directas desde el frontend: descartado por riesgo inaceptable de exposición de credenciales y manipulación de prompts.

## Consecuencias

Se obtiene alta precisión de extracción semántica en español con coste proporcional al uso. Como contrapartida, existe dependencia de la disponibilidad de la API del proveedor, mitigada mediante límites de tasa (*rate limiting*), reintentos con backoff exponencial y timeouts estrictos de 10 segundos.

## Cómo se verifica

Verificable en `tests/ai/client.test.ts`, donde se comprueba que el cliente valida variables de entorno del servidor y en las reglas de linter/CI que impiden referencias a librerías de IA en el código cliente.
