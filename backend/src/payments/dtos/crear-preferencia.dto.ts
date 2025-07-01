export interface CrearPreferenciaDto {
  planId: string; // p.ej. 'plan_basico', 'plan_premium', 'plan_pro'
  monto: number; // valor en COP, p.ej. 10000
  descripcion: string; // descripción en el checkout
  emailUsuario: string; // correo del pagador
}
