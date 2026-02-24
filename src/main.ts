/**
 * @file main.ts
 * @description 应用程序入口文件，负责创建 NestJS 应用实例并配置相关中间件
 * @module 核心入口模块
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { HttpFilter } from './common/filter';
import cors from 'cors';

/**
 * 启动应用程序
 * @description 创建 NestJS 应用实例，配置 Swagger 文档、全局异常过滤器和跨域支持
 */
async function bootstrap() {
  // 创建 NestJS 应用实例，使用 Express 平台
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 配置 Swagger API 文档
  const options = new DocumentBuilder()
    .addBearerAuth() // 添加 Bearer Token 认证支持
    .setTitle('接口文档') // API 文档标题
    .setDescription('后端') // API 文档描述
    .setVersion('1') // API 版本号
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('/api', app, document); // 在 /api 路径挂载 Swagger UI

  // 注册全局异常过滤器，统一处理 HTTP 异常
  app.useGlobalFilters(new HttpFilter());

  // 启用跨域支持，允许前端应用访问
  app.use(cors());

  // 启动应用，监听 3000 端口
  await app.listen(3000);
}

// 执行启动函数
bootstrap();
