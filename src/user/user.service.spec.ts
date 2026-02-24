/**
 * @file user.service.spec.ts
 * @description UserService 的单元测试
 * @module 测试模块 - 用户模块
 */

import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';

/**
 * UserService 测试套件
 * @description 测试 UserService 的基本功能
 */
describe('UserService', () => {
  /** UserService 实例 */
  let service: UserService;

  /**
   * 每个测试用例执行前的初始化
   * @description 创建测试模块并编译
   */
  beforeEach(async () => {
    // 创建测试模块，导入 UserService
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService],
    }).compile();

    // 获取服务实例
    service = module.get<UserService>(UserService);
  });

  /**
   * 服务实例化测试
   * @description 验证 UserService 是否成功实例化
   */
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
