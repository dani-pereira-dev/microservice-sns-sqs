# Migracion de notification a Lambda con Serverless

## Objetivo

Mover el envio de email fuera del microservicio `notification` y ejecutarlo con una Lambda conectada a la cola `AWS_SQS_NOTIFICATION_PAYMENT_CONFIRMED_QUEUE_URL`.

El flujo final queda asi:

1. `payments` publica `payment.confirmed` en SNS.
2. SNS entrega el mensaje a la cola SQS de notifications.
3. La Lambda consume la cola SQS.
4. La Lambda parsea el envelope SNS -> SQS.
5. La Lambda envia el email con Resend.

## Que se implemento en este repo

- `lambda/notification-email/src/handler.ts`
  Consumer productivo para SQS con `partial batch failure`.
- `serverless.yml`
  Definicion declarativa de la Lambda, IAM y trigger SQS.
- `serverless.helpers.js`
  Convierte la URL de SQS en ARN para reutilizar la variable que ya tenias.
- `scripts/run-serverless.js`
  Carga `.env` y `.env.local` antes de invocar Serverless.
- `scripts/build-notification-lambda.js`
  Bundling con `esbuild` antes de empaquetar o desplegar.

## Variables necesarias

Completa estas variables en `.env.local` o `.env`:

```env
AWS_REGION=us-east-2
AWS_SQS_NOTIFICATION_PAYMENT_CONFIRMED_QUEUE_URL=https://...
RESEND_API_KEY=re_...
NOTIFICATION_EMAIL_FROM=onboarding@resend.dev
NOTIFICATION_DEFAULT_TO_EMAIL=tu-email@dominio.com
NOTIFICATION_LAMBDA_FUNCTION_NAME=notification-payment-confirmed
```

## Paso 1: verificar credenciales AWS CLI

```bash
aws sts get-caller-identity
```

## Paso 2: package local

```bash
npm run package:notification:lambda
```

Esto hace:

- `dist-lambda/notification-email/index.js`
- `.serverless/` con el package generado por Serverless

## Paso 3: desplegar la Lambda

```bash
npm run deploy:notification:lambda
```

El deploy hace estas tareas:

1. recompila el handler
2. empaqueta la Lambda
3. crea o actualiza la funcion
4. crea o actualiza el role IAM administrado por CloudFormation
5. crea o actualiza el event source mapping con:
   - `batch-size=10`
   - `maximum-batching-window-in-seconds=5`
   - `ReportBatchItemFailures`

## Nota sobre Serverless

Se dejo `serverless` en la linea `v3` porque `v4` exige login o licencia incluso para operaciones locales. Para este repo educativo, `v3` reduce friccion y sigue siendo suficiente para aprender IaC y despliegue declarativo.

## Paso 4: validar

1. Crear una orden en `orders`.
2. Confirmar el pago en `payments`.
3. Verificar:
   - `payments` publica el evento
   - la Lambda se dispara
   - llega el email

CloudWatch logs:

```bash
aws logs tail "/aws/lambda/$NOTIFICATION_LAMBDA_FUNCTION_NAME" --follow --region "$AWS_REGION"
```

## Paso 5: ver informacion o eliminar

Ver stack y endpoints:

```bash
npm run info:notification:lambda
```

Eliminar recursos si queres desmontar:

```bash
npm run remove:notification:lambda
```

## Paso 6: cutover

Cuando la Lambda ya este funcionando, usa `npm run start:dev` solo para `orders` y `payments`.

Eso ya quedo alineado en este repo.

## Notas de produccion

- La Lambda usa `partial batch failure`, asi que solo reintenta los mensajes fallidos.
- El codigo soporta tanto mensajes SNS envueltos en SQS como mensajes raw.
- `serverless.yml` deriva el ARN de la cola desde `AWS_SQS_NOTIFICATION_PAYMENT_CONFIRMED_QUEUE_URL`, asi no duplicas URL y ARN en tu `.env`.
- Si en el futuro agregas `recipientEmail` al evento, la Lambda ya esta preparada para usarlo; si no viene, usa `NOTIFICATION_DEFAULT_TO_EMAIL`.
