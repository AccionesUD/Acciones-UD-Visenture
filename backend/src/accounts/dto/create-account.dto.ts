import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsStrongPassword, Matches, maxLength, MaxLength, MinLength } from "class-validator"
import { Account } from "../entities/account.entity"

export class CreateAccountDto {  
    @IsNotEmpty({message: 'El campo email es requerido'})
    @IsEmail(undefined, {message: 'El campo debe ser de tipo email'})
    @MaxLength(30, {message: 'El campo email no puede exceder los 30 caracteres'})
    email

    @IsStrongPassword(undefined, {message: 'La contraseña debe contener por lo menos: MAYUSCULAS, NUMEROS Y CARACTERES ESPECIALES'})
    @MaxLength(50)
    password

    @IsOptional()
    @IsNumber()
    commissioner_id? : number

    @IsOptional()
    identity_document: string
}