# Entity States

Este documento muestra solo los estados posibles de las entidades del sistema y como cambian.

## Resumen general

| Entidad | Campo de estado | Estados posibles |
| --- | --- | --- |
| `Product` | `active` | `true`, `false` |
| `ProductProjection` | `active` | `true`, `false` |
| `Cart` | `status` | `open`, `checked_out` |
| `Order` | `status` | `pending`, `confirmed` |
| `Payment` | `status` | `confirmed` |
| `PaymentOutbox` | `status` | `pending`, `published` |
| `CartItem` | sin estado propio | no aplica |
| `OrderItem` | sin estado propio | no aplica |

## Vista global

```mermaid
flowchart LR
  Product["Product\nactive=true|false"]
  Projection["ProductProjection\nactive=true|false"]
  Cart["Cart\nopen -> checked_out"]
  Order["Order\npending -> confirmed"]
  Payment["Payment\nconfirmed"]
  Outbox["PaymentOutbox\npending -> published"]

  Product --> Projection
  Projection --> Cart
  Cart --> Order
  Order --> Payment
  Payment --> Outbox
```

## Product

`Product` no usa un enum textual. Su estado se modela con el booleano `active`.

```mermaid
stateDiagram-v2
  [*] --> Activo: createProduct()
  Activo --> Inactivo: updateProduct(active=false)
  Inactivo --> Activo: updateProduct(active=true)
```

### Lectura rapida

- Todo producto nuevo nace `active=true`.
- Un producto inactivo sigue existiendo, pero no deberia agregarse al carrito.

## ProductProjection

`ProductProjection` replica el estado minimo que `cart` necesita del catalogo.

```mermaid
stateDiagram-v2
  [*] --> Activa: seeder o sincronizacion
  Activa --> Inactiva: upsertProductProjection(active=false)
  Inactiva --> Activa: upsertProductProjection(active=true)
```

### Lectura rapida

- Su disponibilidad tambien depende del booleano `active`.
- `cart` valida esta proyeccion local antes de aceptar un item.

## Cart

```mermaid
stateDiagram-v2
  [*] --> Open: createCart()
  Open --> CheckedOut: checkout() publicado OK
  CheckedOut --> [*]
```

### Lectura rapida

- `Cart` nace en `open`.
- Mientras esta `open`, se pueden agregar, editar y borrar items.
- Cuando `checkout()` publica `checkout.initiated`, pasa a `checked_out`.
- Si la publicacion falla, el servicio hace rollback tecnico y el carrito vuelve a `open`.

## Order

```mermaid
stateDiagram-v2
  [*] --> Pending: createOrder() o createOrderFromCheckout()
  Pending --> Confirmed: applyPaymentConfirmation()
  Confirmed --> [*]
```

### Lectura rapida

- `Order` nace en `pending`.
- `orders` no persiste hoy un estado `failed`.
- Si la confirmacion falla por negocio, se emite el evento `order.confirmation_failed`, pero la orden sigue sin pasar a un nuevo estado persistido.

## Payment

```mermaid
stateDiagram-v2
  [*] --> Confirmed: confirmPaymentFromOrderCreated()
  Confirmed --> [*]
```

### Lectura rapida

- Hoy `Payment` solo tiene un estado persistido: `confirmed`.
- La creacion del pago ocurre automaticamente al consumir `order.created`.
- La idempotencia evita duplicar pagos ante redelivery del mismo evento.

## PaymentOutbox

```mermaid
stateDiagram-v2
  [*] --> Pending: createWithOutbox()
  Pending --> Published: publishPendingEvents()
  Published --> [*]
```

### Lectura rapida

- Cada evento saliente de `payments` entra primero en `pending`.
- Cuando el publisher lo envia a SNS correctamente, cambia a `published`.
- Si falla el envio, queda en `pending` y aumenta `attempts`.

## Entidades sin estado propio

### CartItem

`CartItem` no tiene un campo `status`. Solo existe o no existe dentro de un `Cart`.

```mermaid
flowchart LR
  A[No existe] --> B[Creado en cart_items]
  B --> C[Actualizado]
  B --> D[Eliminado]
  C --> D
```

### OrderItem

`OrderItem` tampoco tiene un campo `status`. Se crea como snapshot al momento de crear la orden.

```mermaid
flowchart LR
  A[No existe] --> B[Creado junto a Order]
```

## Notas importantes

- `order.confirmation_failed` es un evento de dominio, no un estado persistido de `Order`.
- `checkout.initiated`, `order.created` y `payment.confirmed` son eventos, no entidades.
- Si mas adelante quieres modelar cancelaciones, rechazos o expiraciones, ahi si tendria sentido ampliar los estados de `Cart`, `Order` y `Payment`.
