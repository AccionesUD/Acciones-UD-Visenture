// src/subscriptions/dto/subscribe.dto.ts
import { IsInt, IsString } from 'class-validator';

export class SubscribeDto {
  @IsInt()
  planId: number; // Coincide con plan_id (relación con PremiumPlan)

  @IsString()
  paymentToken: string; //Solo es para validación de pago (no se guarda en Subscription)
}
