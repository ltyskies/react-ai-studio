import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
@Injectable()
// 这里的 Strategy 必须是从 'passport-jwt' 引入的
export class JwtStrategy extends PassportStrategy(Strategy) { 
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'sky', 
    });
  }

  // 验证 payload，并返回 request.user
  async validate(payload: any) {
    // 返回的对象会被注入到 request.user 中
   return { userId: payload.id };
  }
}