/**
 * @file chat.controller.ts
 * @description 聊天控制器，处理 AI 对话相关 HTTP 请求
 * @module 聊天模块
 */

import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpException,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChatService } from './chat.service';
import type { ConversationWorkspace } from './types/conversation-workspace.type';

interface AuthenticatedRequest {
  user?: {
    userId?: number;
  };
  on: (event: string, listener: () => void) => void;
}

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  private getUserId(req: AuthenticatedRequest) {
    return req.user?.userId;
  }

  private getHttpExceptionMessage(error: HttpException, fallback: string) {
    const response = error.getResponse();

    if (typeof response === 'string' && response.trim()) {
      return response;
    }

    if (response && typeof response === 'object' && 'message' in response) {
      const { message } = response as { message?: string | string[] };

      if (typeof message === 'string' && message.trim()) {
        return message;
      }

      if (Array.isArray(message)) {
        const normalizedMessage = message
          .filter((item) => typeof item === 'string' && item.trim())
          .join(', ');

        if (normalizedMessage) {
          return normalizedMessage;
        }
      }
    }

    return fallback;
  }

  private buildStreamErrorPayload(error: unknown) {
    if (error instanceof HttpException) {
      const status = error.getStatus();
      const reason =
        status === 400
          ? 'bad_request'
          : status === 401
            ? 'unauthorized'
            : status === 403
              ? 'forbidden'
              : status === 404
                ? 'not_found'
                : 'http_error';

      return {
        message: this.getHttpExceptionMessage(error, 'Request failed'),
        retryable: status === 408 || status === 429 || status >= 500,
        reason,
      };
    }

    return {
      message: 'Internal Server Error',
      retryable: true,
      reason: 'internal_error',
    };
  }

  @Post('conversation')
  async createConversation(@Req() req: AuthenticatedRequest) {
    return this.chatService.createConversation(this.getUserId(req));
  }

  @Get('conversations')
  async getConversationList(@Req() req: AuthenticatedRequest) {
    return this.chatService.getConversationList(this.getUserId(req));
  }

  @Get('conversation')
  async getConversationDetail(
    @Req() req: AuthenticatedRequest,
    @Query('id') id: string,
  ) {
    const conversationId = Number(id);

    if (!conversationId) {
      throw new BadRequestException('Missing conversation id');
    }

    return this.chatService.getConversationDetail(
      this.getUserId(req),
      conversationId,
    );
  }

  @Put('conversation/workspace')
  async saveConversationWorkspace(
    @Req() req: AuthenticatedRequest,
    @Body()
    body: { conversationId: number; workspace: ConversationWorkspace },
  ) {
    const { conversationId, workspace } = body;

    if (!conversationId || !workspace) {
      throw new BadRequestException('Missing conversationId or workspace');
    }

    return this.chatService.saveConversationWorkspace(
      this.getUserId(req),
      conversationId,
      workspace,
    );
  }

  @Post('stream')
  async streamMessage(
    @Req() req: AuthenticatedRequest,
    @Body()
    body: {
      conversationId: number;
      message: string;
      workspace: ConversationWorkspace;
      requestId: string;
    },
    @Res() res: Response,
  ) {
    const { conversationId, message, workspace, requestId } = body;

    if (!conversationId || !message || !workspace || !requestId) {
      throw new BadRequestException(
        'Missing conversationId, message, workspace or requestId',
      );
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const abortController = new AbortController();
    let isStreamFinished = false;

    req.on('close', () => {
      if (isStreamFinished) {
        return;
      }

      abortController.abort();
      console.log('Client connection closed, stop streaming');
    });

    try {
      const streamGenerator = await this.chatService.generateStream(
        this.getUserId(req),
        conversationId,
        message,
        workspace,
        requestId,
        { signal: abortController.signal },
      );

      for await (const chunk of streamGenerator) {
        if (abortController.signal.aborted || res.writableEnded) {
          break;
        }

        res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
      }

      if (!abortController.signal.aborted && !res.writableEnded) {
        res.write('data: [DONE]\n\n');
      }

      isStreamFinished = true;
      if (!res.writableEnded) {
        res.end();
      }
    } catch (error) {
      console.error('Streaming error:', error);
      isStreamFinished = true;

      if (!abortController.signal.aborted && !res.writableEnded) {
        res.write(
          `event: error\ndata: ${JSON.stringify(this.buildStreamErrorPayload(error))}\n\n`,
        );
        res.end();
      }
    }
  }
}
