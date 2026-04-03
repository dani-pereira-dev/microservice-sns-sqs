# Marketplace Simple Flow

## Cuando se crea cada cosa

### Carrito

El carrito se crea cuando el cliente llama:

```text
POST /carts
```

En ese momento `cart` persiste una entidad `Cart` con:

- `id`
- `customerName`
- `status = open`
- `createdAt`
- `updatedAt`

Todavia no existe ninguna orden.

### Cart items

Los items del carrito se crean cuando el cliente llama:

```text
POST /carts/:cartId/items
```

En ese momento:

1. `cart` consulta a `products` por HTTP para traer el producto.
2. valida que exista y que este activo.
3. guarda un snapshot en `cart_items` con:
   - `productId`
   - `productTitleSnapshot`
   - `unitPrice`
   - `quantity`
   - `lineTotal`

### Order

La orden se crea cuando el cliente llama:

```text
POST /carts/:cartId/checkout
```

En ese momento:

1. `cart` toma todos los `cart_items`.
2. arma un payload para `orders`.
3. llama por HTTP a:

```text
POST /orders
```

4. `orders` crea la entidad `Order` en estado `pending`.

### Order items

Los `order_items` se crean en el mismo momento que la orden, durante el checkout.

No se crean antes.

Secuencia:

1. el carrito ya tiene `cart_items`
2. `cart` manda esos items como snapshot a `orders`
3. `orders` inserta:
   - una fila en `orders`
   - una o varias filas en `order_items`

O sea:

- `cart_items` representan la compra en construccion
- `order_items` representan la compra ya cerrada

## Modelo de entidades

```mermaid
flowchart TD
  Product["Product\nid\ntitle\nprice\nactive"]
  Cart["Cart\nid\ncustomerName\nstatus\ncreatedAt\nupdatedAt\ncheckedOutOrderId?"]
  CartItem["CartItem\nid\nproductId\nproductTitleSnapshot\nunitPrice\nquantity\nlineTotal"]
  Order["Order\nid\ncustomerName\namount\nstatus\ncreatedAt\nupdatedAt\nsourceCartId?\npayment?"]
  OrderItem["OrderItem\nid\nproductId\nproductTitleSnapshot\nunitPrice\nquantity\nlineTotal"]
  Payment["Payment\nidempotencyKey\npaymentId\norderId\namount\npaymentMethod\nstatus\nconfirmedAt"]
  Outbox["PaymentOutbox\neventId\ntopicArn\nstatus\nattempts\npublishedAt?"]

  Product -->|"snapshot al agregar"| CartItem
  Cart --> CartItem
  Cart -->|"checkout"| Order
  Order --> OrderItem
  Product -->|"snapshot al checkout"| OrderItem
  Order --> Payment
  Payment --> Outbox
```

## Comunicacion entre servicios

```mermaid
flowchart LR
  Client[Client]
  Products[ProductsService]
  Cart[CartService]
  Orders[OrdersService]
  Payments[PaymentsService]
  PaymentTopic[PaymentConfirmedSNS]
  OrdersQueue[OrdersSQS]
  OrderStatusTopic[OrderStatusSNS]
  NotifyQueue[NotificationOrderStatusSQS]
  NotifyLambda[NotificationLambda]

  Client -->|"POST /carts"| Cart
  Client -->|"POST /products"| Products
  Client -->|"POST /carts/:cartId/items"| Cart
  Cart -->|"GET /products/:productId"| Products
  Client -->|"POST /carts/:cartId/checkout"| Cart
  Cart -->|"POST /orders"| Orders
  Client -->|"POST /payments/confirm"| Payments
  Payments -->|"payment.confirmed"| PaymentTopic
  PaymentTopic --> OrdersQueue
  OrdersQueue --> Orders
  Orders -->|"order.confirmed / order.confirmation_failed"| OrderStatusTopic
  OrderStatusTopic --> NotifyQueue
  NotifyQueue --> NotifyLambda
```

## Flujo completo

```mermaid
sequenceDiagram
  participant Client
  participant Products
  participant Cart
  participant Orders
  participant Payments
  participant SNS
  participant OrdersSQS
  participant NotifySQS
  participant Lambda

  Client->>Products: POST /products
  Client->>Cart: POST /carts
  Client->>Cart: POST /carts/:cartId/items
  Cart->>Products: GET /products/:productId
  Products-->>Cart: product
  Cart-->>Client: cart con cart_items

  Client->>Cart: POST /carts/:cartId/checkout
  Cart->>Orders: POST /orders con items snapshot
  Orders-->>Cart: order pending
  Cart-->>Client: cart checked_out + orderId

  Client->>Payments: POST /payments/confirm
  Payments->>Orders: GET /orders/:orderId
  Payments->>SNS: publish payment.confirmed
  SNS->>OrdersSQS: fanout
  OrdersSQS->>Orders: payment.confirmed
  Orders->>Orders: confirma o rechaza la orden
  Orders->>SNS: publish order.confirmed o order.confirmation_failed
  SNS->>NotifySQS: fanout
  NotifySQS->>Lambda: resultado real de orders
  Lambda->>Lambda: envia email con Resend
```

## Resumen corto

- `Cart` nace primero.
- `CartItem` nace cuando agregas productos al carrito.
- `Order` y `OrderItem` nacen juntos en el checkout.
- `Payment` nace cuando confirmas el pago.
- `Order` publica el resultado final de confirmacion y desde ahi sale el email.
