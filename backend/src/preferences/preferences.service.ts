import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Account } from "src/accounts/entities/account.entity";
import { Repository } from "typeorm";
import { PreferenceAccount } from "./entities/preference-account.entity";
import { SettingNotification } from "./entities/setting-notification.entity";
import { SettingBriefcase } from "./entities/setting-briefcase.entity";
import { SettingOperation } from "./entities/setting-operation.entity";
import { SettingMailing } from "./entities/setting-mailing.entity";

@Injectable()
export class PreferencesService {
    constructor(
        @InjectRepository(Account)
        private readonly accountRepo: Repository<Account>,
        @InjectRepository(PreferenceAccount)
        private readonly preferenceRepo: Repository<PreferenceAccount>,
        @InjectRepository(SettingNotification)
        private readonly settingNotificationRepo: Repository<SettingNotification>,
        @InjectRepository(SettingOperation)
        private readonly settingOperationRepo: Repository<SettingOperation>,
        @InjectRepository(SettingBriefcase)
        private readonly settingBriefcaseRepo: Repository<SettingBriefcase>,
        @InjectRepository(SettingMailing)
        private readonly settingMailingRepo: Repository<SettingMailing>,
    ) { }

    async createDefaultPreferences(account: Account): Promise<PreferenceAccount> {
        const settingNotification = this.settingNotificationRepo.create();
        const settingOperation = this.settingOperationRepo.create();
        const settingBriefcase = this.settingBriefcaseRepo.create();
        const settingMailing = this.settingMailingRepo.create();

        await this.settingNotificationRepo.save(settingNotification);
        await this.settingOperationRepo.save(settingOperation);
        await this.settingBriefcaseRepo.save(settingBriefcase);
        await this.settingMailingRepo.save(settingMailing);

        const preference = this.preferenceRepo.create({
            account: account,
            setting_notification: settingNotification,
            setting_operation: settingOperation,
            setting_briefcase: settingBriefcase,
            setting_mailing: settingMailing
        });

        return this.preferenceRepo.save(preference);
    }

    // Método auxiliar para asegurar preferencias
    private async ensurePreferencesExist(account: Account): Promise<Account> {
        if (!account.preference) {
            account.preference = await this.createDefaultPreferences(account);
            await this.accountRepo.save(account);
        }
        return account;
    }

    async getNotificationsSettings(accountId: string): Promise<SettingNotification> {
        const account = await this.accountRepo.findOne({
            where: { identity_document: accountId },
            relations: ['preference', 'preference.setting_notification']
        });

        if (!account) {
            throw new NotFoundException('Cuenta no encontrada');
        }

        // Asegurar que existan preferencias
        const accountWithPreferences = await this.ensurePreferencesExist(account);
        
        return accountWithPreferences.preference.setting_notification;
    }

    async updateNotificationsSettings(
        accountId: string,
        updateDto: Partial<SettingNotification>
    ): Promise<SettingNotification> {
        const settings = await this.getNotificationsSettings(accountId);
        Object.assign(settings, updateDto);
        settings.last_change_time = new Date();
        return this.settingNotificationRepo.save(settings);
    }

    async getMailingSettings(accountId: string): Promise<SettingMailing> {
        const account = await this.accountRepo.findOne({
            where: { identity_document: accountId },
            relations: ['preference', 'preference.setting_mailing']
        });

        if (!account) {
            throw new NotFoundException('Cuenta no encontrada');
        }

        // Asegurar que existan preferencias
        const accountWithPreferences = await this.ensurePreferencesExist(account);
        
        return accountWithPreferences.preference.setting_mailing;
    }

    async updateMailingSettings(
        accountId: string,
        updateDto: Partial<SettingMailing>
    ): Promise<SettingMailing> {
        const settings = await this.getMailingSettings(accountId);

        // Actualizar solo los campos permitidos
        if (updateDto.email_enabled !== undefined) {
            settings.email_enabled = updateDto.email_enabled;
        }
        if (updateDto.sms_enabled !== undefined) {
            settings.sms_enabled = updateDto.sms_enabled;
        }
        if (updateDto.whatsapp_enabled !== undefined) {
            settings.whatsapp_enabled = updateDto.whatsapp_enabled;
        }
        if (updateDto.phone_number !== undefined) {
            settings.phone_number = updateDto.phone_number;
        }

        settings.last_change_time = new Date();

        return this.settingMailingRepo.save(settings);
    }
    
    async getAccountsWithMarketNotifications(): Promise<Account[]> {
        return this.accountRepo.find({
            where: {
                preference: {
                    setting_notification: {
                        notify_open_close_markets: true
                    }
                }
            },
            relations: [
                'preference',
                'preference.setting_notification'
            ]
        });
    }
}