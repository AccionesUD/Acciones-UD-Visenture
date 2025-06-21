import { Injectable, Logger, RequestTimeoutException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: configService.get('MAIL_SERVICE'),
      auth: {
        user: this.configService.get('MAIL_ADDRESS'),
        pass: this.configService.get('MAIL_PASS'),
      },
    });
  }

  async sendMail(options: MailOptions): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `"Acciones UD" <${this.configService.get('MAIL_ADDRESS')}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });
      this.logger.log(`Email enviado a: ${options.to}`);
    } catch (error) {
      this.logger.error(`Error enviando email: ${error.message}`);
      throw error;
    }
  }

  async sendLoginToken(email: string, token: string): Promise<void> {
  try {
    await this.sendMail({
      to: email,
      subject: 'Tu código de acceso',
      html: this.buildLoginTokenHtml(token),
    });
  } catch (error) {
    throw new RequestTimeoutException('Error en el envío de token', {
      description: `No ha sido exitoso el envío del token, revise las credenciales. ${error}`
    });
  }
}

private buildLoginTokenHtml(token: string): string {
  return `
    <div style="
      font-family: 'Arial', sans-serif;
      max-width: 600px;
      margin: 0 auto;
      background-color: #f8f9fa;
      border-radius: 8px;
      overflow: hidden;
    ">
      <!-- Encabezado -->
      <div style="
        background-color: #0f172b;
        padding: 20px;
        text-align: center;
      ">
        <h1 style="
          color: #ffffff;
          margin: 0;
          font-size: 24px;
        ">
          <strong>Seguridad</strong> Acciones UD
        </h1>
      </div>

      <!-- Contenido -->
      <div style="
        padding: 30px;
        background-color: #ffffff;
      ">
        <p style="
          color: #6c757d;
          font-size: 14px;
          margin-bottom: 20px;
        ">
          Fecha: ${new Date().toLocaleString('es-CO', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })}
        </p>

        <h2 style="
          color: #0f172b;
          margin-top: 0;
          font-size: 20px;
        ">
          Código de acceso
        </h2>

        <p style="
          color: #212529;
          line-height: 1.6;
        ">
          Bienvenido,
        </p>

        <p style="
          color: #212529;
          line-height: 1.6;
        ">
          Aquí está tu código de acceso temporal:
        </p>

        <div style="
          margin: 25px 0;
          padding: 15px;
          background-color: #f1f8ff;
          border-left: 4px solid #2563eb;
          border-radius: 4px;
          text-align: center;
          font-size: 24px;
          font-weight: bold;
          color: #0f172b;
        ">
          ${token}
        </div>

        <p style="
          color: #6c757d;
          font-size: 14px;
          line-height: 1.6;
        ">
          Este código expirará en 10 minutos. No lo compartas con nadie.
        </p>
      </div>

      <!-- Pie de página -->
      <div style="
        background-color: #081023;
        padding: 15px;
        text-align: center;
        color: #ffffff;
        font-size: 12px;
      ">
        <p style="margin: 0;">
          A tu servicio,<br>
          <strong>Equipo de Acciones UD</strong>
        </p>
        <p style="margin: 5px 0 0 0; color: rgba(255,255,255,0.7);">
          accionesudinc@gmail.com
        </p>
      </div>
    </div>
  `;
}

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const resetLink = `http://localhost:4200/reset-password?token=${token}&email=${email}`;
  
  await this.sendMail({
    to: email,
    subject: 'Restablecimiento de contraseña',
    html: this.buildPasswordResetHtml(resetLink)
  });
}

