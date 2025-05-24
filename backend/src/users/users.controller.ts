import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateUserDto } from './dtos/create-user.dto';
import { UsersService } from './services/users.service';

@Controller('users')
export class UsersController {

    constructor( 
        private readonly usersService: UsersService
     ){}

    @Post()
    public createUser(@Body() createUserDto: CreateUserDto){
        return this.usersService.createUser(createUserDto)
    }
}
