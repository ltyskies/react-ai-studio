/**
 * @file chat.module.ts
 * @description 聊天模块，提供 AI 对话和会话管理功能
 * @module 聊天模块
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';

/**
 * 聊天模块
 * @description 整合聊天相关的控制器、服务和实体，管理 AI 对话流程
 * @decorator @Module - 定义 NestJS 模块
 */
@Module({
  imports: [
    // 导入 TypeORM 实体，用于会话和消息的数据库操作
    TypeOrmModule.forFeature([Conversation, Message]),
  ],
  controllers: [ChatController], // 注册聊天控制器
  providers: [ChatService], // 注册聊天服务
})
export class ChatModule {}
