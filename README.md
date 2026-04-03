# Monorepo simple con NestJS

Base simple, pero mas cercana a produccion, para tres microservicios HTTP:

- `orders`
- `payments`
- `notification`

La estructura ya queda preparada para crecer con modulos internos, configuracion por servicio y una integracion simple de SNS/SQS para comunicacion asincrona.

## Estructura

```text
apps/
  orders/
    src/
      app.module.ts
      main.ts
      orders.controller.ts
      orders-events.consumer.ts
      orders.module.ts
      orders.repository.ts
      orders.service.ts
  payments/
    src/
      app.module.ts
      main.ts
      payments.controller.ts
      payments.module.ts
      payments.repository.ts
      payments.service.ts
  notification/
    src/
      app.module.ts
      main.ts
      notification-events.consumer.ts
      notification.module.ts
      notification.service.ts
libs/
  shared/
    src/
      bootstrap/
      config/
      contracts/
      messaging/
```

## Scripts

Instalar dependencias:

```bash
npm install
```

Levantar en desarrollo:

```bash
npm run start:dev
```

O levantar uno por separado:

```bash
npm run start:dev:orders
npm run start:dev:payments
npm run start:dev:notification
```

Resetear las bases SQLite locales:

```bash
npm run db:reset
```

El script `start:dev` primero cierra instancias previas de estos tres servicios y despues los vuelve a levantar juntos.

Cada servicio usa un puerto por defecto:

- `orders`: `3001`
- `payments`: `3002`
- `notification`: `3003`

Podes sobreescribirlos con:

- `ORDERS_PORT`
- `PAYMENTS_PORT`
- `NOTIFICATION_PORT`
- `ORDERS_DB_PATH`
- `PAYMENTS_DB_PATH`

Si queres, tambien existe fallback a `PORT` cuando levantas un servicio de forma individual.

## Variables de entorno

Tenes un ejemplo en `.env.example`.

Para desarrollo real, crea un `.env.local` y pone ahi tus credenciales y recursos AWS. Ese archivo queda ignorado por git.

Variables relevantes:

- `AWS_REGION`
- `AWS_ENDPOINT`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_SESSION_TOKEN`
- `AWS_SNS_PAYMENT_CONFIRMED_TOPIC_ARN`
- `AWS_SQS_ORDERS_PAYMENT_CONFIRMED_QUEUE_URL`
- `AWS_SQS_NOTIFICATION_PAYMENT_CONFIRMED_QUEUE_URL`

Si usas credenciales locales de AWS CLI o IAM role, no hace falta duplicarlas aca. El SDK tambien soporta la cadena default de credenciales de AWS. Si usas LocalStack, podes completar `AWS_ENDPOINT` y usar credenciales dummy.

## Endpoints disponibles

- `GET /orders`
- `POST /orders`
- `GET /payments`
- `POST /payments/confirm`

`notification` no expone endpoints de negocio en este flujo. Consume eventos desde SQS.

## Flujo actual

1. Crear una orden en `orders`. La orden queda en estado `pending`.
2. Confirmar el pago en `payments`.
3. `payments` publica el evento `payment.confirmed` en SNS.
4. SNS distribuye el evento a dos colas SQS.
5. `orders` consume el evento y actualiza la orden a `confirmed`.
6. `notification` consume el mismo evento y ejecuta un placeholder de notificacion.

`orders` ahora persiste localmente en SQLite. Por defecto usa `data/orders.sqlite`, asi que las ordenes sobreviven a reinicios del servicio.
`payments` tambien persiste localmente en SQLite en su propia base separada. Por defecto usa `data/payments.sqlite`.

## Criterio de arquitectura

- Cada app tiene un modulo de dominio minimo.
- La configuracion vive en un modulo global por servicio.
- La capa compartida define `bootstrap`, configuracion y contratos de mensajeria.
- Los contratos compartidos viven en `libs/shared/src/contracts`.
- La mensajeria usa un `MessagingModule` pequeno con publisher SNS y consumer SQS.
- `payments` publica eventos; `orders` y `notification` consumen esos eventos.
- `orders` usa un repositorio simple con SQLite para persistir y retomar ordenes.
- `payments` usa su propio repositorio SQLite separado para persistir pagos confirmados.
