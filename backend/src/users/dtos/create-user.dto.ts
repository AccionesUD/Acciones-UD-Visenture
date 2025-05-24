import {
  IsNotEmpty,
  IsPhoneNumber,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  Validate,
  ValidateNested,
} from 'class-validator';
import { IsDateAdult } from './validator-is-date-adult';

import { Type } from 'class-transformer';
import { CreateAccountDto } from 'src/accounts/dtos/create-account.dto';

export class CreateUserDto {
  @Matches(/^\d{6,10}$/, {
    message: 'El ID debe contener entre 6 y 10 caracteres',
  })
  @IsNotEmpty({ message: 'El campo de identificacion es requerido' })
  identity_document: string;

  @IsString()
  @MaxLength(50, {
    message: 'El campo nombre debe contener maximo 50 caracteres',
  })
  @MinLength(3, {
    message: 'El campo nombre debe contener minimo 3 caracteres',
  })
  @IsNotEmpty({ message: 'El campo nombre es requerido' })
  first_name: string;

  @IsString()
  @MaxLength(50, {
    message: 'El campo apellido debe contener maximo 50 caracteres',
  })
  @MinLength(3, {
    message: 'El campo apellido debe contener minimo 3 caracteres',
  })
  @IsNotEmpty({ message: 'El campo apellido es requerido' })
  last_name: string;

  @Validate(IsDateAdult, { message: 'La fecha de naciemiento es invalida' })
  birthdate: Date;

  @IsString()
  @MaxLength(80, {
    message: 'El campo direccion debe contener maximo 80 caracteres',
  })
  @IsNotEmpty({ message: 'El campo direccion es requerido' })
  address: string;

  @IsPhoneNumber('CO', { message: 'El numero de telefono es invalido' })
  @IsNotEmpty({ message: 'El campo telefono es requerido' })
  phone: string;

  @IsNotEmpty({ message: 'Los campos de datos de cuenta son requeridos' })
  @Type(() => CreateAccountDto)
  @ValidateNested()
  account: CreateAccountDto;
}
