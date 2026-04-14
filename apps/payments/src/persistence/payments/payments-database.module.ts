import { existsSync } from "node:fs";
import { join } from "node:path";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ServiceConfig } from "@shared/config/service-config.types";
import { Payment } from "./payment.entity";

type PgTlsLib = {
  resolveProductsPostgresTls: (
    rawUrl: string,
    sslRejectUnauthorized: boolean,
  ) => { url: string; ssl?: { rejectUnauthorized: boolean } };
};

function requirePgTlsLib(): PgTlsLib {
  const candidates = [
    join(process.cwd(), "scripts/lib/products-pg-connection.js"),
    join(__dirname, "../../../../../scripts/lib/products-pg-connection.js"),
  ];

  for (const absolutePath of candidates) {
    if (existsSync(absolutePath)) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      return require(absolutePath) as PgTlsLib;
    }
  }

  throw new Error(
    `No se encontró scripts/lib/products-pg-connection.js. Rutas probadas: ${candidates.join(" | ")}`,
  );
}

const pgTls = requirePgTlsLib();

/**
 * Postgres + TypeORM para `payments` (outbox: solo `published_at` null hasta SNS, como `product_events`).
 * Esquema con `synchronize` en dev (`PAYMENTS_TYPEORM_SYNCHRONIZE`).
 */
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<ServiceConfig, true>) => {
        const urlRaw = config.get("database.paymentsDatabaseUrl", {
          infer: true,
        });
        if (!urlRaw) {
          throw new Error(
            "PAYMENTS_DATABASE_URL debe estar definida para el microservicio payments (Postgres + TypeORM).",
          );
        }

        const rejectUnauthorized = config.get(
          "database.paymentsDatabaseSslRejectUnauthorized",
          { infer: true },
        );

        const { url, ssl } = pgTls.resolveProductsPostgresTls(
          urlRaw,
          rejectUnauthorized,
        );

        const base = {
          type: "postgres" as const,
          url,
          entities: [Payment],
          synchronize: config.get("database.paymentsTypeormSynchronize", {
            infer: true,
          }),
        };

        return ssl !== undefined ? { ...base, ssl } : base;
      },
    }),
  ],
})
export class PaymentsDatabaseModule {}
