import { Injectable } from '@angular/core';
import { 
  HttpRequest, 
  HttpHandler, 
  HttpEvent, 
  HttpInterceptor, 
  HttpErrorResponse 
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

  constructor(private router: Router) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'Ha ocurrido un error desconocido';
        
        // Errores de red o servidor
        if (error.error instanceof ErrorEvent) {
          // Error del lado del cliente
          console.error('Error del lado del cliente:', error.error.message);
          errorMessage = `Error: ${error.error.message}`;
        } else {
          // Error del lado del servidor
          console.error(
            `Código de estado: ${error.status}, ` +
            `Mensaje: ${error.message}, ` +
            `Error: ${JSON.stringify(error.error)}`
          );
          
          // Manejar diferentes códigos de estado
          switch (error.status) {
            case 400:
              errorMessage = error.error?.message || 'Solicitud incorrecta';
              break;
            case 401:
              errorMessage = 'No autorizado. Por favor inicie sesión nuevamente.';
              // Podríamos redirigir al login si es necesario
              break;
            case 403:
              errorMessage = 'Acceso prohibido. No tiene permisos para esta acción.';
              break;
            case 404:
              errorMessage = 'Recurso no encontrado';
              break;
            case 500:
              errorMessage = 'Error interno del servidor';
              break;
            default:
              errorMessage = `Error ${error.status}: ${error.error?.message || error.statusText}`;
          }
        }
        
        // Registrar el error para depuración
        console.error('Error interceptado:', errorMessage);
        
        // Devolver el error con un mensaje más descriptivo
        return throwError(() => new Error(errorMessage));
      })
    );
  }
}
