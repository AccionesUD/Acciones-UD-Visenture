import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsStrongPassword,
  MaxLength,
} from 'class-validator';
import { User } from 'src/users/users.entity';

export class CreateAccountDto {
  @IsNotEmpty({ message: 'El campo email es requerido' })
  @IsEmail(undefined, { message: 'El campo debe ser de tipo email' })
  @MaxLength(30, {
    message: 'El campo email no puede exceder los 30 caracteres',
  })
  email;

  @IsStrongPassword(undefined, {
    message:
      'La contraseña debe contener por lo menos: MAYUSCULAS, NUMEROS Y CARACTERES ESPECIALES',
  })
  @MaxLength(50)
  password;

  @IsOptional()
  @IsNumber()
  commissioner_id?: number;

  @IsOptional()
  user: User

  @IsOptional()
  alpaca_account_id: string
}
