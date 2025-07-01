import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, delay, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { User, ProfileUpdateResponse, UserFilters, UsersResponse, UserStats } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})

export class UsersService {
  private apiUrl = environment.apiUrl || 'http://localhost:3000/api';

  constructor(private http: HttpClient) { }

  /**
   * Obtiene usuarios con filtros y paginación
   */
  getUsers(filters?: UserFilters): Observable<UsersResponse> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach((key) => {
        const value = filters[key as keyof UserFilters];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }
    return this.http.get<UsersResponse>(`${this.apiUrl}/admin/users`, { params });
  }
  /**
   * Obtiene el usuario current
   */
  getCurrentUser(): Observable<User>{
    return this.http.get<User>(`${this.apiUrl}/users/me`);
  }
  /**
   * Obtiene un usuario por su ID
   */
  getUserById(userId: number): Observable<{success: boolean, data: User}> {
    return this.http.get<{success: boolean, data: User}>(`${this.apiUrl}/admin/users/${userId}`);
  }
  /**
   * Crea un nuevo usuario
   */
  createUser(userData: Partial<User>): Observable<ProfileUpdateResponse> {
    return this.http.post<ProfileUpdateResponse>(`${this.apiUrl}/admin/users`, userData);
  }
  /**
   * Actualiza un usuario
   */
  updateUser(userId: number, userData: Partial<User>): Observable<ProfileUpdateResponse> {
    return this.http.put<ProfileUpdateResponse>(`${this.apiUrl}/admin/users/${userId}`, userData);
  }

  /**
   * Elimina un usuario
   */
  deleteUser(userId: number): Observable<{ success: boolean, message: string }> {
    return this.http.delete<{ success: boolean, message: string }>(`${this.apiUrl}/admin/users/${userId}`);
  }
  
  /**
   * Elimina múltiples usuarios
   */
  deleteMultipleUsers(userIds: number[]): Observable<{ success: boolean, message: string, count: number }> {
    return this.http.post<{ success: boolean, message: string, count: number }>(
      `${this.apiUrl}/admin/users/delete-multiple`, 
      { userIds }
    );
  }

  getUserRole(): Observable<string | undefined> {
    return this.getCurrentUser().pipe(
      map(user => user.roles?.[0]) // Assuming the first role is the primary one
    );
  }

  /**
   * Cambia el estado de un usuario
   */
  changeUserStatus(userId: number, status: 'active' | 'inactive' | 'pending'): Observable<ProfileUpdateResponse> {
    return this.http.put<ProfileUpdateResponse>(`${this.apiUrl}/admin/users/${userId}/status`, { status });
  }
    /**
   * Obtiene estadísticas de usuarios (para los gráficos)
   * Ahora calcula las estadísticas a partir de los usuarios reales de /accounts
   */
  getUserStats(): Observable<UserStats> {
    return this.getUsersFromAccounts().pipe(
      map((users: User[]) => {
        // Calcular conteos por rol
        const byRole: { [key: string]: number } = {};
        users.forEach(u => {
          const role = u.role || 'sin_rol';
          byRole[role] = (byRole[role] || 0) + 1;
        });
        // Calcular conteos por estado (si existiera el campo status)
        const byStatus: { [key: string]: number } = {};
        users.forEach(u => {
          const status = u.status || 'N/A';
          byStatus[status] = (byStatus[status] || 0) + 1;
        });
        // Calcular tendencia de registros por mes
        const registrationsByMonth: { [month: string]: number } = {};
        users.forEach(u => {
          if (u.created_at) {
            const month = u.created_at.substring(0, 7); // YYYY-MM
            registrationsByMonth[month] = (registrationsByMonth[month] || 0) + 1;
          }
        });
        const registrations_by_month = Object.entries(registrationsByMonth)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([month, count]) => ({ month, count }));
        // Para compatibilidad con UserStats, registrationTrend debe tener 'date' en vez de 'month'
        const registrationTrend = registrations_by_month.map(({ month, count }) => ({ date: month, count }));
        // Estructura final
        return {
          total_users: users.length,
          active_users: byStatus['active'] || 0,
          inactive_users: byStatus['inactive'] || 0,
          pending_users: byStatus['pending'] || 0,
          admins_count: byRole['admin'] || 0,
          commissioners_count: byRole['commissioner'] || 0,
          clients_count: byRole['usuario'] || 0,
          registrations_by_month,
          byRole,
          byStatus,
          registrationTrend
        };
      })
    );
  }

  /**
   * Obtiene la lista de roles disponibles desde el backend
   */
  getRoles(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/roles`);
  }

  /**
   * Obtiene usuarios desde el endpoint real /accounts
   */
  getUsersFromAccounts(): Observable<User[]> {
    return this.http.get<any[]>(`${this.apiUrl}/accounts`).pipe(
      map((users) => users.map(u => ({
        accountId: u.accountId, // para la tabla y edición
        identity_document: u.userId, // para edición y PATCH
        first_name: u.firstName,
        last_name: u.lastName,
        email: u.email,
        phone_number: u.phone || '',
        address: u.address || '',
        role: Array.isArray(u.roles) && u.roles.length > 0 ? u.roles[0] : undefined,
        roles: u.roles
      } as User)))
    );
  }

  /**
   * Actualiza un usuario usando el endpoint real PATCH /api/users/{identity_document}
   */
  updateUserReal(identity_document: string, data: { email: string; phone: string; address?: string }): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/users/${identity_document}`, data);
  }
  /**
   * Cambia el rol de un usuario usando el endpoint real PATCH /api/accounts/{id}/roles
   */
  changeUserRole(userId: number, role: string): Observable<ProfileUpdateResponse> {
    // Endpoint real: PATCH /api/accounts/{id}/roles
    // Body: { role: 'nuevo_rol' }
    return this.http.patch<ProfileUpdateResponse>(`${this.apiUrl}/accounts/${userId}/roles`, { role });
  }
  /**
   * Actualiza un usuario usando el endpoint real PATCH /api/accounts/admin/update-user
   */
  updateUserAdmin(data: {
    accountId: number;
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    roles: string[];
  }): Observable<any> {
    // El token debe ser gestionado por un interceptor o aquí si es necesario
    return this.http.patch<any>(`${this.apiUrl}/accounts/admin/update-user`, data);
  }
}
