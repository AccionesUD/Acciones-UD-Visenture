/**
 * Modelo para la representación del perfil de usuario
 */
export interface User {
  id?: number;
  identity_document?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  birthdate?: Date;
}

/**
 * Datos para actualización de perfil
 */
export interface UpdateProfileDto {
  email?: string;
  phone_number?: string;
}

/**
 * Datos para cambio de contraseña
 */
export interface ChangePasswordDto {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

/**
 * Respuesta al actualizar perfil
 */
export interface ProfileUpdateResponse {
  success: boolean;
  message: string;
  data?: User;
}
