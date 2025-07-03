/**
 * json-zod 库的简化使用示例
 * 展示基本的使用场景
 */

import { fromZodJson } from '../lib/from-json-zod.js';
import type { ZodJsonRoot } from '../lib/types.js';

// ===============================
// 示例 1: 简单的用户验证
// ===============================

export const simpleUserSchema: ZodJsonRoot = {
  schema: {
    _schema: 'json-zod',
    method: 'object',
    params: [{
      name: {
        _schema: 'json-zod',
        method: 'string',
        tail: [['min', [2]]]
      },
      email: {
        _schema: 'json-zod',
        method: 'email'
      },
      age: {
        _schema: 'json-zod',
        method: 'number',
        tail: [['min', [0]], ['max', [120]]]
      }
    }]
  }
};

// ===============================
// 示例 2: 带可选字段的产品信息
// ===============================

export const productSchema: ZodJsonRoot = {
  schema: {
    _schema: 'json-zod',
    method: 'object',
    params: [{
      id: {
        _schema: 'json-zod',
        method: 'uuid'
      },
      name: {
        _schema: 'json-zod',
        method: 'string',
        tail: [['min', [1]]]
      },
      price: {
        _schema: 'json-zod',
        method: 'number',
        tail: [['positive']]
      },
      description: {
        _schema: 'json-zod',
        method: 'string',
        tail: [['optional']]
      },
      category: {
        _schema: 'json-zod',
        method: 'union',
        params: [[
          {
            _schema: 'json-zod',
            method: 'literal',
            params: ['electronics']
          },
          {
            _schema: 'json-zod',
            method: 'literal',
            params: ['clothing']
          },
          {
            _schema: 'json-zod',
            method: 'literal',
            params: ['books']
          }
        ]]
      },
      tags: {
        _schema: 'json-zod',
        method: 'array',
        params: [{
          _schema: 'json-zod',
          method: 'string'
        }]
      },
      inStock: {
        _schema: 'json-zod',
        method: 'boolean'
      }
    }]
  }
};

// ===============================
// 示例 3: 递归的评论系统
// ===============================

export const commentSystemSchema: ZodJsonRoot = {
  definitions: {
    Comment: {
      _schema: 'json-zod',
      method: 'object',
      params: [{
        id: {
          _schema: 'json-zod',
          method: 'string'
        },
        content: {
          _schema: 'json-zod',
          method: 'string',
          tail: [['min', [1]]]
        },
        author: {
          _schema: 'json-zod',
          method: 'string'
        },
        timestamp: {
          _schema: 'json-zod',
          method: 'coerce.date'
        },
        replies: {
          _schema: 'json-zod',
          method: 'array',
          params: [{
            _is: 'ref',
            id: 'Comment'
          }]
        }
      }]
    }
  },
  schema: {
    _is: 'ref',
    id: 'Comment'
  }
};

// ===============================
// 使用示例
// ===============================

export function validateUser(data: unknown) {
  const schema = fromZodJson(simpleUserSchema);
  return schema.parse(data);
}

export function validateProduct(data: unknown) {
  const schema = fromZodJson(productSchema);
  return schema.parse(data);
}

export function validateComment(data: unknown) {
  const schema = fromZodJson(commentSystemSchema);
  return schema.parse(data);
}

// ===============================
// 动态生成简单表单 Schema
// ===============================

export function createSimpleFormSchema(
  fields: Record<string, 'string' | 'number' | 'email' | 'boolean'>
): ZodJsonRoot {
  const shape: Record<string, any> = {};

  for (const [fieldName, fieldType] of Object.entries(fields)) {
    shape[fieldName] = {
      _schema: 'json-zod',
      method: fieldType === 'email' ? 'email' : fieldType
    };
  }

  return {
    schema: {
      _schema: 'json-zod',
      method: 'object',
      params: [shape]
    }
  };
}

// 示例使用动态生成器
export const dynamicFormSchema = createSimpleFormSchema({
  firstName: 'string',
  lastName: 'string',
  email: 'email',
  age: 'number',
  isSubscribed: 'boolean'
});
