import { Injectable, inject } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse, HttpHandlerFn } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

// Interceptor funcional para Angular 17+
export function tokenInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
  // Si la petición no va a nuestra API, no añadimos el token
  if (!req.url.includes(environment.apiUrl) && !req.url.includes(environment.authApiUrl)) {
    return next(req);
  }

  // Si hay un token, lo añadimos
  const token = localStorage.getItem('auth_token');
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  // Injección de servicios necesarios
  const router = inject(Router);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        // Si el token ha expirado, cerramos la sesión
        authService.logout();
        router.navigate(['/login'], { 
          queryParams: { expired: 'true' } 
        });
      }
      return throwError(() => error);
    })
  );
}

// Mantener la clase original para compatibilidad con código existente
@Injectable()
export class TokenInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Si la petición no va a nuestra API, no añadimos el token
    if (!request.url.includes(environment.apiUrl) && !request.url.includes(environment.authApiUrl)) {
      return next.handle(request);
    }

    // Si hay un token, lo añadimos
    const token = localStorage.getItem('auth_token');
    if (token) {
      request = this.addToken(request, token);
    }

    return next.handle(request).pipe(
      catchError((error) => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          // Si el token ha expirado, cerramos la sesión
          this.authService.logout();
          this.router.navigate(['/login'], { 
            queryParams: { expired: 'true' } 
          });
        }
        return throwError(() => error);
      })
    );
  }

  private addToken(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
}
