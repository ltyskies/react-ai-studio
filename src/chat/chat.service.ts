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

@Injectable()
export class ChatService {
  private chatModel: ChatOpenAI;
  constructor(
    @InjectRepository(Conversation)
    private conversationRepo: Repository<Conversation>,
    @InjectRepository(Message)
    private messageRepo: Repository<Message>,
    private configService: ConfigService
  ) {
    const apiKey = this.configService.get<string>('ai.deepseek.apiKey');
    const baseURL = this.configService.get<string>('ai.deepseek.baseUrl');
    const modelName = this.configService.get<string>('ai.deepseek.model');
    this.chatModel = new ChatOpenAI({
      // DeepSeek 官方 API 地址
      configuration: {
        baseURL: baseURL,
      },
      apiKey: apiKey,
      // 指定使用的模型
      modelName: modelName,
      // 流式输出配置
      streaming: true,
      temperature: 0.7,
    });
  }

  // 1. 创建新会话
  async createConversation(userId: number): Promise<Conversation> {
    const conversation = this.conversationRepo.create({
      userId,
      title: '新对话',
    });
    return this.conversationRepo.save(conversation);
  }

  // 2. 获取单个会话详情
  async getConversationDetail(userId: number, conversationId: number) {
    const conversation = await this.conversationRepo.findOne({
      where: { id: conversationId },
      relations: ['messages'],
    });

    if (!conversation) throw new NotFoundException('会话不存在');
    console.log('conversation', conversation.userId);
    console.log('userId', userId);
    if (conversation.userId != userId)
      throw new ForbiddenException('无权访问此会话');

    // 消息按时间排序
    conversation.messages.sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );
    return conversation;
  }

  // 4. 核心功能：流式聊天
  async generateStream(
    conversationId: number,
    content: string,
  ): Promise<AsyncGenerator<string>> {
    // 1. Validate Session
    const session = await this.conversationRepo.findOne({
      where: { id: conversationId },
    });
    if (!session) throw new NotFoundException('Session not found');

    // 2. Save User Message
    await this.saveMessage(conversationId, content, MessageRole.USER);

    // 3. Load Context (Memory) - Get last 10 messages
    const history = await this.messageRepo.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
      take: 20,
    });

    // 4. Convert to LangChain format
    const messages: BaseMessage[] = [
      new SystemMessage('You are a helpful AI assistant powered by DeepSeek.'),
      ...history.map((msg) => {
        if (msg.role === MessageRole.USER) return new HumanMessage(msg.content);
        return new AIMessage(msg.content);
      }),
      // The current message is already in history because we saved it in step 2
    ];

    console.log('messages', messages);

    // 5. Call AI with Streaming
    const stream = await this.chatModel.stream(messages);

    // 6. Return Generator and Aggregate Response
    const _this = this; // Capture context for saving later

    async function* generator() {
      let fullResponse = '';
      try {
        for await (const chunk of stream) {
          const content = chunk.content as string;
          if (content) {
            fullResponse += content;
            yield content;
          }
        }
      } finally {
        // 7. Save Assistant Response upon completion
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

  private async saveMessage(
    conversationId: number,
    content: string,
    role: MessageRole,
  ) {
    const message = this.messageRepo.create({ conversationId, content, role });
    return this.messageRepo.save(message);
  }
}
