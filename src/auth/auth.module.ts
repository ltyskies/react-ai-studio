// auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy'; // 1. 务必引入你写的策略文件

@Module({
  imports: [
    // 2. 注册 Passport 并设置默认策略名
    PassportModule.register({ defaultStrategy: 'jwt' }),
    // 3. 配置 JWT
    JwtModule.register({
      secret: 'sky', 
      signOptions: { expiresIn: '120h' },
    }),
  ],
  // 4. 🔥 重点：必须把 JwtStrategy 放在这里，Passport 才能识别到它
  providers: [JwtStrategy], 
  // 5. 导出以便其他 Module（如 UserModule）可以使用
  exports: [PassportModule, JwtModule], 
})
export class AuthModule {}