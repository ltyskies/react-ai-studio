/**
 * @file user.controller.ts
 * @description 用户控制器，处理用户相关的 HTTP 请求
 * @module 用户模块
 */

import { Controller, Post, Body } from '@nestjs/common';
import { UserService } from './user.service';
import { UserDto } from './dto/user.dto';
import { ApiTags } from '@nestjs/swagger';

/**
 * 用户控制器
 * @description 处理用户注册、登录等接口请求
 * @decorator @Controller('user') - 定义路由前缀为 /user
 * @decorator @ApiTags('User') - Swagger 文档标签
 */
@Controller('user')
@ApiTags('User')
@Controller('user')
export class UserController {
  /**
   * 构造函数，注入 UserService
   * @param userService - 用户服务实例
   */
  constructor(private readonly userService: UserService) {}

  /**
   * 用户登录
   * @description 验证用户邮箱和密码，返回登录结果和 JWT Token
   * @param loginUserDto - 登录数据传输对象，包含邮箱和密码
   * @returns 登录结果，成功时包含用户信息和 Token
   * @decorator @Post('login') - 处理 POST /user/login 请求
   */
  @Post('login')
  login(@Body() loginUserDto: UserDto) {
    return this.userService.login(loginUserDto);
  }

  /**
   * 用户注册
   * @description 创建新用户账号，邮箱需唯一
   * @param registerUserDto - 注册数据传输对象，包含邮箱和密码
   * @returns 注册结果
   * @decorator @Post('register') - 处理 POST /user/register 请求
   */
  @Post('register')
  register(@Body() registerUserDto: UserDto) {
    return this.userService.register(registerUserDto);
  }
}
