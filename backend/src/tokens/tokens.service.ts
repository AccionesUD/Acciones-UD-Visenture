// src/tokens/tokens.service.ts
import { Injectable, RequestTimeoutException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { tokenEmail } from './entities/token-email.entity';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { GenerateToken2MFA } from './services/generate-token.provider';
import { typesToken} from './enums/tokenType.enum';
import { types } from 'util';

@Injectable()
export class TokensService {
  constructor(
    @InjectRepository(tokenEmail)
    private tokenEmail: Repository<tokenEmail>,
    private configService: ConfigService
  ) {}

  async storeToken(email: string, token: string, typeToken: typesToken){
    const expirationMinutes = this.configService.get('2MFA_EXPIRATION_TOKEN');
    const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000);
    //const typeToken = typesToken.LOGIN2FMA

    const loginToken = this.tokenEmail.create({
      email,
      token,
      expiresAt,
      typeToken
    });

    try {
      await this.tokenEmail.save(loginToken);
    } catch(error){
      throw new RequestTimeoutException(error, { description: 'Se presento un error en la operacion, intente luego' });
    }
   
  }

  // src/tokens/tokens.service.ts
  async justValidateToken(email: string, token: string, typeToken: typesToken): Promise<boolean> {
    const loginToken = await this.tokenEmail.findOne({
      where: { email, token, typeToken }, 
    });

    if (!loginToken) return false;


    if (loginToken.expiresAt < (new Date())) {
      console.log(loginToken.expiresAt, new Date());
      return false;
    }
    return true;
  }


  async validateToken(email: string, token: string, typeToken: typesToken): Promise<boolean> {
    const loginToken = await this.tokenEmail.findOne({
      where: { email, token, typeToken }, 
    });

    if (!loginToken) return false;

    const now = new Date();
    if (loginToken.expiresAt < now) {
      await this.tokenEmail.delete({ id: loginToken.id }); // Eliminar el token expirado
      return false;
    }

    // Si el token es válido y no ha expirado, lo eliminamos
    // para que no pueda ser reutilizado
    await this.tokenEmail.delete({ id: loginToken.id });
    return true;
  }
}
// src/tokens/tokens.service.ts
import { Injectable, RequestTimeoutException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { tokenEmail } from './entities/token-email.entity';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { GenerateToken2MFA } from './services/generate-token.provider';
import { typesToken} from './enums/tokenType.enum';
import { types } from 'util';

@Injectable()
export class TokensService {
  constructor(
    @InjectRepository(tokenEmail)
    private tokenEmail: Repository<tokenEmail>,
    private configService: ConfigService
  ) {}

  async storeToken(email: string, token: string, typeToken: typesToken){
    const expirationMinutes = this.configService.get('MFA_EXPIRATION_TOKEN');
    const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000);
    //const typeToken = typesToken.LOGIN2FMA

    const loginToken = this.tokenEmail.create({
      email,
      token,
      expiresAt,
      typeToken
    });

    try {
      await this.tokenEmail.save(loginToken);
    } catch(error){
      throw new RequestTimeoutException(error, { description: 'Se presento un error en la operacion, intente luego' });
    }
   
  }

  // src/tokens/tokens.service.ts
  async justValidateToken(email: string, token: string, typeToken: typesToken): Promise<boolean> {
    const loginToken = await this.tokenEmail.findOne({
      where: { email, token, typeToken }, 
    });

    if (!loginToken) return false;


    if (loginToken.expiresAt < (new Date())) {
      console.log(loginToken.expiresAt, new Date());
      return false;
    }
    return true;
  }


  async validateToken(email: string, token: string, typeToken: typesToken): Promise<boolean> {
    const loginToken = await this.tokenEmail.findOne({
      where: { email, token, typeToken }, 
    });

    if (!loginToken) return false;

    const now = new Date();
    if (loginToken.expiresAt < now) {
      await this.tokenEmail.delete({ id: loginToken.id }); // Eliminar el token expirado
      return false;
    }

    // Si el token es válido y no ha expirado, lo eliminamos
    // para que no pueda ser reutilizado
    await this.tokenEmail.delete({ id: loginToken.id });
    return true;
  }
}
