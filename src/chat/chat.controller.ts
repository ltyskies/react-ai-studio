/**
 * @file chat.controller.ts
 * @description 聊天控制器，处理 AI 对话相关的 HTTP 请求
 * @module 聊天模块
 */

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

/**
 * 聊天控制器
 * @description 处理会话管理和 AI 流式对话请求
 * @decorator @Controller('chat') - 定义路由前缀为 /chat
 * @decorator @UseGuards(JwtAuthGuard) - 应用 JWT 认证守卫
 */
@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  /**
   * 构造函数，注入 ChatService
   * @param chatService - 聊天服务实例
   */
  constructor(private readonly chatService: ChatService) {}

  /**
   * 创建新会话
   * @description 为用户创建一个新的对话会话
   * @param userId - 用户 ID
   * @returns 新创建会话的 ID
   * @decorator @Post('conversation') - 处理 POST /chat/conversation 请求
   */
  @Post('conversation')
  async createConversation(@Body('userId') userId: number) {
    return this.chatService.createConversation(userId);
  }

  /**
   * 获取会话详情
   * @description 获取指定会话的详细信息和消息历史
   * @param userId - 用户 ID，用于权限验证
   * @param id - 会话 ID
   * @returns 会话详情和消息列表
   * @decorator @Get('conversation') - 处理 GET /chat/conversation 请求
   */
  @Get('conversation')
  async getConversationDetail(
    @Query('userId') userId: number,
    @Query('id') id: number,
  ) {
    return this.chatService.getConversationDetail(userId, id);
  }

  /**
   * 流式消息接口（SSE）
   * @description 接收用户消息，通过 SSE 流式返回 AI 回复
   * @param req - HTTP 请求对象，用于监听连接关闭
   * @param body - 请求体，包含会话 ID 和用户消息
   * @param res - HTTP 响应对象，用于流式输出
   * @decorator @Post('stream') - 处理 POST /chat/stream 请求
   */
  @Post('stream')
  async streamMessage(
    @Req() req,
    @Body() body: { conversationId: number; message: string },
    @Res() res: Response,
  ) {
    const { conversationId, message } = body;
    // 验证必要参数
    if (!conversationId || !message) {
      throw new BadRequestException('Missing conversationId or message');
    }

    // 设置 SSE 响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // 标记连接是否已断开
    let isAborted = false;

    // 监听客户端断开连接事件
    req.on('close', () => {
      isAborted = true;
      console.log('客户端连接已断开，停止流输出');
    });
    console.log('开始对话');

    try {
      // 调用服务生成流式回复
      const streamGenerator = await this.chatService.generateStream(
        conversationId,
        message,
      );

      // 逐块输出 AI 回复
      for await (const chunk of streamGenerator) {
        if (isAborted) {
          break; // 客户端断开时停止生成
        }
        res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
      }

      // 发送流结束标记
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error) {
      // 发生错误时返回错误事件
      console.error('Streaming error:', error);
      res.write(
        `event: error\ndata: ${JSON.stringify({ message: 'Internal Server Error' })}\n\n`,
      );
      res.end();
    }
  }
}
