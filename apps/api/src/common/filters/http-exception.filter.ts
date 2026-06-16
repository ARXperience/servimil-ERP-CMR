import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    const errorMessage = typeof message === 'string' ? message : (message as any).message || message;

    this.logger.error(
      `[${request.method}] ${request.url} - Status: ${status} - Error: ${JSON.stringify(errorMessage)}`,
      exception instanceof Error ? exception.stack : ''
    );

    response.status(status).json({
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: Array.isArray(errorMessage) ? errorMessage[0] : errorMessage,
      errors: Array.isArray(errorMessage) ? errorMessage : [errorMessage],
    });
  }
}
