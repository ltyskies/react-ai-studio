import { Injectable } from '@nestjs/common';
import { UserDto } from './dto/user.dto';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Result } from 'src/common/Result';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly user: Repository<User>,
    private jwt: JwtService,
    private configService: ConfigService,
  ) {}

  token(id: number): string {
    return this.jwt.sign(
      { id },
      { secret: this.configService.get('jwt.secret') },
    );
  }
  async register(registerUserDto: UserDto) {
    const existingUser = await this.user.findOne({
      where: { email: registerUserDto.email },
    });
    if (existingUser) {
      return Result.error('该邮箱已被注册');
    }

    const user = new User();
    user.email = registerUserDto.email;
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(registerUserDto.password, salt);

    await this.user.save(user);
    return Result.successWithData('注册成功');
  }

  async login(loginUserDto: UserDto) {
    const { email, password } = loginUserDto;

    const user = await this.user.findOne({ where: { email } });

    if (!user) {
      return Result.error('用户不存在');
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return Result.error('密码错误');
    }
    const { password: _, ...result } = user;

    return Result.successWithData({
      ...result,
      token: this.token(user.id),
    });
  }
}
