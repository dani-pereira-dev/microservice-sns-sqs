# Infra: cola SQS para la proyección Dynamo de `products`

El microservicio `products` puede consumir los mismos eventos de catálogo que ya publica el outbox relay (`product.created` / `product.updated` en `AWS_SNS_PRODUCT_EVENTS_TOPIC_ARN`) mediante una **segunda cola SQS** suscrita a ese topic (fan-out junto a `AWS_SQS_CART_PRODUCT_EVENTS_QUEUE_URL`).

## Cola principal y DLQ (recomendado)

1. Crear una cola DLQ (por ejemplo `products-projection-dlq`).
2. Crear la cola de trabajo (por ejemplo `products-projection`) con política de reintento hacia la DLQ (`maxReceiveCount` típico entre 3 y 5).
3. Copiar la **URL** de la cola de trabajo en `AWS_SQS_PRODUCTS_PROJECTION_QUEUE_URL`.

Los detalles exactos (`RedrivePolicy`, ARN de la DLQ) dependen de si usás la consola de AWS, CloudFormation, CDK u OpenTofu; el patrón es el estándar de SQS.

## Suscripción SNS → SQS

- En el topic `AWS_SNS_PRODUCT_EVENTS_TOPIC_ARN`, crear una **suscripción** adicional con protocolo `sqs` apuntando al ARN de la cola `products-projection`.
- La cola debe permitir que SNS envíe mensajes (política de recurso en la cola, igual que la cola del `cart`).

## Consumer en este repo

Con `AWS_SQS_PRODUCTS_PROJECTION_QUEUE_URL` definida, el módulo `ProductsProjectionSyncModule` arranca el polling SQS y hace **Put** idempotente en la tabla `PRODUCTS_PROJECTION_TABLE_NAME`.

## Alternativa: Lambda

Podés apuntar la misma cola a una **función Lambda** en lugar del proceso Nest:

- Trigger: SQS en esa cola.
- IAM mínima sugerida: `sqs:ReceiveMessage`, `sqs:DeleteMessage`, `sqs:GetQueueAttributes` en la cola; `dynamodb:PutItem` (y opcionalmente `DescribeTable`) en la tabla de proyección.
- El cuerpo del mensaje es el mismo envoltorio SNS→SQS que ya parsea `SqsMessageConsumer` (JSON con `Message` que contiene el envelope `eventType` + `payload`).

En ese caso no hace falta levantar el consumer Nest; podés dejar `AWS_SQS_PRODUCTS_PROJECTION_QUEUE_URL` vacía en el servicio `products` y consumir solo desde Lambda.
