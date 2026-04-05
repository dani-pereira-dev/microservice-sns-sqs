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

Debe contener:

- `*.module.ts` del dominio
- `*.service.ts` con reglas de negocio
- `*.validators.ts` o `*.guards.ts` con validaciones y precondiciones del dominio
- tipos o modelos propios del dominio si no son compartidos

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
    orders.service.ts
    orders-query.service.ts
    orders-command.service.ts
    orders.domain.validators.ts
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

- `domain/orders.service.ts`: fachada liviana para controladores y consumers
- `domain/orders-query.service.ts`: lecturas de ordenes
- `domain/orders-command.service.ts`: creacion y confirmacion
- `domain/orders.domain.validators.ts`: validaciones de input y reglas previas a confirmar
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
    payments.service.ts
    payments-query.service.ts
    payments-command.service.ts
    payments.domain.validators.ts
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

- `domain/payments.service.ts`: fachada liviana
- `domain/payments-query.service.ts`: lecturas de pagos y outbox
- `domain/payments-command.service.ts`: confirmacion automatica, idempotencia y publicacion logica
- `domain/payments.domain.validators.ts`: validaciones e invariantes de confirmacion
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
    cart.service.ts
    cart-query.service.ts
    cart-command.service.ts
    cart.domain.validators.ts
    cart-product-projection.ts
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

- `domain/cart.service.ts`: fachada liviana
- `domain/cart-query.service.ts`: lecturas de carrito y proyecciones
- `domain/cart-command.service.ts`: mutaciones de carrito y checkout
- `domain/cart.domain.validators.ts`: validaciones de cantidad, estado del carrito y disponibilidad local
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
    products.service.ts
  http/
    products.controller.ts
  persistence/
    products.repository.ts
```

Que hace cada parte:

- `domain/products.service.ts`: crea y actualiza productos
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
    notification.service.ts
  messaging/
    notification-events.consumer.ts
```

Que hace cada parte:

- `domain/notification.service.ts`: arma el contenido de la notificacion
- `messaging/notification-events.consumer.ts`: escucha eventos de estado final de la orden

## Regla simple para seguir creciendo

Cuando agregues un archivo nuevo, usa esta regla:

- si decide reglas de negocio: `domain/`
- si valida invariantes y lanza excepciones del dominio: `domain/*validators.ts`
- si recibe o responde HTTP: `http/`
- si consume o publica eventos: `messaging/`
- si toca SQLite o queries: `persistence/`
- si arranca la app o compone modulos: raiz de `src/`

## Resumen corto

- `main.ts` y `app.module.ts` quedan solos en la raiz
- `domain` contiene negocio
- `domain` tambien puede contener validators/guards del dominio
- `http` contiene controllers
- `messaging` contiene SNS/SQS
- `persistence` contiene SQLite y repositorios

Con esto cada microservicio mantiene la misma forma mental aunque cambie su complejidad interna.
