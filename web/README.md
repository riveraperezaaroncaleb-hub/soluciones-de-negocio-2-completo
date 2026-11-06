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

Abre `http://localhost:3001`. Next usa el puerto `3001` para convivir con la API
Express existente en `3000`. Para verificar antes de publicar:

```powershell
npm run typecheck
npm run lint
npm run build
```

La landing mobile-first usa tema oscuro premium con toggle claro/oscuro,
temporizador de cupón, progreso de reserva, upsell, oferta VIP, compartir por
WhatsApp/Web Share y aviso de actividad de muestra. Precios, cupos, cuenta
regresiva, reseñas y actividad social son datos simulados; no afirmamos que sean
reseñas verificadas ni urgencia real. La app conserva citas, referidos y
membresía demo en `localStorage`; no envía datos a MySQL ni procesa pagos. El
recorrido de una reserva crea la conversión de referido y acredita el corte
gratis en los datos simulados. Puedes probar un enlace entrante con
`http://localhost:3001/?ref=CARLOS-BARBER`. El dashboard se abre desde el botón
**Admin** o el enlace del pie de página.

El dashboard agrega las citas y referidos persistidos en el navegador; los
filtros de barbería y fechas se aplican a sus métricas y gráficas. Los ingresos
consideran únicamente citas marcadas como completadas y son importes registrados,
no pagos verificados. El CAC se calcula como gasto de adquisición configurado
para el periodo dividido entre clientes nuevos identificados por su primera
cita. El LTV mostrado es observado (ingresos acumulados de citas completadas
divididos entre clientes con al menos una cita completada), no una proyección.
LTV:CAC solo aparece cuando ambas métricas se pueden calcular. El gasto de
adquisición debe ingresarse en el panel; una versión anterior del estado guardado
se migra con gasto sin registrar, por lo que CAC queda sin calcular hasta
capturarlo. La demo no está conectada a SQL y los datos se limitan a ese navegador.

## Esquema SQL

`database/schema.sql` contiene el esquema para MySQL 8: usuarios, barberías,
servicios, ofertas, suscripciones, citas, códigos de referido reutilizables y
conversiones. Selecciona tu base de datos y ejecuta el archivo en tu entorno.
No incluye credenciales, creación de base de datos ni datos reales.
Los importes usan `DECIMAL` y `currency CHAR(3)`, con USD como valor inicial.

La conversión debe persistirse en una transacción: validar que el código esté
activo y pertenezca a la barbería, crear/obtener al cliente, crear la cita,
registrar una fila de `referrals` y acreditar una sola recompensa al invitador.
El estado `rewarded` y `reward_credited_at` permiten evitar duplicar créditos.
Conecta el frontend a esos endpoints al configurar tu API y reglas comerciales.

## Nota de despliegue

Se mantuvo Next.js 14 para respetar el stack solicitado. La auditoría de npm
reportó avisos de seguridad de severidad alta/crítica en esta rama y PostCSS;
este prototipo no debe publicarse como producción sin actualizar a una versión
de Next.js actualmente mantenida y volver a ejecutar la auditoría. La actualización
mayor requiere revisar compatibilidad antes de aplicarla.

## Estructura

- `app/`: App Router, layout, estilos y página inicial.
- `components/`: marketplace, tarjetas, sidebar de marketing, checkout/up-sell
  y dashboard de administración.
- `components/ui/`: componentes reutilizables al estilo shadcn/ui.
- `lib/`: catálogo demo, tipos, formato MX y utilidades.
- `database/schema.sql`: esquema relacional.
