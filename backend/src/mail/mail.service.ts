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
      service: 'gmail',
      auth: {
        user: 'correo@gmail.com',
        pass: 'contrasenia_app', // Contraseña de aplicación de Gmail
      },
    });
  }

  async sendLoginToken(email: string, token: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    await this.transporter.sendMail({
      from: '"Acciones UD" <tu_correo@gmail.com>',
      to: email,
      subject: 'Tu código de acceso',
      text: `Tu token de acceso es: ${token}`,
    });
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const resetLink = `https://tudominio.com/reset-password?token=${token}&email=${email}`;
  
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
