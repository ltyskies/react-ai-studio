/**
 * @file conversation.entity.ts
 * @description 会话实体定义，映射数据库 conversations 表
 * @module 聊天模块 - 实体
 */

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Message } from './message.entity';

/**
 * 会话实体
 * @description 定义对话会话的数据结构和数据库表映射关系
 *              一个会话包含多条消息，属于一个用户
 * @decorator @Entity('conversations') - 映射到数据库 conversations 表
 */
@Entity('conversations')
export class Conversation {
  /**
   * 会话唯一标识
   * @description 自增主键，唯一标识每个会话
   * @decorator @PrimaryGeneratedColumn() - 主键自增列
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * 所属用户 ID
   * @description 创建该会话的用户标识
   * @decorator @Column({ name: 'user_id' }) - 映射到 user_id 列
   */
  @Column({ name: 'user_id' })
  userId: number;

  /**
   * 会话标题
   * @description 会话的显示标题，默认为 "New Chat"
   * @decorator @Column({ default: 'New Chat' }) - 默认值为 "New Chat"
   */
  @Column({ default: 'New Chat' })
  title: string;

  /**
   * 创建时间
   * @description 会话创建时间，自动记录
   * @decorator @CreateDateColumn({ name: 'created_at' }) - 自动记录创建时间
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /**
   * 更新时间
   * @description 会话最后更新时间，自动记录
   * @decorator @UpdateDateColumn({ name: 'updated_at' }) - 自动记录更新时间
   */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  /**
   * 会话消息列表
   * @description 一对多关联，一个会话包含多条消息
   * @decorator @OneToMany - 定义一对多关系
   */
  @OneToMany(() => Message, (message) => message.conversation)
  messages: Message[];
}
