# Agendo Pro

Marketplace responsivo de barberías y dashboard demo construido con Next.js 14
(App Router), TypeScript, Tailwind CSS, componentes con patrón shadcn/ui,
Recharts y Lucide.

## Ejecutar

```powershell
cd web
npm install
npm run dev
```

Abre `http://localhost:3001`. La aplicación funciona sin API ni base de datos.
Para verificar antes de publicar:

```powershell
npm run typecheck
npm run lint
npm run build
```

## Sistema de diseño

La interfaz aplica un sistema visual inspirado en el poste de barbero:
tipografía Big Shoulders Display para cifras y Hanken Grotesk para texto,
tokens de color (`--azulejo`, `--capa`, `--tinta`, `--poste-azul`,
`--poste-rojo`, `--laton`), modo claro/oscuro persistente y soporte para
`prefers-reduced-motion`. La página principal prioriza el **próximo turno
libre** antes que cualquier banner, con una sola llamada roja a la acción por
pantalla y CTAs azules para acciones secundarias.

La interfaz está disponible en español (es-MX) e inglés (en-US); el selector
del encabezado guarda la preferencia en `localStorage` y sincroniza
`document.documentElement.lang`.

## Datos de demostración

La demo no está conectada a MySQL ni procesa pagos. Las citas, referidos,
membresía, oferta y configuración del panel se guardan localmente.

- **Oferta relámpago:** se crea una sola vez con 2 h 14 min 9 s de duración,
  inventario 2/12 y etiqueta visible `Demo`. No se reinicia automáticamente; si
  vence o se agota, queda así. Los cupos se descuentan al reservar el servicio
  de la oferta.
- **Prueba social y disponibilidad:** valoraciones, reservas semanales y turnos
  son datos de muestra. No representan actividad real.
- **Poste de referidos:** cada invitado que completa su primera cita suma un
  crédito y avanza el poste de 0 a 3. El canje descuenta un crédito. El botón
  de simulación del invitado es una prueba local y está marcado como tal.
- **Link entrante:** puedes probar `http://localhost:3001/?ref=CARLOS-BARBER`.
  El código aplica el cupón de bienvenida a la reserva; el crédito del poste se
  otorga al invitador, no a quien usa el enlace.
- **Checkout:** dos pasos (horario y datos) con un up-sell opcional antes de
  confirmar. Nada está preseleccionado y el cupón de bienvenida se descuenta una
  sola vez. No se realiza ningún cobro.
- **Membresías:** Basic, VIP y Family, con cambio a cobro anual, ahorro
  personalizado según el historial, pausa de un mes y cancelación con
  consecuencias visibles. Los precios son de demostración.
- **Chat:** respuestas guionizadas. Detecta y enmascara tarjetas, contraseñas y
  datos fiscales; no los guarda ni los envía.

Claves de almacenamiento: `agendo-pro-store-v1`, `agendo-pro-referral-code-v1`,
`agendo-pro-theme-v1` y `agendo-pro-locale-v1`.

## Dashboard

Se abre desde **Admin** o el enlace del pie de página. Incluye:

- KPIs de reservas, conversión de referidos, ingresos completados, clientes
  activos, CAC y LTV observado.
- Gráfica mensual MRR vs CAC con leyenda que distingue las series por forma y
  color, además de una tabla de datos alternativa.
- Salud LTV:CAC, payback y CAC por canal.
- Simulador «¿Y si…?» con precio de membresía, referidos y CAC; los cálculos se
  difieren con `useDeferredValue`.
- Descarga CSV, filtros por barbería y fechas, embudo de referidos, actividad
  reciente y configuración de cupón, comisión y gasto de adquisición.

Los ingresos consideran únicamente citas completadas y son importes registrados,
no pagos verificados. El CAC es el gasto de adquisición del periodo dividido
entre clientes nuevos (primera cita). El LTV es observado, no una proyección.
Las proyecciones del simulador están marcadas como demo.

## Nota de despliegue

Se mantuvo Next.js 14 para respetar el stack solicitado. La auditoría de npm
reportó avisos de seguridad de severidad alta/crítica en esta rama y PostCSS;
este prototipo no debe publicarse como producción sin actualizar a una versión
de Next.js actualmente mantenida y volver a ejecutar la auditoría. La actualización
mayor requiere revisar compatibilidad antes de aplicarla.

## Estructura

- `app/`: App Router, layout, fuentes, estilos y página inicial.
- `components/marketplace/`: hero de próximo turno y oferta relámpago.
- `components/poste/`: progreso accesible del poste.
- `components/checkout/`: modal de up-sell.
- `components/membresias/`: tabla de planes y flujo de cancelación.
- `components/chat/`: chat con protección de datos sensibles.
- `components/ui/`: componentes reutilizables al estilo shadcn/ui.
- `lib/`: catálogo demo, disponibilidad, membresías, métricas, i18n, moneda y
  utilidades.
