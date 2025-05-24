import { HttpCode, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users.entitiy';
import { Repository } from 'typeorm';
import { CreateUserDto } from '../dtos/create-user.dto';
import { ExceptionsHandler } from '@nestjs/core/exceptions/exceptions-handler';
import { AccountsService } from 'src/accounts/services/accounts.service';
import { Account } from 'src/accounts/entities/account.entity';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private accountService: AccountsService
    ){}
  
    async createUser(createUserDto: CreateUserDto){
        if (await this.checkExistenceUser(createUserDto.identity_document) ||
            await this.accountService.checkExistenceAccount(createUserDto.account.email)){
            throw new HttpException('El usuario ya existe', HttpStatus.FORBIDDEN)
        }
        createUserDto.account.identity_document = createUserDto.identity_document
        try {
            let user = this.userRepository.create(createUserDto)
            await this.userRepository.save(user)
            await this.accountService.createAccount(createUserDto.account)
            return user
        } catch (error) {
            throw new HttpException('Registro fallido', HttpStatus.BAD_REQUEST)
        }
    }

    async checkExistenceUser(id: string){
        let userFind = await this.userRepository.findOneBy({identity_document: id})
        if (userFind == null){
            return false
        }
        return true
    }
}
