import { Controller, Post, Body } from '@nestjs/common';
import { UserService } from './user.service';
import { UserDto } from './dto/user.dto';
import { ApiTags } from '@nestjs/swagger';

@Controller('user')
@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('login')
  login(@Body() loginUserDto: UserDto) {
    return this.userService.login(loginUserDto);
  }
  
  @Post('register')
  register(@Body() registerUserDto: UserDto) {
    return this.userService.register(registerUserDto);
  }
}
