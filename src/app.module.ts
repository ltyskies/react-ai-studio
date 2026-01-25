import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import configuration from './config/configuration';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [UserModule,JwtModule,ChatModule,
    AuthModule,
    // 1. 全局配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),

    // 2. 异步加载数据库模块
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql', 
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.database'),
        autoLoadEntities: true,
        synchronize: configService.get<boolean>('database.synchronize'),
        // 连接策略
        retryDelay: 500,
        retryAttempts: 10,
      }),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
