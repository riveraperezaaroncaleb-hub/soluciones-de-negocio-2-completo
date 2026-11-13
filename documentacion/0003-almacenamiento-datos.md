# ADR-0003: Almacenamiento seguro en PostgreSQL y restricción estricta de salida de datos a terceros

- Estado: Aceptado
- Fecha: 2026-11-13
- Decide: Equipo de Arquitectura de Datos y Oficial de Cumplimiento

## Contexto

El sistema gestiona datos personales de acceso restringido (nombres, correos, credenciales cifradas y documentos de CV) conforme a la Ley 8968 de Costa Rica. Es indispensable definir con exactitud el ciclo de vida, la ubicación física de almacenamiento y las fronteras de transferencia a terceros.

## Decisión

Los datos estructurados y relacionales se almacenan en PostgreSQL con cifrado en reposo (AES-256) y políticas de seguridad por fila (Row Level Security - RLS). Al proveedor del modelo de IA solo se transmite el texto del CV para su procesamiento efímero, sin persistencia remota ni uso para reentrenamiento. La purga de datos por cancelación se ejecuta a los 30 días mediante un job programado.

## Alternativas descartadas

- Enviar perfiles completos con historial crediticio o datos de navegación al proveedor de IA: descartado por violación del principio de minimización (Art. 4 Ley 8968).
- Almacenamiento en servicios compartidos sin RLS ni cifrado: descartado por incumplimiento del deber de seguridad técnica (Art. 10 Ley 8968).

## Consecuencias

Se garantiza soberanía de los datos, aislamiento seguro entre usuarios y cumplimiento ágil de solicitudes de rectificación o supresión (derechos ARCO). Como contrapartida, requiere mantenimiento y auditoría continua de las políticas RLS y de las claves de cifrado.

## Cómo se verifica

Comprobado mediante las políticas RLS declaradas en las migraciones de base de datos (`supabase/migrations/`) y en los tests de seguridad de endpoints (`tests/security/data-isolation.test.ts`).
