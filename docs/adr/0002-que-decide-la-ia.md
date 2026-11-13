# ADR 002: La IA solo extrae; nunca puntúa, ordena ni descarta candidatos

- **Estado:** Aceptado
- **Fecha:** 2026-11-13
- **Decide:** Equipo de Arquitectura de Datos y Cumplimiento Normativo

## Contexto

El uso de sistemas automatizados en selección y perfilamiento de personas presenta graves riesgos de discriminación y opacidad algorítmica, como evidencian litigios internacionales:
- **Caso Workday:** Demandas por sesgos discriminatorios sistemáticos (edad, raza, discapacidad) generados por modelos predictivos opacos en cribado masivo de candidatos.
- **Caso Salta (Argentina):** Algoritmo predictivo de deserción escolar y embarazo adolescente con falsos positivos lesivos y estigmatización por falta de representatividad y supervisión.

Para cumplir con la Ley 8968 (garantías de autodeterminación informativa y prohibición de discriminación injustificada), se requiere un límite estricto al rol del modelo en la interacción con datos personales.

## Decisión tomada

**«La IA extrae y recomienda, pero jamás toma decisiones de exclusión o puntuación punitiva sin validación humana estricta.»**

En términos operativos:
1. **Rol permitido:** La IA actúa como herramienta pasiva de extracción y estructuración de información (ej. normalizar CVs a esquemas JSON, clasificar etiquetas o resumir trayectoria factual).
2. **Rol estrictamente prohibido:** La IA **nunca** calcula puntajes automáticos de idoneidad (*fit scoring*), no genera rankings algorítmicos vinculantes ni ejecuta descartes automáticos de postulantes.
3. **Human-in-the-loop obligatorio:** Toda recomendación o resumen es visible únicamente para el evaluador humano, quien asume la responsabilidad exclusiva de aceptar, rechazar o avanzar a un candidato.

## Consecuencias

### Positivas
- **Mitigación legal y ética:** Elimina la responsabilidad por discriminación algorítmica algorítmicamente ciega y garantiza explicabilidad frente a solicitudes ARCO (Ley 8968).
- **Transparencia:** Mantiene trazabilidad total: cada decisión de exclusión tiene un responsable humano identificable.
- **Calidad del proceso:** Reduce el impacto de sesgos históricos embebidos en los modelos fundacionales.

### Negativas / Costes
- **Mayor latencia operativa:** No hay cribado 100% instantáneo; requiere tiempo de revisión humana cualificada.
- **Carga de interfaz:** Requiere diseñar flujos UI/UX que obliguen a la confirmación humana antes de persistir cualquier estado de descarte.

## Alternativas descartadas

1. **Filtrado algorítmico autónomo con umbral de corte:** Descartada por alto riesgo de exclusión indebida sin recurso efectivo y vulnerabilidad a sesgos indirectos (Workday).
2. **Puntuación (*ranking scoring*) predictiva de méritos:** Descartada por falta de explicabilidad y tendencia del usuario humano a caer en sesgo de automatización (*automation bias*).

## Cómo se verifica

- **En base de datos:** El esquema de postulaciones rechaza transiciones al estado `DESCARTADO` si no incluye un `user_id` de auditor/evaluador humano.
- **En tests automatizados:** Pruebas unitarias de API que validan que el endpoint del agente de IA no tiene permisos de escritura sobre el estado de postulación (`status = REJECTED/ACCEPTED`).
