
export class Result<T> {
  code: number; // 编码
  data?: T | null; // 数据

  constructor(code: number, data?: T | null) {
    this.code = code;
    this.data = data;
  }

  /**
   * 返回成功的响应结果（无数据）
   */
  static success<T>(): Result<T> {
    return new Result<T>(200);
  }

  /**
   * 返回成功的响应结果（带数据）
   * @param data 响应数据
   */
  static successWithData<T>(data: T): Result<T> {
    return new Result<T>(200, data);
  }

  /**
   * 返回错误的响应结果
   * @param msg 错误消息
   */
  static error<T>(msg: T): Result<T> {
    return new Result<T>(500, msg);
  }
}