private buildPasswordResetHtml(resetLink: string): string {
  return `
    <div style="
      font-family: 'Arial', sans-serif;
      max-width: 600px;
      margin: 0 auto;
      background-color: #f8f9fa;
      border-radius: 8px;
      overflow: hidden;
    ">
      <!-- Encabezado -->
      <div style="
        background-color: #0f172b;
        padding: 20px;
        text-align: center;
      ">
        <h1 style="
          color: #ffffff;
          margin: 0;
          font-size: 24px;
        ">
          <strong>Seguridad</strong> Acciones UD
        </h1>
      </div>

      <!-- Contenido -->
      <div style="
        padding: 30px;
        background-color: #ffffff;
      ">
        <p style="
          color: #6c757d;
          font-size: 14px;
          margin-bottom: 20px;
        ">
          Fecha: ${new Date().toLocaleString('es-CO', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })}
        </p>

        <h2 style="
          color: #0f172b;
          margin-top: 0;
          font-size: 20px;
        ">
          Restablecer contraseña
        </h2>

        <p style="
          color: #212529;
          line-height: 1.6;
        ">
          Bienvenido,
        </p>

        <p style="
          color: #212529;
          line-height: 1.6;
        ">
          Recibimos una solicitud para restablecer tu contraseña. Haz clic en el siguiente botón para continuar:
        </p>

        <div style="margin: 30px 0; text-align: center;">
          <a href="${resetLink}" style="
            display: inline-block;
            padding: 12px 24px;
            background-color: #2563eb;
            color: #ffffff;
            text-decoration: none;
            border-radius: 4px;
            font-weight: bold;
          ">
            Restablecer contraseña
          </a>
        </div>

        <p style="
          color: #6c757d;
          font-size: 14px;
          line-height: 1.6;
        ">
          Si no solicitaste este cambio, puedes ignorar este mensaje. El enlace expirará en 1 hora.
        </p>

        <div style="
          margin-top: 20px;
          padding: 15px;
          background-color: #fff8f1;
          border-left: 4px solid #f59e0b;
          border-radius: 4px;
        ">
          <p style="
            margin: 0;
            color: #0f172b;
            font-size: 14px;
          ">
            Por seguridad, nunca compartas este enlace con otras personas.
          </p>
        </div>
      </div>

      <!-- Pie de página -->
      <div style="
        background-color: #081023;
        padding: 15px;
        text-align: center;
        color: #ffffff;
        font-size: 12px;
      ">
        <p style="margin: 0;">
          A tu servicio,<br>
          <strong>Equipo de Acciones UD</strong>
        </p>
        <p style="margin: 5px 0 0 0; color: rgba(255,255,255,0.7);">
          accionesudinc@gmail.com
        </p>
      </div>
    </div>
  `;
}

  async sendAdvisorAssignedNotification(
    advisorEmail: string, 
    advisorName: string, 
    clientName: string
  ): Promise<void> {
    await this.sendMail({
      to: advisorEmail,
      subject: 'Nuevo inversor asignado',
      html: this.buildAdvisorNotificationHtml(advisorName, clientName)
    });
  }

  private buildAdvisorNotificationHtml(advisorName: string, clientName: string): string {
    return `
    <div style="
      font-family: 'Arial', sans-serif;
      max-width: 600px;
      margin: 0 auto;
      background-color: #f8f9fa;
      border-radius: 8px;
      overflow: hidden;
    ">
      <!-- Encabezado -->
      <div style="
        background-color: #0f172b;
        padding: 20px;
        text-align: center;
      ">
        <h1 style="
          color: #ffffff;
          margin: 0;
          font-size: 24px;
        ">
          <strong>Soporte</strong> Acciones UD
        </h1>
      </div>

      <!-- Contenido -->
      <div style="
        padding: 30px;
        background-color: #ffffff;
      ">
        <p style="
          color: #6c757d;
          font-size: 14px;
          margin-bottom: 20px;
        ">
          Fecha: ${new Date().toLocaleString('es-CO', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })}
        </p>

        <h2 style="
          color: #0f172b;
          margin-top: 0;
          font-size: 20px;
        ">
          Nuevo inversor asignado
        </h2>

        <p style="
          color: #212529;
          line-height: 1.6;
        ">
          Hola <strong>${advisorName}</strong>,
        </p>

        <p style="
          color: #212529;
          line-height: 1.6;
        ">
          Se te ha asignado un nuevo inversor: 
          <strong style="color: #00d492">${clientName}</strong>.
        </p>

        <div style="
          margin-top: 30px;
          padding: 15px;
          background-color: #f1f8ff;
          border-left: 4px solid #00d492;
          border-radius: 4px;
        ">
          <p style="
            margin: 0;
            color: #0f172b;
            font-size: 14px;
          ">
            Puedes acceder a la plataforma para ver los detalles completos del portafolio asignado.
          </p>
        </div>
      </div>

      <!-- Pie de página -->
      <div style="
        background-color: #081023;
        padding: 15px;
        text-align: center;
        color: #ffffff;
        font-size: 12px;
      ">
        <p style="margin: 0;">
          Saludos,<br>
          <strong>Equipo de Acciones UD</strong>
        </p>
        <p style="margin: 5px 0 0 0; color: rgba(255,255,255,0.7);">
          accionesudinc@gmail.com
        </p>
      </div>
    </div>
  `;
  }
}