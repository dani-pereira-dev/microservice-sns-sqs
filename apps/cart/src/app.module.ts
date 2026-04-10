import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { createServiceConfig } from "@shared/config/create-service-config";
import { MessagingModule } from "@shared/messaging/messaging.module";
import { CartModule } from "./cart/domain/cart.module";
import { SyncModule } from "./sync/sync.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: [".env.local", ".env"],
      load: [() => createServiceConfig("cart", 3005)],
    }),
    MessagingModule.register({
      serviceName: "cart",
    }),
    CartModule,
    SyncModule,
  ],
})
export class AppModule {}
