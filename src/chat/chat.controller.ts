import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  BadRequestException,
  Res,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { Response } from 'express';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // 创建新会话
  @Post('conversation')
  async createConversation(@Body('userId') userId: number) {
    return this.chatService.createConversation(userId);
  }

  @Get('conversation')
  async getConversationDetail(
    @Query('userId') userId: number, 
    @Query('id') id: number
  ) {
    return this.chatService.getConversationDetail(userId, id);
  }

  // SSE Endpoint
  @Post('stream')
  async streamMessage(
    @Req() req,
    @Body() body: { conversationId: number; message: string },
    @Res() res: Response,
  ) {
    const { conversationId, message } = body;
    if (!conversationId || !message) {
      throw new BadRequestException('Missing conversationId or message');
    }

    // Set Headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    let isAborted = false;

    req.on('close', () => {
      isAborted = true;
      console.log('客户端连接已断开，停止流输出');
    });
    console.log('开始对话');
    try {
      const streamGenerator = await this.chatService.generateStream(
        conversationId,
        message,
      );

      for await (const chunk of streamGenerator) {
        if (isAborted) {
          break; // 停止生成器循环
        }
        res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
      }

      // Signal end of stream
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error) {
      console.error('Streaming error:', error);
      res.write(
        `event: error\ndata: ${JSON.stringify({ message: 'Internal Server Error' })}\n\n`,
      );
      res.end();
    }
  }
}
