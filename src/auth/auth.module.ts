import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy'; 
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    // 注册 Passport 并设置默认策略名
    PassportModule.register({ defaultStrategy: 'jwt' }),
    //  配置 JWT
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: { expiresIn: '120h' },
      })
    }),
  ],
  providers: [JwtStrategy], 
  exports: [PassportModule, JwtModule], 
})
export class AuthModule {}