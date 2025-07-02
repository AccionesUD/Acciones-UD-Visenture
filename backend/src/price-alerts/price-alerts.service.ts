// src/price-alerts/price-alerts.service.ts
import { 
  Injectable, 
  NotFoundException, 
  ForbiddenException, 
  BadRequestException,
  ConflictException,
  InternalServerErrorException 
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PriceAlert, AlertDirection, AlertStatus } from 'src/price-alerts/entitites/price-alert.entity';
import { CreatePriceAlertDto } from './dto/create-price-alert.dto';
import { Account } from 'src/accounts/entities/account.entity';
import { Share } from 'src/shares/entities/shares.entity';
import { SubscriptionsService } from 'src/subscriptions/services/subscriptions.service';
import { PriceAlertResponseDto } from './dto/price-alert-responde.dto';

@Injectable()
export class PriceAlertsService {
    constructor(
        @InjectRepository(PriceAlert)
        private readonly alertRepository: Repository<PriceAlert>,
        @InjectRepository(Account)
        private readonly accountRepository: Repository<Account>,
        @InjectRepository(Share)
        private readonly shareRepository: Repository<Share>,
        private readonly subscriptionsService: SubscriptionsService
    ) { }

    async create(accountId: string, createDto: CreatePriceAlertDto): Promise<PriceAlert> {
        try {
            // Buscar la cuenta primero
            const account = await this.accountRepository.findOneBy({ identity_document: accountId });
            if (!account) {
                throw new NotFoundException({
                    statusCode: 404,
                    message: 'Cuenta no encontrada',
                    error: 'Not Found'
                });
            }

            // Verificar que el usuario tiene suscripción premium activa
            const isPremium = await this.subscriptionsService.hasActiveSubscription(account.id);
            if (!isPremium) {
                throw new ForbiddenException({
                    statusCode: 403,
                    message: 'Solo usuarios premium pueden crear alertas de precio',
                    error: 'Forbidden'
                });
            }

            const share = await this.shareRepository.findOneBy({ symbol: createDto.share_id });
            if (!share) {
                throw new NotFoundException({
                    statusCode: 404,
                    message: 'Acción no encontrada',
                    error: 'Not Found'
                });
            }

            // Verificar si ya existe una alerta similar activa
            const existingAlert = await this.alertRepository.findOne({
                where: {
                    account: { identity_document: accountId },
                    share: { symbol: createDto.share_id },
                    target_price: createDto.target_price,
                    direction: createDto.direction as AlertDirection,
                    status: AlertStatus.ACTIVE
                }
            });

            if (existingAlert) {
                throw new ConflictException({
                    statusCode: 409,
                    message: 'Ya existe una alerta activa con estos parámetros',
                    error: 'Conflict'
                });
            }

            const alert = this.alertRepository.create({
                account,
                share,
                target_price: createDto.target_price,
                direction: createDto.direction as AlertDirection,
                is_recurring: createDto.is_recurring || false
            });

            const savedAlert = await this.alertRepository.save(alert);
            return savedAlert;

        } catch (error) {
            if (error instanceof ForbiddenException || 
                error instanceof NotFoundException || 
                error instanceof ConflictException) {
                throw error;
            }
            
            throw new InternalServerErrorException({
                statusCode: 500,
                message: 'Error al crear la alerta de precio',
                error: 'Internal Server Error',
                details: error.message
            });
        }
    }

    async findAllActive(): Promise<PriceAlert[]> {
        try {
            const alerts = await this.alertRepository.find({
                where: { status: AlertStatus.ACTIVE },
                relations: ['account', 'share', 'share.stock']
            });

            return alerts;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            
            throw new InternalServerErrorException({
                statusCode: 500,
                message: 'Error al obtener las alertas activas',
                error: 'Internal Server Error',
                details: error.message
            });
        }
    }

    async updateStatus(id: number, status: AlertStatus): Promise<{ message: string }> {
        try {
            const alert = await this.alertRepository.findOneBy({ id });
            
            if (!alert) {
                throw new NotFoundException({
                    statusCode: 404,
                    message: 'Alerta no encontrada',
                    error: 'Not Found'
                });
            }

            if (alert.status === status) {
                throw new BadRequestException({
                    statusCode: 400,
                    message: `La alerta ya está en estado ${status}`,
                    error: 'Bad Request'
                });
            }

            const updateResult = await this.alertRepository.update(id, {
                status,
                triggered_at: status === AlertStatus.TRIGGERED ? new Date() : undefined
            });

            if (updateResult.affected === 0) {
                throw new InternalServerErrorException({
                    statusCode: 500,
                    message: 'No se pudo actualizar el estado de la alerta',
                    error: 'Internal Server Error'
                });
            }

            return { message: `Estado de la alerta actualizado a ${status} correctamente` };
        } catch (error) {
            if (error instanceof NotFoundException || 
                error instanceof BadRequestException) {
                throw error;
            }
            
            throw new InternalServerErrorException({
                statusCode: 500,
                message: 'Error al actualizar el estado de la alerta',
                error: 'Internal Server Error',
                details: error.message
            });
        }
    }

    async findAllByAccount(accountId: string): Promise<PriceAlertResponseDto[]> {
    try {
        const alerts = await this.alertRepository.find({
            where: { 
                account: { identity_document: accountId },
                status: AlertStatus.ACTIVE
            },
            relations: ['share', 'share.stock'],
            order: { created_at: 'DESC' }
        });

        return alerts.map(alert => ({
            id: alert.id,
            symbol: alert.share.symbol,
            name: alert.share.name_share,
            target_price: alert.target_price,
            direction: alert.direction,
            status: alert.status,
            is_recurring: alert.is_recurring,
            created_at: alert.created_at,
            triggered_at: alert.triggered_at,
            market_name: alert.share.stock?.name_market
        }));
    } catch (error) {
        throw new InternalServerErrorException({
            statusCode: 500,
            message: 'Error al obtener las alertas del usuario',
            error: 'Internal Server Error',
            details: error.message
        });
    }
}

    async deleteAlert(accountId: string, alertId: number): Promise<void> {
        try {
            // Verificar que la alerta pertenece al usuario
            const alert = await this.alertRepository.findOne({
                where: { 
                    id: alertId,
                    account: { identity_document: accountId }
                }
            });

            if (!alert) {
                throw new NotFoundException({
                    statusCode: 404,
                    message: 'Alerta no encontrada o no pertenece al usuario',
                    error: 'Not Found'
                });
            }

            // Eliminar la alerta
            //const deleteResult = await this.alertRepository.delete(alertId);
            // Alternativa: Cambiar estado a CANCELLED
            await this.alertRepository.update(alertId, { status: AlertStatus.CANCELLED });

            // if (deleteResult.affected === 0) {
            //     throw new InternalServerErrorException({
            //         statusCode: 500,
            //         message: 'No se pudo eliminar la alerta',
            //         error: 'Internal Server Error'
            //     });
            // }
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            
            throw new InternalServerErrorException({
                statusCode: 500,
                message: 'Error al eliminar la alerta',
                error: 'Internal Server Error',
                details: error.message
            });
        }
    }
}