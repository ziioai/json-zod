/**
 * json-zod 核心类型定义
 * 基于项目设计文档中的类型系统
 */

// =================================================================
// 根结构 (Root Structure)
// =================================================================

/**
 * json-zod 文档的根对象。
 */
export interface ZodJsonRoot {
  /**
   * 用于存放可被复用的、命名的 ZodJson 定义。
   * 主要用于实现递归类型。
   */
  definitions?: Record<string, ZodJson>;

  /**
   * 主 schema 的定义。
   * 它可以是一个内联的 ZodJson 对象，也可以是对 definitions 中某一项的引用。
   */
  schema: ZodJson | ZodJsonRef;
}

// =================================================================
// 核心类型 (Core Types)
// =================================================================

/**
 * json-zod 的核心结构。
 * 描述了如何调用一个 Zod 方法来创建一个 schema。
 */
export interface ZodJson {
  _schema: 'json-zod';

  /**
   * Zod 的方法名，支持用点号表示命名空间。
   * 例如: 'object', 'string', 'coerce.string', 'iso.datetime'
   */
  method: string;

  /**
   * 传递给 method 的参数数组。
   * 这种统一的数组结构可以适配 Zod 的所有方法。
   */
  params?: ZodJsonParam[];

  /**
   * 用于表示链式调用，例如 .optional(), .min(5)。
   */
  tail?: ZodJsonTailItem[];
}

/**
 * 表示一次链式调用。
 * 是一个元组，第一项是方法名，第二项是可选的参数数组。
 * 例如：['min', [5]] 或 ['optional']
 */
export type ZodJsonTailItem = [method: string, params?: ZodJsonParam[]];

// =================================================================
// 参数与特殊类型 (Params & Special Types)
// =================================================================

export type BasicJsonLiteralType = string | number | boolean | null;

/**
 * 定义一个参数可以是哪些类型。
 */
export type ZodJsonParam =
  | BasicJsonLiteralType
  | ZodJson
  | ZodJsonRef
  | ZodJsonFunctionSpec
  | Record<string, ZodJson | ZodJsonRef> // 用于 z.object(shape) 的 shape
  | ZodJsonParam[]; // 用于参数是数组的情况

/**
 * 用于表示对 definitions 中某个 schema 的引用。
 */
export interface ZodJsonRef {
  _is: "ref";
  /**
   * 在 definitions 中定义的 schema 的 ID (key)。
   */
  id: string;
}

/**
 * 用于表示可执行的函数体。
 * @property _is - 类型标识
 * @property code - 函数体的字符串表示。
 * @warning 执行此代码时需要注意安全风险，避免使用 eval。建议使用安全的沙箱或函数注册表机制。
 */
export interface ZodJsonFunctionSpec {
  _is: "function",
  code: string,
}
