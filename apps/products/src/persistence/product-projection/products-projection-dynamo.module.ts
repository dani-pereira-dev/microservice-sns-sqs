import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DescribeTableCommand,
  DynamoDBClient,
} from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { ServiceConfig } from '@shared/config/service-config.types';
import { PRODUCTS_PROJECTION_DYNAMODB_DOCUMENT_CLIENT } from './products-projection-dynamo.constants';
import { ProductProjectionRepository } from './product-projection.repository';

const logger = new Logger('ProductsProjectionDynamoModule');

/**
 * Cliente Dynamo para la proyección de productos en `products`.
 * No importa `ConfigModule`: en `AppModule` ya está `ConfigModule.forRoot({ isGlobal: true })`.
 */
@Module({
  providers: [
    {
      provide: PRODUCTS_PROJECTION_DYNAMODB_DOCUMENT_CLIENT,
      inject: [ConfigService],
      useFactory: async (config: ConfigService<ServiceConfig, true>) => {
        const messaging = config.get('messaging', { infer: true });
        const baseClient = new DynamoDBClient({
          region: messaging.region,
          endpoint: messaging.endpoint || undefined,
        });
        const documentClient = DynamoDBDocumentClient.from(baseClient);

        const endpointSuffix = messaging.endpoint
          ? `, endpoint=${messaging.endpoint}`
          : '';
        const table = config
          .get('database.productsProjectionTableName', { infer: true })
          ?.trim();

        if (!table) {
          logger.warn(
            `Cliente DynamoDB listo (region=${messaging.region}${endpointSuffix}). PRODUCTS_PROJECTION_TABLE_NAME no está definida: los GET de productos fallarán hasta configurarla.`,
          );
          return documentClient;
        }

        try {
          await baseClient.send(new DescribeTableCommand({ TableName: table }));
          logger.log(
            `DynamoDB: conexión y tabla "${table}" OK (region=${messaging.region}${endpointSuffix}).`,
          );
        } catch (err) {
          logger.warn(
            `DynamoDB: cliente listo pero DescribeTable falló para "${table}" (${err instanceof Error ? err.message : String(err)}). Revisá nombre de tabla, credenciales y red.`,
          );
        }

        return documentClient;
      },
    },
    ProductProjectionRepository,
  ],
  exports: [
    PRODUCTS_PROJECTION_DYNAMODB_DOCUMENT_CLIENT,
    ProductProjectionRepository,
  ],
})
export class ProductsProjectionDynamoModule {}
