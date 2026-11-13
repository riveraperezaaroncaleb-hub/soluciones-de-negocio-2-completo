# Inventario de Datos Personales (Ley 8968 - Costa Rica)

**Organización:** Sistema Web / Plataforma Digital  
**Marco Legal:** Ley de Protección de la Persona frente al Tratamiento de sus Datos Personales (Ley N° 8968) y su Reglamento (Decreto N° 37554-JP).  
**Responsable:** Arquitectura de Datos y Cumplimiento Normativo.

---

## Tabla de Inventario de Tratamiento de Datos

| Nombre del dato | Origen | Categoría | Propósito del uso | Base de legitimación | Política de retención / purga |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Nombre completo** | Formulario de registro (Titular) | Personal (Acceso irrestricto/restringido) | Identificación y personalización de la cuenta de usuario en la plataforma. | Consentimiento informado (Art. 5 Ley 8968) | Conservación activa durante la vigencia de la cuenta. Purga total a los 30 días naturales tras solicitud de baja. |
| **Correo electrónico** | Formulario de registro (Titular) | Personal | Autenticación, recuperación de credenciales y comunicaciones transaccionales. | Consentimiento informado (Art. 5 Ley 8968) | Conservación activa mientras la cuenta exista. Purga a los 30 días de la cancelación del servicio. |
| **Registros de actividad (Logs, IP, timestamp)** | Telemetría / Servidores web | Personal | Seguridad del sistema, auditoría informática y prevención de accesos no autorizados. | Ley (Cumplimiento legal y deber de seguridad, Art. 10 Ley 8968) | Rotación y purga automatizada a los 6 meses (180 días), salvo requerimiento judicial expreso. |
| **Metadatos e interacciones de IA (Prompts, tokens, respuestas)** | Entrada del usuario y motor de inferencia | Personal / Sensible (según input contextual) | Ejecución del modelo generativo, trazabilidad del servicio y mejora algorítmica. | Consentimiento informado específico (Art. 5 y 9 Ley 8968) | Eliminación de prompts en memoria tras inferencia; logs anonimizados a los 90 días; purga definitiva a petición del titular. |

---

### Notas de Cumplimiento (Ley 8968)
1. **Minimización y Finalidad:** Los datos se tratan exclusivamente para los fines informados en el aviso de privacidad.
2. **Derechos ARCO:** El titular puede ejercer sus derechos de Acceso, Rectificación, Cancelación y Oposición mediante los canales oficiales de contacto.
3. **Seguridad Técnica:** Cifrado en reposo (AES-256) y en tránsito (TLS 1.3), con control estricto de accesos por rol (RBAC).

