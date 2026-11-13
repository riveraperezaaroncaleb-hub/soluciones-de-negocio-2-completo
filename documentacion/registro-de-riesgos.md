# Registro de riesgos (OWASP Top 10 for LLM & NIST AI RMF)

Marco de referencia: [OWASP Top 10 for LLM](https://genai.owasp.org/llm-top-10/) y [NIST AI RMF 1.0](https://www.nist.gov/itl/ai-risk-management-framework).

| ID | Riesgo | Quién sale afectado | Probabilidad (B/M/A) | Impacto (B/M/A) | Regla de Mitigación Técnica Implementada | Estado | Responsable |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **R1** | **Inyección de prompt directa/indirecta (OWASP LLM01 / NIST Measure 2.6):** Inserción de comandos maliciosos en textos o archivos para evadir directivas del modelo o extraer datos. | Sistema y candidatos | M | A | Aislamiento con delimitadores XML (`<data>`), validación de salida estructurada mediante esquema Zod/JSON estricto y rechazo de prompts no conformes. | Hecho | Lead Backend |
| **R2** | **Fuga de datos personales a telemetría / Sentry (OWASP LLM06 / NIST Protect 1.1):** Volcado de PII (correos, nombres, payloads) en capturas de errores enviadas a terceros. | Titulares de los datos | M | A | Middleware `beforeSend` en cliente Sentry con sanitización regex de emails/tokens y exclusión forzada de cabeceras de autorización y cuerpo de peticiones. | Hecho | DevOps / Infra |
| **R3** | **Alucinación de políticas (OWASP LLM09 / NIST Measure 2.7):** Fabricación de reglas de negocio, requerimientos o respuestas no respaldadas por la base de conocimiento oficial. | Usuarios y evaluadores | M | M | RAG acotado con `temperature: 0.0`, obligatoriedad de citas directas y fallback automático a plantilla estática si la similitud de embeddings es inferior a 0.82. | Hecho | Ingeniero de IA |

