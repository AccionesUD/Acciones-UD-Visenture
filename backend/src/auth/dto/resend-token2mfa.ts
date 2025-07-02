import { IsEmail, IsNotEmpty } from "class-validator";


export class ResendToken2fmadDto {
    @IsEmail()
    @IsNotEmpty()
    email: string
}