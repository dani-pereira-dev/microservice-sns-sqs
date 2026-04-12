import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceConfig } from '@shared/config/service-config.types';
import { ProductEvent } from './entities/product-event.entity';

type ProductsPgConnectionLib = {
  resolveProductsPostgresTls: (
    rawUrl: string,
    sslRejectUnauthorized: boolean,
  ) => { url: string; ssl?: { rejectUnauthorized: boolean } };
};

function requireProductsPgConnection(): ProductsPgConnectionLib {
  const candidates = [
    join(process.cwd(), 'scripts/lib/products-pg-connection.js'),
    join(__dirname, '../../../..', 'scripts/lib/products-pg-connection.js'),
    join(
      __dirname,
      '..',
      '..',
      '..',
      '..',
      '..',
      '..',
      'scripts',
      'lib',
      'products-pg-connection.js',
    ),
  ];

  for (const absolutePath of candidates) {
    if (existsSync(absolutePath)) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      return require(absolutePath) as ProductsPgConnectionLib;
    }
  }

  throw new Error(
    `No se encontró scripts/lib/products-pg-connection.js (TLS Postgres compartido). Rutas probadas: ${candidates.join(' | ')}`,
  );
}

const productsPg = requireProductsPgConnection();

/**
 * Conexión Postgres del event store (instancia alojada en AWS). Importar una sola vez en AppModule.
 * Las entidades se registran con TypeOrmModule.forFeature en ProductsModule.
 * TLS: `scripts/lib/products-pg-connection.js` (mismo criterio que el seeder).
 */
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<ServiceConfig, true>) => {
        const urlRaw = config.get('database.productsDatabaseUrl', {
          infer: true,
        });
        if (!urlRaw) {
          throw new Error(
            'PRODUCTS_DATABASE_URL must be set for the products microservice (Postgres event store on AWS).',
          );
        }

        const rejectUnauthorized = config.get(
          'database.productsDatabaseSslRejectUnauthorized',
          { infer: true },
        );

        const { url, ssl } = productsPg.resolveProductsPostgresTls(
          urlRaw,
          rejectUnauthorized,
        );

        const base = {
          type: 'postgres' as const,
          url,
          entities: [ProductEvent],
          synchronize: config.get('database.productsTypeormSynchronize', {
            infer: true,
          }),
        };

        return ssl !== undefined ? { ...base, ssl } : base;
      },
    }),
  ],
})
export class ProductsDatabaseModule {}
