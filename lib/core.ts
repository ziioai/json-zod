/**
 * json-zod 核心功能实现
 * 包含从 JSON 到 Zod Schema 的转换和反向转换
 */

import { z } from 'zod/v4';
import type {
  ZodJsonRoot,
  ZodJson,
  ZodJsonParam,
  ZodJsonRef,
  ZodJsonFunctionSpec
} from './types';

// =================================================================
// 辅助函数
// =================================================================

/**
 * 一个辅助函数，用于安全地从对象中获取嵌套属性。
 * 例如 get(z, 'coerce.string') 会返回 z.coerce.string 函数。
 * @param obj - 源对象 (例如 zod 模块)
 * @param path - 属性路径 (例如 'coerce.string')
 * @returns - 获取到的属性值，如果不存在则为 undefined
 */
const get = (obj: any, path: string): any =>
  path.split('.').reduce((acc, part) => acc?.[part], obj);

// =================================================================
// 主要功能：从 JSON 转换为 Zod Schema
// =================================================================

/**
 * 将 json-zod 对象转换为 Zod Schema 的主函数。
 * @param root - 符合 ZodJsonRoot 规范的 json-zod 对象。
 * @returns 一个可用的 z.ZodSchema 实例。
 */
export function fromZodJson(root: ZodJsonRoot): z.ZodSchema {
  /**
   * 用于缓存已解析的 definitions，以处理递归和提高性能。
   * 键是 definition 的 id，值是对应的 ZodSchema。
   */
  const definitionCache = new Map<string, z.ZodSchema>();

  /**
   * 递归解析器，是整个功能的核心。
   * 它可以处理任何符合 ZodJsonParam 规范的节点。
   * @param node - 当前需要解析的节点。
   * @returns 解析后的结果 (可能是 ZodSchema，也可能是普通值或函数)。
   */
  const parseNode = (node: ZodJsonParam): any => {
    // 如果是基础类型，直接返回
    if (typeof node !== 'object' || node === null) {
      return node;
    }

    // 如果是数组，则递归解析数组中的每一项
    if (Array.isArray(node)) {
      return node.map(item => parseNode(item));
    }

    // --- 处理我们定义的特殊对象类型 ---

    // A. 处理引用 (`_is: "ref"`)
    if ('_is' in node && node._is === 'ref') {
      const refNode = node as ZodJsonRef;
      const refId = refNode.id;
      if (!root.definitions || !root.definitions[refId]) {
        throw new Error(`[json-zod] Definition not found for ref: "${refId}"`);
      }

      // 如果缓存中已有，直接返回
      if (definitionCache.has(refId)) {
        const cached = definitionCache.get(refId);
        if (cached === undefined) {
          throw new Error(`[json-zod] Cached definition is unexpectedly undefined for ref: "${refId}"`);
        }
        return cached;
      }

      // **处理递归的关键**:
      // 我们先用 z.lazy() 创建一个惰性 schema 并立即放入缓存。
      // 真正的解析操作 (parseNode) 会在 lazy schema 第一次被使用时才执行。
      const lazySchema = z.lazy(() => {
        if (!root.definitions) {
          throw new Error(`[json-zod] Definitions are undefined when resolving ref: "${refId}"`);
        }
        const definition = root.definitions[refId];
        if (!definition) {
          throw new Error(`[json-zod] Definition not found for ref: "${refId}"`);
        }
        return parseNode(definition);
      });
      definitionCache.set(refId, lazySchema);
      return lazySchema;
    }

    // B. 处理函数 (`_is: "function"`)
    if ('_is' in node && node._is === 'function') {
      const funcNode = node as ZodJsonFunctionSpec;
      // 警告: new Function() 具有安全风险，类似于 eval()。
      // 确保只在完全信任的 JSON 输入上使用此功能。
      try {
        // 我们假设函数体是箭头函数的形式，并尝试提取参数名。
        // 如果失败，则默认参数名为 'data'。
        const code = funcNode.code;
        const argMatch = code.match(/^(?:\s*async\s*)?(?:\s*function\s*)?\(?\s*([a-zA-Z0-9_$]+)\s*\)?\s*=>/);
        const argName = argMatch?.[1] ?? 'data';
        return new Function(argName, `return (${code})(${argName})`);
      } catch (e: any) {
        throw new Error(`[json-zod] Failed to parse function code: "${funcNode.code}". Error: ${e.message}`);
      }
    }

    // C. 处理 ZodJson 核心对象 (`_schema: "json-zod"`)
    if ('_schema' in node && node._schema === 'json-zod') {
      const zodNode = node as ZodJson;
      // 1. 获取 Zod 的基础方法 (例如 z.string, z.object)
      if (typeof zodNode.method !== 'string') {
        throw new Error(`[json-zod] Invalid method type: expected string, got ${typeof zodNode.method}`);
      }
      const methodFn = get(z, zodNode.method);
      if (typeof methodFn !== 'function') {
        throw new Error(`[json-zod] Unknown Zod method: "z.${zodNode.method}"`);
      }

      // 2. 递归解析该方法所需的所有参数
      const params = zodNode.params ? parseNode(zodNode.params) : [];

      // 3. 调用方法，创建基础 schema
      let schema: z.ZodSchema = methodFn(...params);

      // 4. 如果有 tail，则依次调用链式方法
      if (Array.isArray(zodNode.tail)) {
        for (const [tailMethodName, tailMethodParams] of zodNode.tail) {
          const tailMethodFn = (schema as any)[tailMethodName];
          if (typeof tailMethodFn !== 'function') {
            throw new Error(`[json-zod] Unknown Zod tail method: ".${tailMethodName}()" on "z.${zodNode.method}"`);
          }
          const parsedTailParams = tailMethodParams ? parseNode(tailMethodParams) : [];
          schema = tailMethodFn.apply(schema, parsedTailParams);
        }
      }
      return schema;
    }

    // 如果是一个普通的 Record<string, any> (用于 z.object 的 shape)，
    // 则递归解析它的每一个值。
    const result: Record<string, any> = {};
    for (const key in node) {
      if (Object.prototype.hasOwnProperty.call(node, key)) {
        result[key] = parseNode((node as any)[key]);
      }
    }
    return result;
  };

  // 从根节点的 schema 字段开始解析
  return parseNode(root.schema);
}

// =================================================================
// 主要功能：从 Zod Schema 转换为 JSON（简化版本）
// =================================================================

/**
 * 将 Zod Schema 转换为 json-zod 格式的函数（简化实现）。
 * 注意：这是一个简化版本，仅支持基本的 Zod 类型。
 * 完整实现需要处理所有 Zod 类型和链式调用。
 *
 * @param schema - Zod Schema 实例
 * @returns json-zod 格式的对象
 */
export function toZodJson(schema: z.ZodSchema): ZodJsonRoot {
  // 这是一个占位实现，实际的反向转换比较复杂
  // 需要深入分析 Zod Schema 的内部结构
  throw new Error('[json-zod] toZodJson 功能尚未完全实现，这是一个复杂的反向工程过程');
}
