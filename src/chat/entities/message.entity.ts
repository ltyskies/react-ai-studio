/**
 * @file message.entity.ts
 * @description 消息实体定义，映射数据库 messages 表
 * @module 聊天模块 - 实体
 */

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Conversation } from './conversation.entity';

/**
 * 消息角色枚举
 * @description 定义消息发送者的角色类型
 */
export enum MessageRole {
  /** 用户发送的消息 */
  USER = 'user',
  /** AI 助手发送的消息 */
  ASSISTANT = 'assistant',
  /** 系统消息 */
  SYSTEM = 'system',
}

/**
 * 消息实体
 * @description 定义聊天消息的数据结构和数据库表映射关系
 *              每条消息属于一个会话
 * @decorator @Entity('messages') - 映射到数据库 messages 表
 */
@Entity('messages')
export class Message {
  /**
   * 消息唯一标识
   * @description 自增主键，唯一标识每条消息
   * @decorator @PrimaryGeneratedColumn() - 主键自增列
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * 所属会话 ID
   * @description 该消息所属的会话标识
   * @decorator @Column({ name: 'conversation_id' }) - 映射到 conversation_id 列
   */
  @Column({ name: 'conversation_id' })
  conversationId: number;

  /**
   * 消息角色
   * @description 消息发送者的角色：用户、助手或系统
   * @decorator @Column({ type: 'enum', enum: ['user', 'assistant', 'system'] }) - 枚举类型列
   */
  @Column({ type: 'enum', enum: ['user', 'assistant', 'system'] })
  role: 'user' | 'assistant' | 'system';

  /**
   * 消息内容
   * @description 消息的文本内容
   * @decorator @Column({ type: 'text' }) - 文本类型列，支持长文本
   */
  @Column({ type: 'text' })
  content: string;

  /**
   * 创建时间
   * @description 消息发送时间，自动记录
   * @decorator @CreateDateColumn({ name: 'created_at' }) - 自动记录创建时间
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /**
   * 所属会话
   * @description 多对一关联，每条消息属于一个会话
   * @decorator @ManyToOne - 定义多对一关系
   * @decorator @JoinColumn - 指定关联列
   */
  @ManyToOne(() => Conversation, (conversation) => conversation.messages)
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;
}
