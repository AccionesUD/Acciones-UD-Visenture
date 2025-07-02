import { Injectable, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Account } from "src/accounts/entities/account.entity";
import { Role } from "src/roles-permission/entities/role.entity";
import { Repository } from "typeorm";
import { NotificationsService } from "src/notifications/notifications.service";
import { User } from "src/users/users.entity";

@Injectable()
export class AdvisorService {
    private readonly logger = new Logger(AdvisorService.name);

    constructor(
        @InjectRepository(Role)
        private readonly roleRepo: Repository<Role>,

        @InjectRepository(Account)
        private readonly accountRepo: Repository<Account>,

        private readonly notificationsService: NotificationsService,
    ) { }

    async getCertifiedAdvisor(): Promise<User[]> {
        try {
            const comisionistaRole = await this.roleRepo.findOne({
                where: { name: 'comisionista' },
                relations: ['accounts', 'accounts.user']
            });

            if (!comisionistaRole) {
                return [];
            }

            return comisionistaRole.accounts
                .filter(account => account.user)
                .map(account => ({
                    identity_document: account.user.identity_document,
                    first_name: account.user.first_name,
                    last_name: account.user.last_name,
                    phone: account.user.phone
                } as User));
        } catch (error) {
            this.logger.error(`Error obteniendo comisionistas: ${error.message}`);
            throw new HttpException('Error al obtener comisionistas', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async assignAdvisor(userId: string, advisorId: string): Promise<{ success: boolean, message: string }> {
        try {
            // Verificar que el advisor es comisionista
            const advisor = await this.accountRepo.findOne({
                where: { identity_document: advisorId },
                relations: ['roles', 'user']
            });

            const client = await this.accountRepo.findOne({
                where: { identity_document: userId },
                relations: ['user'],
            });

            if (!advisor) {
                throw new HttpException('Comisionista no encontrado', HttpStatus.NOT_FOUND);
            }
            if (!client) {
                throw new HttpException('Cliente no encontrado', HttpStatus.NOT_FOUND);
            }

            const isAdvisor = advisor.roles.some(role => role.name === 'comisionista');
            if (!isAdvisor) {
                throw new HttpException('El usuario no es un comisionista', HttpStatus.BAD_REQUEST);
            }

            if (client.commissioner) {
                throw new HttpException('El cliente ya tiene un comisionista asignado. Primero debe eliminarlo.', HttpStatus.CONFLICT);
            }

            client.commissioner = advisor.id;
            await this.accountRepo.save(client);

            // Enviar notificación usando BullMQ
            try {
                await this.notificationsService.sendAdvisorAssignedNotification(
                    advisor,
                    client
                );
                this.logger.log(`Notificación encolada para el comisionista: ${advisor.id}`);
            } catch (notificationError) {
                this.logger.error('Error al encolar notificación', notificationError.stack);
                // No lanzamos excepción aquí para no fallar la operación principal
            }

            return {
                success: true,
                message: 'Comisionista asignado exitosamente'
            };
        } catch (error) {
            this.logger.error(`Error asignando comisionista: ${error.message}`);

            if (error instanceof HttpException) {
                throw error;
            }

            throw new HttpException('Error al asignar comisionista', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getAssignedAdvisor(clientId: string): Promise<{
        success: boolean,
        data?: {
            id: number,
            identity_document: string,
            first_name: string,
            last_name: string,
            phone: string
        },
        message?: string
    }> {
        try {
            // 1. Buscar la cuenta del cliente (con el commissioner)
            const clientAccount = await this.accountRepo.findOne({
                where: { identity_document: clientId },
                select: ['id', 'commissioner'] // Necesitamos ambos campos
            });

            if (!clientAccount) {
                return {
                    success: false,
                    message: 'Cliente no encontrado'
                };
            }

            // 2. Verificar si tiene comisionista asignado
            if (!clientAccount.commissioner) {
                return {
                    success: false,
                    message: 'El cliente no tiene comisionista asignado'
                };
            }

            // 3. Buscar la cuenta del comisionista con su usuario relacionado
            const advisorAccount = await this.accountRepo.findOne({
                where: { id: clientAccount.commissioner },
                relations: ['user'], // Cargar la relación con user
                select: ['id'] // Solo necesitamos el id del account
            });

            if (!advisorAccount?.user) {
                return {
                    success: false,
                    message: 'Comisionista asignado no encontrado en el sistema'
                };
            }

            // 4. Devolver la información del comisionista
            return {
                success: true,
                data: {
                    id: advisorAccount.id,
                    identity_document: advisorAccount.user.identity_document,
                    first_name: advisorAccount.user.first_name,
                    last_name: advisorAccount.user.last_name,
                    phone: advisorAccount.user.phone
                }
            };
        } catch (error) {
            this.logger.error(`Error obteniendo comisionista asignado: ${error.message}`);
            throw new HttpException(
                'Error al obtener comisionista asignado',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async unassignAdvisor(userId: string): Promise<{ success: boolean; message: string }> {
        try {
            const client = await this.accountRepo.findOne({
                where: { identity_document: userId },
                relations: ['user']
            });

            if (!client) {
                throw new HttpException('Cliente no encontrado', HttpStatus.NOT_FOUND);
            }

            if (!client.commissioner) {
                throw new HttpException('El cliente no tiene comisionista asignado', HttpStatus.BAD_REQUEST);
            }

            client.commissioner = 0;
            await this.accountRepo.save(client);

            return {
                success: true,
                message: 'Comisionista eliminado exitosamente'
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException('Error al eliminar el comisionista', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}