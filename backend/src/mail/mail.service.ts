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

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const resetLink = `http://localhost:4200/reset-password?token=${token}&email=${email}`;
  
  await this.transporter.sendMail({
    from: '"Soporte" <soporte@tudominio.com>',
    to: email,
    subject: 'Restablecimiento de contraseña',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #2563eb;">Restablecer contraseña</h2>
        <p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
        <a href="${resetLink}" style="...">Restablecer contraseña</a>
        <p>El enlace expirará en 1 hora.</p>
      </div>
    `,
  });
}
}
// src/mail/mail.service.ts
