import { Injectable } from '@nestjs/common';
import { UserDto } from './dto/user.dto';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Result } from 'src/common/Result';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly user: Repository<User>,
    private jwt: JwtService,
  ) {}

  token(id: number): string {
    return this.jwt.sign({ id }, { secret: 'sky' });
  }
  async register(registerUserDto: UserDto) {
    // 检查邮箱是否已存在
    const existingUser = await this.user.findOne({
      where: { email: registerUserDto.email },
    });
    if (existingUser) {
      return Result.error('该邮箱已被注册');
    }

    const user = new User();
    user.email = registerUserDto.email;

    // 2. 注册时加密：使用 salt 迭代 10 次
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

    // 3. 登录时校验：比对明文密码和数据库里的哈希值
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return Result.error('密码错误');
    }

    // 脱敏处理
    const { password: _, ...result } = user;

    return Result.successWithData({
      ...result,
      token: this.token(user.id),
    });
  }
}
