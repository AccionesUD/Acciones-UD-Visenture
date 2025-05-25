/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: Transporter;
  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.MAIL_PORT || '587'),
      auth: {
        user: process.env.MAIL_USER || 'correo@gmail.com',
        pass: process.env.MAIL_PASSWORD || 'contrasenia_app', // Contraseña de aplicación de Gmail
      },
    });
  }
  async sendLoginToken(email: string, token: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    await this.transporter.sendMail({
      from: `"Acciones UD" <${process.env.MAIL_FROM || 'no-reply@visenture.com'}>`,
      to: email,
      subject: 'Tu código de acceso',
      text: `Tu token de acceso es: ${token}`,
    });
  }
}
// src/mail/mail.service.ts
