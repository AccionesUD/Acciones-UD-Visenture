import { Injectable, NotFoundException, Logger } from "@nestjs/common";
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
        const comisionistaRole = await this.roleRepo.findOne({
            where: { name: 'comisionista' },
            relations: ['accounts', 'accounts.user']
        });

        if (!comisionistaRole) return [];

        return comisionistaRole.accounts
        .filter(account => account.user) 
        .map(account => ({
            identity_document: account.user.identity_document,
            first_name: account.user.first_name,
            last_name: account.user.last_name,
            phone: account.user.phone

        } as User));
    }

    async assignAdvisor(userId: string, advisorId: string): Promise<Account> {
        // Verificar que el advisor es comisionista
        const advisor = await this.accountRepo.findOne({
            where: { identity_document: advisorId },
            relations: ['roles', 'user']
        });

        const client = await this.accountRepo.findOne({
            where: { identity_document: userId },
            relations: ['user'],
        });

        if (!advisor) throw new NotFoundException('Comisionista no encontrado');
        if (!client) throw new NotFoundException('Cliente no encontrado');

        const isAdvisor = advisor.roles.some(role => role.name === 'comisionista');
        if (!isAdvisor) throw new NotFoundException('El usuario no es un comisionista');

        if (client.commissioner) {
            throw new Error('El cliente ya tiene un comisionista asignado. Primero debe eliminarlo.');
        } else {
            client.commissioner = advisor.id;
        }

        const updatedClient = await this.accountRepo.save(client);

        // Enviar notificación usando BullMQ
        try {
            await this.notificationsService.sendAdvisorAssignedNotification(
                advisor,
                updatedClient
            );
            this.logger.log(`Notificación encolada para el comisionista: ${advisor.id}`);
        } catch (error) {
            this.logger.error('Error al encolar notificación', error.stack);
        }

        return updatedClient; // Cambiar este return ya que no necesito el que me despliegue todo el cliente, solo que avise que se ha asignado el comisionista en el frontend
    }

    async getAssignedAdvisor(clientId: string): Promise<User | null> {
    const relation = await this.accountRepo.findOne({
      where: { identity_document: clientId},
      relations: ['user']
    });
    if (!relation || !relation.user) return null;
    const advisor = relation.user;

    return {
      identity_document: advisor.identity_document,
      first_name: advisor.first_name,
      last_name: advisor.last_name,
      phone: advisor.phone,
    } as User;
  }
}