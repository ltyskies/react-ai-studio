import { ApiProperty } from '@nestjs/swagger';

export class UserDto {
  @ApiProperty({ description: '邮箱' })
  email: string;

  @ApiProperty({ description: '密码' })
  password: string;
}
