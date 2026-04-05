# Module Architecture

Esta guia explica la arquitectura actual de cada microservicio y que tipo de archivo va en cada carpeta.

## Idea general

Cada app sigue este patron dentro de `src/`:

```text
src/
  app.module.ts
  main.ts
  domain/
  http/
  messaging/
  persistence/
```

## Que hace cada nivel

### `main.ts`

Es el punto de arranque del microservicio.

Responsabilidad:

- levantar Nest
- delegar el bootstrap comun
- iniciar el proceso HTTP

### `app.module.ts`

Es el modulo raiz de la app.

Responsabilidad:

- cargar configuracion
- registrar `MessagingModule` cuando aplica
- importar el modulo de dominio principal

## Que va en cada carpeta

### `domain/`

Aca vive el nucleo del microservicio.

Estructura tipica (por rol):

```text
domain/
  *.module.ts
  services/
  validators/
  builders/
  error-handlers/   (cuando aplica)
```

Debe contener:

- `*.module.ts` del dominio en la raiz de `domain/`
- `services/` con la fachada (`*.service.ts`), comandos (`*-command.service.ts`) y consultas (`*-query.service.ts`)
- `validators/` con `*.domain.validators.ts` (validaciones y precondiciones que lanzan excepciones)
- `builders/` con `*.domain.builders.ts` o builders nombrados por caso de uso
- `error-handlers/` con factories de errores o helpers de rollback cuando aplica
- tipos o modelos propios del dominio en la raiz de `domain/` si no son compartidos

No deberia contener:

- controladores HTTP
- consumidores/publicadores SNS-SQS
- detalles de SQLite

### `http/`

Contiene la capa de entrada HTTP.

Debe contener:

- `*.controller.ts`

Responsabilidad:

- recibir requests
- leer params y body
- delegar al service

La idea es que sea una capa delgada.

### `messaging/`

Contiene la capa de entrada y salida asincrona.

Debe contener:

- consumers de SQS
- publishers a SNS
- publishers tecnicos como el outbox publisher

Responsabilidad:

- traducir eventos de infraestructura a llamadas del dominio
- publicar eventos salientes
- mantener el polling y consumo desacoplado del dominio

### `persistence/`

Contiene todo lo relacionado a almacenamiento local.

Debe contener:

- `*-database.ts`
- `*.repository.ts`

Responsabilidad:

- inicializar SQLite
- definir schema
- leer y escribir datos
- encapsular queries

## Microservicio por microservicio

### `orders`

`orders` es el duenio de la entidad `Order`.

Estructura:

```text
apps/orders/src/
  app.module.ts
  main.ts
  domain/
    orders.module.ts
    services/
      orders.service.ts
      orders-query.service.ts
      orders-command.service.ts
    validators/
      orders.domain.validators.ts
    builders/
      orders.domain.builders.ts
  http/
    orders.controller.ts
  messaging/
    orders-checkout.consumer.ts
    orders-events.consumer.ts
    orders-events.publisher.ts
  persistence/
    orders.repository.ts
```

Que hace cada parte:

- `domain/services/orders.service.ts`: fachada liviana para controladores y consumers
- `domain/services/orders-query.service.ts`: lecturas de ordenes
- `domain/services/orders-command.service.ts`: creacion y confirmacion
- `domain/validators/orders.domain.validators.ts`: validaciones de input y reglas previas a confirmar
- `domain/builders/orders.domain.builders.ts`: construccion de `Order` y `OrderItem`
- `http/orders.controller.ts`: expone `GET /orders`, `GET /orders/:id` y `POST /orders`
- `messaging/orders-checkout.consumer.ts`: escucha `checkout.initiated`
- `messaging/orders-events.consumer.ts`: escucha `payment.confirmed`
- `messaging/orders-events.publisher.ts`: publica `order.created`, `order.confirmed` y `order.confirmation_failed`
- `persistence/orders.repository.ts`: persiste `orders` y `order_items`

### `payments`

`payments` es el duenio de la entidad `Payment` y de su outbox.

Estructura:

```text
apps/payments/src/
  app.module.ts
  main.ts
  domain/
    payments.module.ts
    services/
      payments.service.ts
      payments-query.service.ts
      payments-command.service.ts
    validators/
      payments.domain.validators.ts
    builders/
      payments.domain.builders.ts
  http/
    payments.controller.ts
  messaging/
    payments-events.consumer.ts
    payments-outbox.publisher.ts
  persistence/
    payments-database.ts
    payments.repository.ts
    payments-outbox.repository.ts
    payments-transactional.repository.ts
```

Que hace cada parte:

- `domain/services/payments.service.ts`: fachada liviana
- `domain/services/payments-query.service.ts`: lecturas de pagos y outbox
- `domain/services/payments-command.service.ts`: confirmacion automatica, idempotencia y publicacion logica
- `domain/validators/payments.domain.validators.ts`: validaciones e invariantes de confirmacion
- `domain/builders/payments.domain.builders.ts`: construccion de `PaymentConfirmation` y `payment.confirmed`
- `http/payments.controller.ts`: expone lectura de pagos y outbox
- `messaging/payments-events.consumer.ts`: escucha `order.created`
- `messaging/payments-outbox.publisher.ts`: publica eventos pendientes del outbox
- `persistence/payments-database.ts`: inicializa SQLite y schema
- `persistence/payments.repository.ts`: lectura de pagos
- `persistence/payments-outbox.repository.ts`: lectura y actualizacion del outbox
- `persistence/payments-transactional.repository.ts`: guarda `payment + outbox` en una sola transaccion

