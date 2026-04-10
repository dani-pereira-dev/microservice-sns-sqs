# Monorepo simple con NestJS

Base simple, pero mas cercana a produccion, para cuatro microservicios HTTP y una Lambda:

- `orders`
- `payments`
- `products`
- `cart`
- `notification-email` (AWS Lambda)

La estructura ya queda preparada para crecer con modulos internos, configuracion por servicio y una integracion simple de SNS/SQS para comunicacion asincrona.

## Estructura

```text
apps/
  orders/
    src/
      app.module.ts
      main.ts
      orders-checkout.consumer.ts
      orders.controller.ts
      orders-events.consumer.ts
      orders-events.publisher.ts
      orders.module.ts
      orders.repository.ts
      orders.service.ts
  payments/
    src/
      app.module.ts
      main.ts
      payments.controller.ts
      payments-events.consumer.ts
      payments.module.ts
      payments-outbox.publisher.ts
      payments.repository.ts
      payments.service.ts
  products/
    src/
      app.module.ts
      main.ts
      products.controller.ts
      products.module.ts
      products.repository.ts
      products.service.ts
  cart/
    src/
      app.module.ts
      cart-checkout.publisher.ts
      main.ts
      cart.controller.ts
      cart.module.ts
      cart.repository.ts
      cart.service.ts
  notification/
    src/
      # legado de referencia, fuera del flujo principal
lambda/
  notification-email/
    src/
      handler.ts
docs/
  entity-states.md
  notification-lambda-migration.md
serverless.helpers.js
serverless.yml
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

Ese script levanta `orders`, `payments`, `products` y `cart`. El envio de emails queda a cargo de la Lambda de `notification-email`.

O levantar uno por separado:

```bash
npm run start:dev:orders
npm run start:dev:payments
npm run start:dev:products
npm run start:dev:cart
```

Resetear las bases SQLite locales:

```bash
npm run db:reset
```

Generar datos de prueba:

```bash
npm run seed:products
```

Poblar la proyeccion local minima de productos dentro de la DB de `cart`:

```bash
npm run seed:cart-product-projections
```

Ese seeder crea registros en `product_projections` dentro de `data/cart.sqlite` con solo:

- `id`
- `title`
- `price`
- `active`
- `updated_at`

Los ids del seeder de `products` y de `cart-product-projections` son deterministas para que ambas bases queden alineadas cuando quieras avanzar con la sincronizacion.

Crear una orden de prueba lista para confirmar:

```bash
npm run seed:order-ready
```

Ese seeder deja una sola orden `pending` con varios items y un id fijo:

```text
order-ready-to-confirm-1
```

O usar el seeder generico:

```bash
npm run seed -- --entity products --count 5000
```

Por defecto el seeder limpia la tabla antes de insertar. Si queres agregar registros sin borrar los existentes:

```bash
npm run seed -- --entity products --count 5000 --append
```

Purgar las colas SQS del flujo:

```bash
npm run queues:purge
```

Reset completo de bases y colas:

```bash
npm run reset:all
```

Build de la Lambda:

```bash
npm run build:notification:lambda
```

Empaquetar la Lambda:

```bash
npm run package:notification:lambda
```

Desplegar la Lambda con Serverless:

```bash
npm run deploy:notification:lambda
```

Ver informacion del stack:

```bash
npm run info:notification:lambda
```

Eliminar la Lambda:

```bash
npm run remove:notification:lambda
```

Si necesitas comparar con el enfoque anterior, el microservicio Nest de `notification` sigue en `apps/notification` como referencia, pero ya no forma parte del flujo principal.

El script `start:dev` primero cierra instancias previas de `orders` y `payments` y despues los vuelve a levantar.
El script `start:dev` primero cierra instancias previas de `orders`, `payments`, `products` y `cart`, y despues los vuelve a levantar.

Cada servicio usa un puerto por defecto:

- `orders`: `3001`
- `payments`: `3002`
- `products`: `3004`
- `cart`: `3005`

Podes sobreescribirlos con:

- `ORDERS_PORT`
- `PAYMENTS_PORT`
- `PRODUCTS_PORT`
- `CART_PORT`
- `ORDERS_DB_PATH`
- `PAYMENTS_DB_PATH`
- `PRODUCTS_DB_PATH`
- `CART_DB_PATH`

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
- `AWS_SNS_CHECKOUT_INITIATED_TOPIC_ARN`
- `AWS_SQS_ORDERS_CHECKOUT_INITIATED_QUEUE_URL`
- `AWS_SNS_ORDER_CREATED_TOPIC_ARN`
- `AWS_SQS_PAYMENTS_ORDER_CREATED_QUEUE_URL`
- `AWS_SNS_PAYMENT_CONFIRMED_TOPIC_ARN`
- `AWS_SNS_ORDER_STATUS_TOPIC_ARN`
- `AWS_SQS_ORDERS_PAYMENT_CONFIRMED_QUEUE_URL`
- `AWS_SQS_NOTIFICATION_ORDER_STATUS_QUEUE_URL`
- `AWS_SNS_PRODUCT_EVENTS_TOPIC_ARN` (publicacion desde `products` al crear o actualizar un producto)
- `AWS_SQS_CART_PRODUCT_EVENTS_QUEUE_URL` (cola SQS suscrita a ese topic; la consume `cart` para actualizar `product_projections`)
- `RESEND_API_KEY`
- `NOTIFICATION_EMAIL_FROM`
- `NOTIFICATION_DEFAULT_TO_EMAIL`
- `NOTIFICATION_LAMBDA_FUNCTION_NAME`

Si usas credenciales locales de AWS CLI o IAM role, no hace falta duplicarlas aca. El SDK tambien soporta la cadena default de credenciales de AWS. Si usas LocalStack, podes completar `AWS_ENDPOINT` y usar credenciales dummy.
Para emails de desarrollo con Resend, podes usar `onboarding@resend.dev` como remitente inicial y definir un destinatario por defecto en `NOTIFICATION_DEFAULT_TO_EMAIL`.
La guia paso a paso de migracion a Lambda con `serverless.yml` esta en `docs/notification-lambda-migration.md`.
El repo usa `serverless` v3 y un wrapper pequeño para cargar `.env`/`.env.local` antes de ejecutar `package`, `deploy`, `info` o `remove`.

## Endpoints disponibles

- `GET /orders`
- `GET /orders/:orderId`
- `POST /orders`
- `GET /products`
- `GET /products/:productId`
- `POST /products`
- `PATCH /products/:productId`
- `GET /carts`
- `GET /product-projections`
- `GET /product-projections/:productId`
- `GET /carts/:cartId`
- `POST /carts`
- `POST /carts/:cartId/items`
- `PATCH /carts/:cartId/items/:itemId`
- `DELETE /carts/:cartId/items/:itemId`
- `POST /carts/:cartId/checkout`
- `GET /payments`
- `GET /payments/outbox`
- `GET /payments/:paymentId`

`notification-email` no expone endpoints HTTP. Consume eventos desde SQS a traves de una Lambda.

## Flujo actual

1. Crear o modificar productos en `products`; el servicio persiste en SQLite y publica `product.created` / `product.updated` en `AWS_SNS_PRODUCT_EVENTS_TOPIC_ARN` cuando esa variable esta configurada.
2. `cart` expone el modulo `sync`, que hace polling de `AWS_SQS_CART_PRODUCT_EVENTS_QUEUE_URL` y mantiene la tabla `product_projections` con upserts (incluido `active: false` si lo envias en un update). Sin topic/cola configurados, los CRUD de productos siguen funcionando y el consumer del cart queda deshabilitado con un warning en logs.
3. Crear un carrito en `cart`.
4. Agregar items al carrito usando `product_projections` locales dentro de `cart`.
5. Ejecutar checkout del carrito; `cart` publica `checkout.initiated` y responde `accepted`.
6. `orders` consume `checkout.initiated`, crea la orden en estado `pending` y publica `order.created`.
7. `payments` consume `order.created`, crea el pago confirmado y lo deja en su outbox.
8. El outbox de `payments` publica `payment.confirmed` en SNS.
9. SNS distribuye ese evento a la cola SQS de `orders`.
10. `orders` consume el evento, intenta confirmar la orden y publica un nuevo evento de salida:
   - `order.confirmed` si la orden quedo confirmada
   - `order.confirmation_failed` si la orden no pudo confirmarse por una regla de negocio
11. SNS distribuye ese resultado a la cola SQS de `notification-email`.
12. La Lambda `notification-email` consume ese resultado real y envia un email indicando exito o fallo.

Como `POST /carts/:cartId/checkout` ahora responde `accepted`, el resultado final se inspecciona despues consultando `GET /orders` o `GET /payments` una vez que los consumers procesan las colas.

`orders` ahora persiste localmente en SQLite. Por defecto usa `data/orders.sqlite`, asi que las ordenes sobreviven a reinicios del servicio.
`payments` tambien persiste localmente en SQLite en su propia base separada. Por defecto usa `data/payments.sqlite`.
`products` persiste localmente en `data/products.sqlite`.
`cart` persiste localmente en `data/cart.sqlite`.
Los seeders escriben directo sobre esas bases locales ignoradas por git, asi que no agregan archivos de datos al repo.

## Criterio de arquitectura

- Cada app tiene un modulo de dominio minimo.
- La configuracion vive en un modulo global por servicio.
- La capa compartida define `bootstrap`, configuracion y contratos de mensajeria.
- Los contratos compartidos viven en `libs/shared/src/contracts`.
- La mensajeria usa un `MessagingModule` pequeno con publisher SNS y consumer SQS.
- `products` expone un catalogo HTTP simple y publica `product.created` / `product.updated` en SNS cuando `AWS_SNS_PRODUCT_EVENTS_TOPIC_ARN` esta definido.
- `cart` mantiene `product_projections` con el modulo `sync` (consumer SQS) y usa esas proyecciones al armar items; ademas publica `checkout.initiated` para arrancar el flujo de orden.
- `orders` crea la orden desde eventos y tambien confirma o rechaza la orden cuando recibe `payment.confirmed`.
- `payments` auto-confirma el pago cuando recibe `order.created`, y publica de forma confiable usando outbox.
- `orders` usa un repositorio simple con SQLite para persistir `order` y `order_items`.
- `payments` usa su propio repositorio SQLite separado para persistir pagos confirmados.
- `payments` tambien usa outbox para garantizar publicacion confiable a SNS.
