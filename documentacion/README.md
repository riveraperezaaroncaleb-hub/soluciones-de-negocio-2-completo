# Documentación del Sistema «Adelante»

Este directorio concentra el **Governance Pack** y la arquitectura de cumplimiento normativo (Ley 8968 de Costa Rica), seguridad técnica (OWASP Top 10 for LLM) y gestión de riesgos de IA (NIST AI RMF 1.0) para el proyecto **Adelante**.

---

## Índice de Documentos

| Documento | Descripción | Marco / Referencia |
| :--- | :--- | :--- |
| [AGENTS.md](AGENTS.md) | Constitución operativa y reglas de oro innegociables para agentes autónomos de código (Cursor, Copilot, Claude Code). | Gobernanza de Código |
| [inventario-de-datos.md](inventario-de-datos.md) | Catálogo de datos personales y técnicos tratados por la plataforma, propósitos, legitimación y políticas de purga. | Ley 8968 & PRODHAB |
| [registro-de-riesgos.md](registro-de-riesgos.md) | Matriz de riesgos de IA (inyección, fuga de PII, alucinación) con mitigaciones técnicas implementadas en código. | OWASP LLM & NIST AI RMF |
| [0001-modelo-proveedor-ia.md](0001-modelo-proveedor-ia.md) | **ADR 001:** Selección de modelos LLM vía backend seguro con garantía de no retención (*zero data retention*). | Arquitectura de IA |
| [0002-alcance-decision-humana.md](0002-alcance-decision-humana.md) | **ADR 002:** Regla vinculante: *La IA solo extrae; nunca puntúa, ordena ni descarta candidatos sin revisión humana*. | Ética & Mitigación de Sesgos |
| [0003-almacenamiento-datos.md](0003-almacenamiento-datos.md) | **ADR 003:** Políticas de almacenamiento en PostgreSQL con RLS, cifrado AES-256 y fronteras de salida a terceros. | Seguridad y Soberanía de Datos |

---

## Subdirectorios

- [`adr/`](adr/): Registros de Decisión de Arquitectura en formato MADR.
- [`gobernanza/`](gobernanza/): Documentación de políticas de datos y registro de riesgos.

