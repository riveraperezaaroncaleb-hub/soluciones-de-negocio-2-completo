# Registro de riesgos (OWASP Top 10 for LLM & NIST AI RMF)

Marco de referencia: [OWASP Top 10 for LLM](https://genai.owasp.org/llm-top-10/) y [NIST AI RMF 1.0](https://www.nist.gov/itl/ai-risk-management-framework).

| # | Riesgo | Quién sale afectado | Probabilidad (B/M/A) | Impacto (B/M/A) | Mitigación | Estado | Responsable |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **R1** | **Inyección de prompt directa/indirecta (OWASP LLM01 / NIST Measure 2.6):** Carga de texto o documentos con instrucciones maliciosas que buscan anular el system prompt y alterar la extracción. | Sistema y candidatos evaluados | M | A | Delimitación estricta de inputs mediante tags XML (`<data>`), validación de salida estructurada contra esquema JSON estricto (Zod/Pydantic) y prohibición de ejecución de comandos. | Hecho | Lead Backend |
| **R2** | **Fuga de datos personales a logs y Sentry (OWASP LLM06 / NIST Protect 1.1):** Excepciones no controladas o trazas de error que exponen credenciales, correos o PII hacia servicios externos de observabilidad. | Usuarios y postulantes | M | A | Hook `beforeSend` en SDK de Sentry que ejecuta regex de ofuscación (*scrubbing*) de emails, IPs y tokens, bloqueando el envío de `request.body` en logs de error. | Hecho | DevOps / Infra |
| **R3** | **Alucinación de políticas y requisitos (OWASP LLM09 / NIST Measure 2.7):** Generación de respuestas o resúmenes con criterios inventados o normativas inexistentes no presentes en el contexto oficial. | Usuarios del portal y reclutadores | M | M | Inferencia anclada a RAG con `temperature: 0.0`, umbral de similitud semántica >= 0.82 y fallback determinista que rechaza responder si el contexto no contiene la respuesta explícita. | Hecho | Ingeniero de IA |
