/**
 * json-zod 库的使用示例
 * 展示如何在实际项目中使用 json-zod
 */

import { fromZodJson } from '../lib/from-json-zod.js';
import type { ZodJsonRoot } from '../lib/types.js';

// ===============================
// 示例 1: 用户注册表单验证
// ===============================

export const userRegistrationSchema: ZodJsonRoot = {
  schema: {
    _schema: 'json-zod',
    method: 'object',
    params: [{
      username: {
        _schema: 'json-zod',
        method: 'string',
        tail: [
          ['min', [3, 'Username must be at least 3 characters']],
          ['max', [20, 'Username must be less than 20 characters']],
          ['regex', [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']]
        ]
      },
      email: {
        _schema: 'json-zod',
        method: 'email'
      },
      password: {
        _schema: 'json-zod',
        method: 'string',
        tail: [
          ['min', [8, 'Password must be at least 8 characters']],
          ['refine', [
            {
              _is: 'function',
              code: 'pwd => /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /[0-9]/.test(pwd)'
            },
            'Password must contain at least one uppercase letter, one lowercase letter, and one number'
          ]]
        ]
      },
      confirmPassword: {
        _schema: 'json-zod',
        method: 'string'
      },
      age: {
        _schema: 'json-zod',
        method: 'number',
        tail: [
          ['min', [13, 'Must be at least 13 years old']],
          ['max', [120, 'Age must be realistic']]
        ]
      },
      terms: {
        _schema: 'json-zod',
        method: 'boolean',
        tail: [
          ['refine', [
            {
              _is: 'function',
              code: 'val => val === true'
            },
            'You must agree to the terms and conditions'
          ]]
        ]
      }
    }],
    tail: [
      ['refine', [
        {
          _is: 'function',
          code: 'data => data.password === data.confirmPassword'
        },
        'Passwords must match'
      ]]
    ]
  }
};

// ===============================
// 示例 2: 博客文章系统（递归结构）
// ===============================

export const blogSystemSchema: ZodJsonRoot = {
  definitions: {
    User: {
      _schema: 'json-zod',
      method: 'object',
      params: [{
        id: {
          _schema: 'json-zod',
          method: 'uuid'
        },
        username: {
          _schema: 'json-zod',
          method: 'string',
          tail: [['min', [1]]]
        },
        email: {
          _schema: 'json-zod',
          method: 'email'
        },
        profile: {
          _schema: 'json-zod',
          method: 'object',
          params: [{
            displayName: {
              _schema: 'json-zod',
              method: 'string'
            },
            bio: {
              _schema: 'json-zod',
              method: 'string',
              tail: [['optional']]
            },
            avatar: {
              _schema: 'json-zod',
              method: 'url',
              tail: [['optional']]
            }
          }]
        },
        createdAt: {
          _schema: 'json-zod',
          method: 'coerce.date'
        }
      }]
    },
    Post: {
      _schema: 'json-zod',
      method: 'object',
      params: [{
        id: {
          _schema: 'json-zod',
          method: 'uuid'
        },
        title: {
          _schema: 'json-zod',
          method: 'string',
          tail: [
            ['min', [1, 'Title is required']],
            ['max', [200, 'Title too long']]
          ]
        },
        content: {
          _schema: 'json-zod',
          method: 'string',
          tail: [['min', [1, 'Content is required']]]
        },
        author: {
          _is: 'ref',
          id: 'User'
        },
        tags: {
          _schema: 'json-zod',
          method: 'array',
          params: [{
            _schema: 'json-zod',
            method: 'string',
            tail: [['min', [1]]]
          }],
          tail: [['max', [10, 'Too many tags']]]
        },
        status: {
          _schema: 'json-zod',
          method: 'union',
          params: [[
            {
              _schema: 'json-zod',
              method: 'literal',
              params: ['draft']
            },
            {
              _schema: 'json-zod',
              method: 'literal',
              params: ['published']
            },
            {
              _schema: 'json-zod',
              method: 'literal',
              params: ['archived']
            }
          ]]
        },
        comments: {
          _schema: 'json-zod',
          method: 'array',
          params: [{
            _is: 'ref',
            id: 'Comment'
          }]
        },
        createdAt: {
          _schema: 'json-zod',
          method: 'coerce.date'
        },
        updatedAt: {
          _schema: 'json-zod',
          method: 'coerce.date',
          tail: [['optional']]
        }
      }]
    },
    Comment: {
      _schema: 'json-zod',
      method: 'object',
      params: [{
        id: {
          _schema: 'json-zod',
          method: 'uuid'
        },
        content: {
          _schema: 'json-zod',
          method: 'string',
          tail: [
            ['min', [1, 'Comment cannot be empty']],
            ['max', [1000, 'Comment too long']]
          ]
        },
        author: {
          _is: 'ref',
          id: 'User'
        },
        post: {
          _schema: 'json-zod',
          method: 'object',
          params: [{
            id: {
              _schema: 'json-zod',
              method: 'uuid'
            },
            title: {
              _schema: 'json-zod',
              method: 'string'
            }
          }]
        },
        replies: {
          _schema: 'json-zod',
          method: 'array',
          params: [{
            _is: 'ref',
            id: 'Comment'
          }]
        },
        createdAt: {
          _schema: 'json-zod',
          method: 'coerce.date'
        }
      }]
    }
  },
  schema: {
    _is: 'ref',
    id: 'Post'
  }
};

// ===============================
// 示例 3: API 响应格式
// ===============================

export const apiResponseSchema: ZodJsonRoot = {
  definitions: {
    ApiResponse: {
      _schema: 'json-zod',
      method: 'object',
      params: [{
        success: {
          _schema: 'json-zod',
          method: 'boolean'
        },
        message: {
          _schema: 'json-zod',
          method: 'string',
          tail: [['optional']]
        },
        data: {
          _schema: 'json-zod',
          method: 'unknown',
          tail: [['optional']]
        },
        errors: {
          _schema: 'json-zod',
          method: 'array',
          params: [{
            _schema: 'json-zod',
            method: 'object',
            params: [{
              field: {
                _schema: 'json-zod',
                method: 'string',
                tail: [['optional']]
              },
              message: {
                _schema: 'json-zod',
                method: 'string'
              },
              code: {
                _schema: 'json-zod',
                method: 'string',
                tail: [['optional']]
              }
            }]
          }],
          tail: [['optional']]
        },
        meta: {
          _schema: 'json-zod',
          method: 'object',
          params: [{
            pagination: {
              _schema: 'json-zod',
              method: 'object',
              params: [{
                page: {
                  _schema: 'json-zod',
                  method: 'number',
                  tail: [['min', [1]]]
                },
                limit: {
                  _schema: 'json-zod',
                  method: 'number',
                  tail: [['min', [1]], ['max', [100]]]
                },
                total: {
                  _schema: 'json-zod',
                  method: 'number',
                  tail: [['min', [0]]]
                },
                pages: {
                  _schema: 'json-zod',
                  method: 'number',
                  tail: [['min', [1]]]
                }
              }],
              tail: [['optional']]
            },
            timestamp: {
              _schema: 'json-zod',
              method: 'coerce.date'
            },
            requestId: {
              _schema: 'json-zod',
              method: 'uuid',
              tail: [['optional']]
            }
          }],
          tail: [['optional']]
        }
      }]
    }
  },
  schema: {
    _is: 'ref',
    id: 'ApiResponse'
  }
};

// ===============================
// 使用示例函数
// ===============================

export function validateUserRegistration(data: unknown) {
  const schema = fromZodJson(userRegistrationSchema);
  return schema.parse(data);
}

export function validateBlogPost(data: unknown) {
  const schema = fromZodJson(blogSystemSchema);
  return schema.parse(data);
}

export function validateApiResponse(data: unknown) {
  const schema = fromZodJson(apiResponseSchema);
  return schema.parse(data);
}

// ===============================
// 序列化示例：将 Schema 保存到文件或数据库
// ===============================

export function saveSchemaToJson(schema: ZodJsonRoot, filename: string) {
  // 在实际应用中，这里可以保存到文件系统或数据库
  const jsonString = JSON.stringify(schema, null, 2);
  console.log(`Saving schema to ${filename}:`);
  console.log(jsonString);
  return jsonString;
}

export function loadSchemaFromJson(jsonString: string): ZodJsonRoot {
  // 在实际应用中，这里可以从文件系统或数据库加载
  return JSON.parse(jsonString) as ZodJsonRoot;
}

// ===============================
// 动态 Schema 生成示例
// ===============================

export function createDynamicFormSchema(fields: Array<{
  name: string;
  type: 'string' | 'number' | 'email' | 'boolean';
  required?: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}>): ZodJsonRoot {
  const shape: Record<string, any> = {};

  for (const field of fields) {
    const fieldSchema: any = {
      _schema: 'json-zod',
      method: field.type === 'email' ? 'email' : field.type
    };

    const tail: Array<[string, any[]] | [string]> = [];

    // 添加验证规则
    if (field.validation) {
      if (field.validation.min !== undefined) {
        tail.push(['min', [field.validation.min]]);
      }
      if (field.validation.max !== undefined) {
        tail.push(['max', [field.validation.max]]);
      }
      if (field.validation.pattern) {
        tail.push(['regex', [field.validation.pattern]]);
      }
    }

    // 如果字段不是必需的，添加 optional
    if (!field.required) {
      tail.push(['optional']);
    }

    if (tail.length > 0) {
      fieldSchema.tail = tail;
    }

    shape[field.name] = fieldSchema;
  }

  return {
    schema: {
      _schema: 'json-zod',
      method: 'object',
      params: [shape]
    }
  };
}

// 使用动态 Schema 生成器的示例
export const dynamicFormExample = createDynamicFormSchema([
  {
    name: 'name',
    type: 'string',
    required: true,
    validation: { min: 2, max: 50 }
  },
  {
    name: 'email',
    type: 'email',
    required: true
  },
  {
    name: 'age',
    type: 'number',
    required: false,
    validation: { min: 0, max: 150 }
  },
  {
    name: 'newsletter',
    type: 'boolean',
    required: false
  }
]);
