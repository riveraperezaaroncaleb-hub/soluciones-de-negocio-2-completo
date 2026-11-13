# Inventario de datos

No se puede gobernar lo que no se sabe que se tiene. Una fila por cada dato que el sistema guarda, recibe o envía a un tercero, incluido el proveedor del modelo de IA.

| Dato | ¿Personal? | Categoría (Ley 8968, art. 9) | De dónde viene | Dónde se guarda | ¿Sale a un tercero? ¿A quién? | Cuánto se conserva | Quién puede verlo |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Nombre completo | Sí | Acceso restringido | Formulario de registro (Titular) | Base de datos PostgreSQL (`users.full_name`) | No | Mientras la cuenta esté activa; purga 30 días tras solicitud de baja | El usuario y evaluadores asignados |
| Correo electrónico | Sí | Acceso restringido | Formulario de registro (Titular) | Base de datos PostgreSQL (`users.email`) | Sí: servicio transaccional (Resend) para verificación | Mientras la cuenta esté activa; purga 30 días tras cancelación | El usuario y administradores del sistema |
| Texto del CV / Trayectoria | Sí | Acceso restringido | Archivo subido por el candidato | Almacenamiento S3 / Base de datos (`resumes`) | Sí: API del modelo de IA exclusivamente para extracción de campos estructurados | 6 meses o hasta retiro del consentimiento del titular | El candidato y reclutadores autorizados |
| Dirección IP y logs de acceso | Sí | Acceso restringido | Encabezados de solicitudes HTTP | Sistema de logs (`audit_logs`) | No | 180 días con rotación automática | Equipo de seguridad y DevOps |
| Metadatos de inferencia IA (tokens, latencia) | No | No aplica | Telemetría interna del gateway LLM | Métricas de observabilidad | No | 90 días agregados para control de costes | Ingenieros de plataforma |

## Lo que NO recolectamos

- Datos sensibles (salud, origen racial, orientación sexual, biometría, convicciones religiosas o políticas): no se solicitan ni procesan, ya que la evaluación es estrictamente técnica y profesional.
- Datos crediticios o información financiera: no se recolectan porque el acceso y postulación al portal es totalmente gratuito para los candidatos.
