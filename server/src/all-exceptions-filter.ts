import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Request, Response } from "express";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Log seguro para debugging (sin exposer información sensible)
    if (process.env.NODE_ENV === 'development') {
      console.error('Error occurred:', {
        url: request.url,
        method: request.method,
        timestamp: new Date().toISOString(),
        error: exception instanceof Error ? exception.message : 'Unknown error'
      });
    } else {
      // En producción, solo log básico sin detalles sensibles
      console.error('Error occurred:', {
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method
      });
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      return response.status(status).json({
        success: false,
        statusCode: status,
        message:
          typeof exceptionResponse === "string"
            ? exceptionResponse
            : (exceptionResponse as any).message,
      });
    }

    // Para errores no HTTP, no revelar detalles internos
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: "Ha ocurrido un error interno del servidor",
    });
  }
}
