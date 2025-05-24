import { Repository } from "typeorm";
import { Account } from "../entities/account.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { CreateAccountDto } from "../dto/create-account.dto";
import { HttpException, HttpStatus } from "@nestjs/common";
import { identity } from "rxjs";
import { HashingProvider } from "src/auth/providers/bcrypt.provider";

export class AccountsService{
    constructor(
        @InjectRepository(Account)
        private accountRepository: Repository<Account>,
        private hashingProvider: HashingProvider
    ){}

    async createAccount(createAccountDto: CreateAccountDto){
        let account = this.accountRepository.create(createAccountDto)
        account.password = await this.hashingProvider.hashPassword(account.password)

        try {
            await this.accountRepository.save(account)
        } catch (error) {
            throw new HttpException('error', HttpStatus.BAD_REQUEST)
        }
    }

    async checkExistenceAccount(email: string){
        let findAccount = await this.accountRepository.findOneBy({email})
        if (findAccount == null){
            return false
        }
        return true
    }
    
}