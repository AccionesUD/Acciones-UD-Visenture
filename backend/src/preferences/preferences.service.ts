import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm/dist/common/typeorm.decorators";
import { Account } from "src/accounts/entities/account.entity";
import { Repository } from "typeorm/repository/Repository";
import { PreferenceAccount } from "./entities/preference-account.entity";
import { SettingNotification } from "./entities/setting-notification.entity";
import { SettingBriefcase } from "./entities/setting-briefcase.entity";
import { SettingOperation } from "./entities/setting-operation.entity";

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
    ) {}

    async createDefaultPreferences(account: Account): Promise<PreferenceAccount> {
        const settingNotification = this.settingNotificationRepo.create();
        const settingOperation = this.settingOperationRepo.create();
        const settingBriefcase = this.settingBriefcaseRepo.create();

        await this.settingNotificationRepo.save(settingNotification);
        await this.settingOperationRepo.save(settingOperation);
        await this.settingBriefcaseRepo.save(settingBriefcase);
        
        const preference = this.preferenceRepo.create({
            account: account,
            setting_notification: settingNotification,
            setting_operation: settingOperation,
            setting_briefcase: settingBriefcase
        });

        return this.preferenceRepo.save(preference);
    }
    
}