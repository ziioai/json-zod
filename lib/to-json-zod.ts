/**
 * 将 Zod Schema 转换为 json-zod 对象的功能
 *
 * 注意：这是一个相对复杂的功能，因为需要反向工程 Zod Schema 的结构。
 * 目前实现的是基础版本，主要支持常见的 Zod Schema 类型。
 */

import type { z } from 'zod/v4';
import type { ZodJsonRoot, ZodJson, ZodJsonParam } from './types.js';

/**
 * 将 Zod Schema 转换为 json-zod 对象
 *
 * @param schema - 要转换的 Zod Schema
 * @returns 对应的 json-zod 对象
 *
 * @warning 这个功能目前是实验性的，可能无法处理所有复杂的 Zod Schema
 */
export function toZodJson(schema: z.ZodSchema): ZodJsonRoot {
  // 这是一个复杂的反向工程过程
  // 由于 Zod Schema 的内部结构比较复杂，完整实现需要大量工作
  // 这里提供一个基础的框架实现

  /**
   * 递归转换 Zod Schema 到 ZodJson
   */
  const convertSchema = (schema: z.ZodSchema): ZodJson => {
    const typeName = (schema._def as any).typeName;

    switch (typeName) {
      case 'ZodString':
        return { _schema: 'json-zod', method: 'string' };

      case 'ZodNumber':
        return { _schema: 'json-zod', method: 'number' };

      case 'ZodBoolean':
        return { _schema: 'json-zod', method: 'boolean' };

      case 'ZodArray': {
        const arrayDef = schema._def as any;
        const elementSchema = convertSchema(arrayDef.type);
        return {
          _schema: 'json-zod',
          method: 'array',
          params: [elementSchema]
        };
      }

      case 'ZodObject': {
        const objectDef = schema._def as any;
        const shape: Record<string, ZodJson> = {};

        for (const [key, value] of Object.entries(objectDef.shape())) {
          shape[key] = convertSchema(value as z.ZodSchema);
        }

        return {
          _schema: 'json-zod',
          method: 'object',
          params: [shape]
        };
      }

      case 'ZodOptional': {
        const optionalDef = schema._def as any;
        const innerSchema = convertSchema(optionalDef.innerType);
        return {
          ...innerSchema,
          tail: [...(innerSchema.tail || []), ['optional']]
        };
      }

      default:
        throw new Error(`[json-zod] toZodJson: Unsupported Zod type: ${typeName}`);
    }
  };

  const rootSchema = convertSchema(schema);

  return {
    schema: rootSchema
  };
}
