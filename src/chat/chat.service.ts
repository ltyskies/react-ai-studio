/**
 * @file chat.service.ts
 * @description 聊天服务，处理 AI 对话核心业务逻辑
 * @module 聊天模块
 */

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from './entities/conversation.entity';
import { Message, MessageRole } from './entities/message.entity';
import {
  HumanMessage,
  AIMessage,
  SystemMessage,
  BaseMessage,
} from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import { ConfigService } from '@nestjs/config';
import { Result } from 'src/common/Result';

/**
 * 聊天服务
 * @description 提供会话管理、消息存储和 AI 流式对话功能
 * @decorator @Injectable() - 标记为可注入服务
 */
@Injectable()
export class ChatService {
  /** LangChain AI 模型实例 */
  private chatModel: ChatOpenAI;

  /**
   * 构造函数，初始化 AI 模型和注入依赖
   * @param conversationRepo - 会话实体仓库
   * @param messageRepo - 消息实体仓库
   * @param configService - 配置服务，用于读取 AI 配置
   */
  constructor(
    @InjectRepository(Conversation)
    private conversationRepo: Repository<Conversation>,
    @InjectRepository(Message)
    private messageRepo: Repository<Message>,
    private configService: ConfigService,
  ) {
    // 从配置读取 DeepSeek API 配置
    const apiKey = this.configService.get<string>('ai.deepseek.apiKey');
    const baseURL = this.configService.get<string>('ai.deepseek.baseUrl');
    const modelName = this.configService.get<string>('ai.deepseek.model');

    // 初始化 LangChain ChatOpenAI 模型（适配 DeepSeek API）
    this.chatModel = new ChatOpenAI({
      // DeepSeek 官方 API 地址
      configuration: {
        baseURL: baseURL,
      },
      apiKey: apiKey,
      // 指定使用的模型
      modelName: modelName,
      // 启用流式输出
      streaming: true,
      // 温度参数，控制回复的创造性（0-1，越高越创造性）
      temperature: 0.7,
    });
  }

  /**
   * 创建新会话
   * @description 为指定用户创建一个新的对话会话
   * @param userId - 用户 ID
   * @returns 包含新会话 ID 的结果对象
   */
  async createConversation(userId: number) {
    // 创建会话实体
    const conversation = this.conversationRepo.create({
      userId,
      title: '新对话',
    });
    // 保存到数据库
    const savedConversation = await this.conversationRepo.save(conversation);

    return Result.successWithData(savedConversation.id);
  }

  /**
   * 获取会话详情
   * @description 获取指定会话的详细信息和消息历史，验证用户权限
   * @param userId - 用户 ID，用于权限验证
   * @param conversationId - 会话 ID
   * @returns 包含会话详情和消息列表的结果对象
   * @throws NotFoundException - 会话不存在时抛出
   * @throws ForbiddenException - 用户无权访问时抛出
   */
  async getConversationDetail(userId: number, conversationId: number) {
    // 查询会话及其关联的消息
    const conversation = await this.conversationRepo.findOne({
      where: { id: conversationId },
      relations: ['messages'],
    });

    // 验证会话是否存在
    if (!conversation) throw new NotFoundException('会话不存在');
    console.log('conversation', conversation.userId);
    console.log('userId', userId);

    // 验证用户是否有权访问该会话
    if (conversation.userId != userId)
      throw new ForbiddenException('无权访问此会话');

    // 消息按时间排序（最早的在前面）
    conversation.messages.sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );
    return Result.successWithData(conversation);
  }

  /**
   * 生成流式回复
   * @description 调用 AI 模型生成流式回复，同时保存消息到数据库
   * @param conversationId - 会话 ID
   * @param content - 用户发送的消息内容
   * @returns 异步生成器，逐块返回 AI 回复
   * @throws NotFoundException - 会话不存在时抛出
   */
  async generateStream(
    conversationId: number,
    content: string,
  ): Promise<AsyncGenerator<string>> {
    // 1. 验证会话是否存在
    const session = await this.conversationRepo.findOne({
      where: { id: conversationId },
    });
    if (!session) throw new NotFoundException('Session not found');

    // 2. 保存用户消息到数据库
    await this.saveMessage(conversationId, content, MessageRole.USER);

    // 3. 加载历史消息作为上下文（最近 10 条）
    const history = await this.messageRepo.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
      take: 10,
    });

    // 4. 转换为 LangChain 消息格式
    const messages: BaseMessage[] = [
      // 系统消息，定义 AI 角色
      new SystemMessage('你是一个高级react开发工程师'),
      // 转换历史消息
      ...history.map((msg) => {
        if (msg.role === MessageRole.USER) return new HumanMessage(msg.content);
        return new AIMessage(msg.content);
      }),
      // 当前消息已在步骤 2 保存到历史记录中
    ];

    console.log('messages', messages);

    // 5. 调用 AI 模型，启用流式输出
    const stream = await this.chatModel.stream(messages);

    // 6. 创建生成器函数，捕获上下文以便保存 AI 回复
    const _this = this;

    /**
     * 异步生成器函数
     * @description 逐块输出 AI 回复，完成后保存完整回复到数据库
     */
    async function* generator() {
      let fullResponse = '';
      try {
        // 逐块读取流式输出
        for await (const chunk of stream) {
          const content = chunk.content as string;
          if (content) {
            fullResponse += content;
            yield content;
          }
        }
      } finally {
        // 7. 流结束后保存 AI 回复到数据库
        if (fullResponse) {
          await _this.saveMessage(
            conversationId,
            fullResponse,
            MessageRole.ASSISTANT,
          );
        }
      }
    }

    return generator();
  }

  /**
   * 保存消息
   * @description 将消息保存到数据库
   * @param conversationId - 所属会话 ID
   * @param content - 消息内容
   * @param role - 消息角色（用户/助手/系统）
   * @returns 保存后的消息实体
   * @private
   */
  private async saveMessage(
    conversationId: number,
    content: string,
    role: MessageRole,
  ) {
    // 创建消息实体
    const message = this.messageRepo.create({ conversationId, content, role });
    // 保存到数据库
    return this.messageRepo.save(message);
  }
}
