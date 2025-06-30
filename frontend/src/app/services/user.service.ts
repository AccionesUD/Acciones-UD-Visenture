import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, delay, map } from 'rxjs';
import { environmentExample } from '../../environments/environmentexample';
import { User, ProfileUpdateResponse, UserFilters, UsersResponse, UserStats } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})

export class UsersService {
  private apiUrl = environmentExample.apiUrl || 'http://localhost:3000/api';

  constructor(private http: HttpClient) { }

  /**
   * Obtiene usuarios con filtros y paginación
   */
  getUsers(filters?: UserFilters): Observable<UsersResponse> {
    // En producción:
    // let params = new HttpParams();
    // if (filters) {
    //   Object.keys(filters).forEach((key) => {
    //     const value = filters[key as keyof UserFilters];
    //     if (value !== undefined && value !== null && value !== '') {
    //       params = params.set(key, value.toString());
    //     }
    //   });
    // }
    // return this.http.get<UsersResponse>(`${this.apiUrl}/admin/users`, { params });

    // Mock para desarrollo:
    // Devolvemos una copia para no modificar el array original directamente con sort
    const response = this.generateMockUsers(filters ? { ...filters } : {});
    return of(response).pipe(delay(500)); // Añadimos un delay para simular latencia
  }
  /**
   * Obtiene el usuario actual
   */
  getCurrentUser(): Observable<User>{
    // Mock para desarrollo: devuelve el primer usuario como usuario actual
    const currentUser = this.mockUsers[0];
    return of(currentUser).pipe(delay(300));
  }
  /**
   * Obtiene un usuario por su ID
   */
  getUserById(userId: number): Observable<{success: boolean, data: User}> {
    // En producción:
    // return this.http.get<{success: boolean, data: User}>(`${this.apiUrl}/admin/users/${userId}`);
    
    // Mock para desarrollo:
    const user = this.mockUsers.find(u => u.id === userId);
    return of({
      success: !!user,
      data: user!
    }).pipe(delay(300));
  }

  /**
   * Crea un nuevo usuario
   */
  createUser(userData: Partial<User>): Observable<ProfileUpdateResponse> {
    // En producción:
    // return this.http.post<ProfileUpdateResponse>(`${this.apiUrl}/admin/users`, userData);
    
    // Mock para desarrollo:
    const newUser: User = {
      id: Math.max(...this.mockUsers.map(u => u.id || 0)) + 1,
      ...userData,
      first_name: userData.first_name || '',
      last_name: userData.last_name || '',
      email: userData.email || '',
      phone_number: userData.phone_number || '',
      role: userData.role as 'admin' | 'commissioner' | 'client' || 'client',
      status: userData.status as 'active' | 'inactive' | 'pending' || 'pending',
      email_verified_at: userData.email_verified_at || new Date().toISOString(),
    };
    
    this.mockUsers.push(newUser);
    
    return of({
      success: true,
      message: 'Usuario creado correctamente',
      data: newUser
    }).pipe(delay(500));
  }

  /**
   * Actualiza un usuario
   */
  updateUser(userId: number, userData: Partial<User>): Observable<ProfileUpdateResponse> {
    // En producción:
    // return this.http.put<ProfileUpdateResponse>(`${this.apiUrl}/admin/users/${userId}`, userData);

    // Mock para desarrollo:
    const userIndex = this.mockUsers.findIndex(user => user.id === userId);
    
    if (userIndex === -1) {
      return of({
        success: false,
        message: 'Usuario no encontrado'
      }).pipe(delay(300));
    }
    
    const updatedUser = {
      ...this.mockUsers[userIndex],
      ...userData
    };
    
    this.mockUsers[userIndex] = updatedUser;

    return of({
      success: true,
      message: 'Usuario actualizado correctamente',
      data: updatedUser
    }).pipe(delay(300));
  }

  /**
   * Elimina un usuario
   */
  deleteUser(userId: number): Observable<{ success: boolean, message: string }> {
    // En producción:
    // return this.http.delete<{ success: boolean, message: string }>(`${this.apiUrl}/admin/users/${userId}`);

    // Mock para desarrollo:
    const initialLength = this.mockUsers.length;
    this.mockUsers = this.mockUsers.filter(user => user.id !== userId);

    return of({
      success: initialLength > this.mockUsers.length,
      message: initialLength > this.mockUsers.length ? 
        'Usuario eliminado correctamente' : 
        'No se encontró el usuario'
    }).pipe(delay(300));
  }
  
