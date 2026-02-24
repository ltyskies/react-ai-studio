/**
 * @file user.controller.spec.ts
 * @description UserController 的单元测试
 * @module 测试模块 - 用户模块
 */

import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';

/**
 * UserController 测试套件
 * @description 测试 UserController 的基本功能
 */
describe('UserController', () => {
  /** UserController 实例 */
  let controller: UserController;

  /**
   * 每个测试用例执行前的初始化
   * @description 创建测试模块并编译
   */
  beforeEach(async () => {
    // 创建测试模块，导入控制器和服务
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [UserService],
    }).compile();

    // 获取控制器实例
    controller = module.get<UserController>(UserController);
  });

  /**
   * 控制器实例化测试
   * @description 验证 UserController 是否成功实例化
   */
  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
