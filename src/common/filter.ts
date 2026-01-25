import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Result } from './Result';

@Catch(HttpException)
export class HttpFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const status = exception.getStatus();

    const exceptionResponse = exception.getResponse();

    console.log('异常过滤器捕获到异常:', exceptionResponse);

    response
      .status(status)
      .json(
        Result.error(
          (exceptionResponse as any).message || exception.message || '未知错误',
        ),
      );
  }
}