  /**
   * Elimina múltiples usuarios
   */
  deleteMultipleUsers(userIds: number[]): Observable<{ success: boolean, message: string, count: number }> {
    // En producción:
    // return this.http.post<{ success: boolean, message: string, count: number }>(
    //   `${this.apiUrl}/admin/users/delete-multiple`, 
    //   { userIds }
    // );
    
    // Mock para desarrollo:
    const initialLength = this.mockUsers.length;
    this.mockUsers = this.mockUsers.filter(user => !userIds.includes(user.id!));
    const deletedCount = initialLength - this.mockUsers.length;
    
    return of({
      success: deletedCount > 0,
      message: deletedCount > 0 ? 
        `${deletedCount} usuarios eliminados correctamente` : 
        'No se encontraron los usuarios',
      count: deletedCount
    }).pipe(delay(500));
  }

  /**
   * Cambia el rol de un usuario
   */
  changeUserRole(userId: number, role: 'admin' | 'commissioner' | 'client'): Observable<ProfileUpdateResponse> {
    // En producción:
    // return this.http.put<ProfileUpdateResponse>(`${this.apiUrl}/admin/users/${userId}/role`, { role });

    return this.updateUser(userId, { role });
  }
  getUserRole(): Observable<User['role'] | undefined> {
    //usuario produccion
    //return this.http.get<User>(`/api/user/me`).pipe(map(user => user.role));

    //usuario mock
    return this.getCurrentUser().pipe(
      map(user => user.role)
    );
  }

  /**
   * Cambia el estado de un usuario
   */
  changeUserStatus(userId: number, status: 'active' | 'inactive' | 'pending'): Observable<ProfileUpdateResponse> {
    // En producción:
    // return this.http.put<ProfileUpdateResponse>(`${this.apiUrl}/admin/users/${userId}/status`, { status });

    return this.updateUser(userId, { status });
  }
    /**
   * Obtiene estadísticas de usuarios (para los gráficos)
   */
  getUserStats(): Observable<UserStats> {
    // En producción:
    // return this.http.get<UserStats>(`${this.apiUrl}/admin/users/stats`);

    // Mock para desarrollo:
    const mockData = this.generateMockUserStats();
      // Adapta el formato de los datos mock a la estructura de UserStats
    const stats: UserStats = {
      total_users: Object.values(mockData.byRole).reduce((sum, val) => sum + val, 0),
      active_users: mockData.byStatus["active"] || 0,
      inactive_users: mockData.byStatus["inactive"] || 0,
      pending_users: mockData.byStatus["pending"] || 0,
      admins_count: mockData.byRole["admin"] || 0,
      commissioners_count: mockData.byRole["commissioner"] || 0,
      clients_count: mockData.byRole["client"] || 0,
      // Convertir el formato de fecha a formato de mes para registrations_by_month
      registrations_by_month: mockData.registrationTrend.map(item => ({
        month: item.date.substring(0, 7), // Extrae YYYY-MM de YYYY-MM-DD
        count: item.count
      })),
      // Mantener los datos originales para compatibilidad con código existente
      byRole: mockData.byRole,
      byStatus: mockData.byStatus,
      registrationTrend: mockData.registrationTrend
    };
    
    return of(stats).pipe(delay(400));
  }

  // --- Métodos MOCK ---

  private mockUsers: User[] = this.createInitialMockUsers();