### `cart`

`cart` es el duenio del carrito y de la proyeccion local de productos que usa para operar sin llamadas sincronas a `products`.

Estructura:

```text
apps/cart/src/
  app.module.ts
  main.ts
  domain/
    cart.module.ts
    cart-product-projection.ts
    services/
      cart.service.ts
      cart-query.service.ts
      cart-command.service.ts
    validators/
      cart.domain.validators.ts
    builders/
      cart.domain.builders.ts
    error-handlers/
      cart.domain.error-handlers.ts
  http/
    cart.controller.ts
  messaging/
    cart-checkout.publisher.ts
  persistence/
    cart-database.ts
    cart.repository.ts
    cart-product-projections.repository.ts
```

Que hace cada parte:

- `domain/services/cart.service.ts`: fachada liviana
- `domain/services/cart-query.service.ts`: lecturas de carrito y proyecciones
- `domain/services/cart-command.service.ts`: mutaciones de carrito y checkout
- `domain/validators/cart.domain.validators.ts`: validaciones de cantidad, estado del carrito y disponibilidad local
- `domain/builders/cart.domain.builders.ts`: construccion de `Cart`, `CartItem` y `checkoutPayload`
- `domain/error-handlers/cart.domain.error-handlers.ts`: rollback ante fallo al publicar checkout
- `domain/cart-product-projection.ts`: tipo minimo del producto proyectado
- `http/cart.controller.ts`: expone endpoints de carrito y de `product-projections`
- `messaging/cart-checkout.publisher.ts`: publica `checkout.initiated`
- `persistence/cart-database.ts`: inicializa SQLite y schema de `carts`, `cart_items` y `product_projections`
- `persistence/cart.repository.ts`: maneja `Cart` y `CartItem`
- `persistence/cart-product-projections.repository.ts`: maneja la tabla local `product_projections`

### `products`

`products` es el duenio del catalogo.

Estructura:

```text
apps/products/src/
  app.module.ts
  main.ts
  domain/
    products.module.ts
    services/
      products.service.ts
      products-query.service.ts
      products-command.service.ts
    validators/
      products.domain.validators.ts
    builders/
      products.domain.builders.ts
  http/
    products.controller.ts
  persistence/
    products.repository.ts
```

Que hace cada parte:

- `domain/services/products.service.ts`: fachada liviana
- `domain/services/products-query.service.ts`: lecturas del catalogo
- `domain/services/products-command.service.ts`: altas y actualizaciones
- `domain/validators/products.domain.validators.ts`: validaciones de titulo, precio y existencia
- `domain/builders/products.domain.builders.ts`: construccion de `Product` y actualizaciones
- `http/products.controller.ts`: expone endpoints del catalogo
- `persistence/products.repository.ts`: persiste `products`

### `notification` legado

Este microservicio Nest queda como referencia local, pero el flujo principal de emails hoy corre en la Lambda `notification-email`.

Estructura:

```text
apps/notification/src/
  app.module.ts
  main.ts
  domain/
    notification.module.ts
    services/
      notification.service.ts
      notification-command.service.ts
    validators/
      notification.domain.validators.ts
    builders/
      notification-email-content.builder.ts
    error-handlers/
      notification.domain.errors.ts
  messaging/
    notification-events.consumer.ts
```

Que hace cada parte:

- `domain/services/notification.service.ts`: fachada liviana
- `domain/services/notification-command.service.ts`: orquesta el envio del email
- `domain/builders/notification-email-content.builder.ts`: arma subject y body segun el evento
- `domain/validators/notification.domain.validators.ts`: valida configuracion minima para enviar
- `domain/error-handlers/notification.domain.errors.ts`: factories de errores de configuracion o evento no soportado
- `messaging/notification-events.consumer.ts`: escucha eventos de estado final de la orden

## Regla simple para seguir creciendo

Cuando agregues un archivo nuevo, usa esta regla:

- si decide reglas de negocio: `domain/services/`
- si valida invariantes y lanza excepciones del dominio: `domain/validators/*validators.ts`
- si arma entidades o payloads repetitivos: `domain/builders/*builders.ts`
- si centraliza errores de dominio o rollback: `domain/error-handlers/`
- si recibe o responde HTTP: `http/`
- si consume o publica eventos: `messaging/`
- si toca SQLite o queries: `persistence/`
- si arranca la app o compone modulos: raiz de `src/`

## Resumen corto

- `main.ts` y `app.module.ts` quedan solos en la raiz
- `domain` contiene negocio
- `domain/services` agrupa fachada, comandos y consultas
- `domain/validators` y `domain/builders` mantienen el dominio legible
- `domain/error-handlers` agrupa errores y recuperacion cuando aplica
- `http` contiene controllers
- `messaging` contiene SNS/SQS
- `persistence` contiene SQLite y repositorios

Con esto cada microservicio mantiene la misma forma mental aunque cambie su complejidad interna.
