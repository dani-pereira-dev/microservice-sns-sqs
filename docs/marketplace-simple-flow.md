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

1. `cart` busca el producto en su tabla local `product_projections`.
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
2. arma el evento `checkout.initiated`.
3. lo publica en SNS y responde `accepted/pending`.
4. `orders` consume ese evento desde SQS.
5. `orders` crea la entidad `Order` en estado `pending`.

La creacion real de la orden deja de depender de una llamada HTTP sincrona.

### Order items

Los `order_items` se crean en el mismo momento que la orden, durante el checkout.

No se crean antes.

Secuencia:

1. el carrito ya tiene `cart_items`
2. `cart` manda esos items como snapshot en `checkout.initiated`
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
  ProductProjection["ProductProjection\nid\ntitle\nprice\nactive\nupdatedAt"]
  Cart["Cart\nid\ncustomerName\nstatus\ncreatedAt\nupdatedAt"]
  CartItem["CartItem\nid\nproductId\nproductTitleSnapshot\nunitPrice\nquantity\nlineTotal"]
  Order["Order\nid\ncustomerName\namount\nstatus\ncreatedAt\nupdatedAt\nsourceCartId?\npayment?"]
  OrderItem["OrderItem\nid\nproductId\nproductTitleSnapshot\nunitPrice\nquantity\nlineTotal"]
  Payment["Payment\nidempotencyKey\npaymentId\norderId\namount\npaymentMethod\nstatus\nconfirmedAt"]
  Outbox["PaymentOutbox\neventId\ntopicArn\nstatus\nattempts\npublishedAt?"]
  CheckoutEvent["checkout.initiated\ncheckoutId\ncartId\nitems[]"]
  OrderCreatedEvent["order.created\norderId\namount\nitems[]"]

  Product -->|"sincroniza proyeccion"| ProductProjection
  ProductProjection -->|"snapshot al agregar"| CartItem
  Cart --> CartItem
  Cart -->|"publish"| CheckoutEvent
  CheckoutEvent -->|"consume"| Order
  Order --> OrderItem
  Order -->|"publish"| OrderCreatedEvent
  OrderCreatedEvent -->|"consume"| Payment
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
  CheckoutTopic[CheckoutInitiatedSNS]
  CheckoutQueue[OrdersCheckoutSQS]
  OrderCreatedTopic[OrderCreatedSNS]
  PaymentsQueue[PaymentsOrderCreatedSQS]
  PaymentTopic[PaymentConfirmedSNS]
  OrdersQueue[OrdersSQS]
  OrderStatusTopic[OrderStatusSNS]
  NotifyQueue[NotificationOrderStatusSQS]
  NotifyLambda[NotificationLambda]

  Client -->|"POST /carts"| Cart
  Client -->|"POST /products"| Products
  Client -->|"POST /carts/:cartId/items"| Cart
  Client -->|"POST /carts/:cartId/checkout"| Cart
  Cart -->|"checkout.initiated"| CheckoutTopic
  CheckoutTopic --> CheckoutQueue
  CheckoutQueue --> Orders
  Orders -->|"order.created"| OrderCreatedTopic
  OrderCreatedTopic --> PaymentsQueue
  PaymentsQueue --> Payments
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
  participant CheckoutSNS
  participant OrdersCheckoutSQS
  participant Orders
  participant OrderCreatedSNS
  participant PaymentsSQS
  participant Payments
  participant PaymentSNS
  participant OrdersSQS
  participant OrderStatusSNS
  participant NotifySQS
  participant Lambda

  Client->>Products: POST /products
  Client->>Cart: POST /carts
  Client->>Cart: POST /carts/:cartId/items
  Cart->>Cart: lee product_projection local
  Cart-->>Client: cart con cart_items

  Client->>Cart: POST /carts/:cartId/checkout
  Cart->>CheckoutSNS: publish checkout.initiated
  Cart-->>Client: accepted + pending_async_order_creation
  CheckoutSNS->>OrdersCheckoutSQS: fanout
  OrdersCheckoutSQS->>Orders: checkout.initiated
  Orders->>Orders: crea order + order_items pending
  Orders->>OrderCreatedSNS: publish order.created
  OrderCreatedSNS->>PaymentsSQS: fanout
  PaymentsSQS->>Payments: order.created
  Payments->>Payments: auto-confirma pago + guarda outbox
  Payments->>PaymentSNS: publish payment.confirmed
  PaymentSNS->>OrdersSQS: fanout
  OrdersSQS->>Orders: payment.confirmed
  Orders->>Orders: confirma o rechaza la orden
  Orders->>OrderStatusSNS: publish order.confirmed o order.confirmation_failed
  OrderStatusSNS->>NotifySQS: fanout
  NotifySQS->>Lambda: resultado real de orders
  Lambda->>Lambda: envia email con Resend
```

## Resumen corto

- `Cart` nace primero.
- `CartItem` nace cuando agregas productos al carrito.
- `Order` y `OrderItem` nacen juntos al consumir `checkout.initiated`.
- `Payment` nace automaticamente al consumir `order.created`.
- `Order` publica el resultado final de confirmacion y desde ahi sale el email.