  private createInitialMockUsers(): User[] {
    const users: User[] = [];
    const roles: Array<'admin' | 'commissioner' | 'client'> = ['admin', 'commissioner', 'client'];
    const statuses: Array<'active' | 'inactive' | 'pending'> = ['active', 'inactive', 'pending'];
    const firstNames = ['Alice', 'Bob', 'Charlie', 'Diana', 'Edward', 'Fiona', 'George', 'Hannah', 'Ian', 'Julia', 'Kevin', 'Laura'];
    const lastNames = ['Smith', 'Jones', 'Williams', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas', 'Jackson'];

    for (let i = 1; i <= 125; i++) { // Generar más usuarios para probar paginación
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const creationDate = new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000); // Hasta 30 días atrás
      users.push({
        id: i,
        first_name: firstName,
        last_name: lastName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`,
        phone_number: `555-01${String(i).padStart(2, '0')}`,
        role: roles[Math.floor(Math.random() * roles.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        email_verified_at: Math.random() > 0.3 ? new Date().toISOString() : undefined,
        created_at: creationDate.toISOString(),
        updated_at: new Date(creationDate.getTime() + Math.floor(Math.random() * 10) * 24 * 60 * 60 * 1000).toISOString(), // Actualizado hasta 10 días después de creación
        last_login: Math.random() > 0.2 ? new Date(Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000).toISOString() : undefined, // Último login hasta 7 días atrás
      });
    }
    return users;
  }

  private generateMockUsers(filters: UserFilters): UsersResponse {
    let filteredUsers = [...this.mockUsers]; // Trabajar con una copia

    // Aplicar filtros de búsqueda
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredUsers = filteredUsers.filter(user =>
        (user.first_name && user.first_name.toLowerCase().includes(searchTerm)) ||
        (user.last_name && user.last_name.toLowerCase().includes(searchTerm)) ||
        user.email.toLowerCase().includes(searchTerm)
      );
    }

    // Aplicar filtro de rol
    if (filters.role) {
      filteredUsers = filteredUsers.filter(user => user.role === filters.role);
    }

    // Aplicar filtro de estado
    if (filters.status) {
      filteredUsers = filteredUsers.filter(user => user.status === filters.status);
    }
    
    // Aplicar ordenación
    if (filters.sort_by) {
      const sortBy = filters.sort_by as keyof User;
      const sortOrder = filters.sort_order || 'asc';
      
      // Comprobación para evitar errores si sortBy no es una clave válida o el valor es undefined/null
      if (sortBy in filteredUsers[0] || sortBy === 'first_name' || sortBy === 'last_name' || sortBy === 'email' || sortBy === 'role' || sortBy === 'status') {
        filteredUsers.sort((a, b) => {
          const valA = a[sortBy];
          const valB = b[sortBy];

          let comparison = 0;
          if (valA === undefined || valA === null) comparison = -1;
          else if (valB === undefined || valB === null) comparison = 1;
          else if (typeof valA === 'string' && typeof valB === 'string') {
            comparison = valA.localeCompare(valB);
          } else if (typeof valA === 'number' && typeof valB === 'number') {
            comparison = valA - valB;
          }
          // Añadir más comparaciones si es necesario para otros tipos

          return sortOrder === 'asc' ? comparison : comparison * -1;
        });
      }
    }


    // Paginación
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const total = filteredUsers.length;
    const total_pages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    return {
      success: true,
      data: paginatedUsers,
      pagination: {
        total: total,
        current_page: page,
        per_page: limit,
        total_pages: total_pages
      }
    };
  }
  /**
   * Genera estadísticas de usuarios para los datos mock
   * @returns Objeto con estadísticas de usuarios
   */
  private generateMockUserStats(): {
    byRole: { [key: string]: number };
    byStatus: { [key: string]: number };
    registrationTrend: { date: string; count: number }[];
  } {
    const byRole: { [key: string]: number } = { admin: 0, commissioner: 0, client: 0 };
    const byStatus: { [key: string]: number } = { active: 0, inactive: 0, pending: 0 };
    const registrationTrend: { date: string; count: number }[] = [];

    this.mockUsers.forEach(user => {
      if (user.role) byRole[user.role] = (byRole[user.role] || 0) + 1;
      if (user.status) byStatus[user.status] = (byStatus[user.status] || 0) + 1;
    });

    // Generar tendencia de registro para los últimos 7 días
    const trendMap = new Map<string, number>();
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      trendMap.set(d.toISOString().split('T')[0], 0); // Clave YYYY-MM-DD
    }

    this.mockUsers.forEach(user => {
      if (user.created_at) {
        const registrationDate = user.created_at.split('T')[0];
        if (trendMap.has(registrationDate)) {
          trendMap.set(registrationDate, trendMap.get(registrationDate)! + 1);
        }
      }
    });
    
    trendMap.forEach((count, date) => {
      registrationTrend.push({ date, count });
    });
    
    registrationTrend.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return { byRole, byStatus, registrationTrend };
  }
}
