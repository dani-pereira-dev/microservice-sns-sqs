import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { createServiceConfig } from "@shared/config/create-service-config";
import { MessagingModule } from "@shared/messaging/messaging.module";
import { PaymentsModule } from "./domain/payments.module";
import { PaymentsDatabaseModule } from "./persistence/payments/payments-database.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: [".env.local", ".env"],
      load: [() => createServiceConfig("payments", 3002)],
    }),
    MessagingModule.register({
      serviceName: "payments",
    }),
    PaymentsDatabaseModule,
    PaymentsModule,
  ],
})
export class AppModule {}
