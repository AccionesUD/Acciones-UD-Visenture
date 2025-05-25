/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, RequestTimeoutException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: Transporter;

  constructor(
    private readonly configService: ConfigService
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
 
      this.transporter = nodemailer.createTransport({
        service: configService.get('MAIL_SERVICE'),
        auth: {
          user: this.configService.get('MAIL_ADDRESS'),
          pass: this.configService.get('MAIL_PASS'), // Contraseña de aplicación de Gmail
        },
      }); 
  }
    
  async sendLoginToken(email: string, token: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    try {
      await this.transporter.sendMail({
        from: `"Acciones UD" ${this.configService.get('MAIL_ADDRESS')}`,
        to: email,
        subject: 'Tu código de acceso',
        text: `Tu token de acceso es: ${token}`,
      });
    } catch (error) {
      throw new RequestTimeoutException('Error en el envio de token', {description: `No ha sido existosos el envio del token, revise las credenciales.  ${error}`})
    }
  }
}
// src/mail/mail.service.ts
