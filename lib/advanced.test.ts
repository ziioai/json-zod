/**
 * json-zod 库的高级功能测试
 * 测试函数、复杂转换和边缘情况
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod/v4';
import { fromZodJson } from '../lib/from-json-zod.js';
import type { ZodJsonRoot } from '../lib/types.js';

describe('fromZodJson - 函数支持', () => {
  it('应该正确处理 transform 函数', () => {
    const jsonSchema: ZodJsonRoot = {
      schema: {
        _schema: 'json-zod',
        method: 'string',
        tail: [
          ['transform', [{
            _is: 'function',
            code: 'val => val.toUpperCase()'
          }]]
        ]
      }
    };

    const schema = fromZodJson(jsonSchema);

    expect(schema.parse('hello')).toBe('HELLO');
    expect(schema.parse('world')).toBe('WORLD');
  });

  it('应该正确处理 refine 验证函数', () => {
    const jsonSchema: ZodJsonRoot = {
      schema: {
        _schema: 'json-zod',
        method: 'string',
        tail: [
          ['refine', [{
            _is: 'function',
            code: 'val => val.includes("@")'
          }, 'Must contain @ symbol']]
        ]
      }
    };

    const schema = fromZodJson(jsonSchema);

    expect(schema.parse('test@example.com')).toBe('test@example.com');
    expect(() => schema.parse('invalid-email')).toThrow();
  });

  it('应该正确处理 custom 验证器', () => {
    const jsonSchema: ZodJsonRoot = {
      schema: {
        _schema: 'json-zod',
        method: 'custom',
        params: [{
          _is: 'function',
          code: 'val => typeof val === "string" && val.length > 3'
        }]
      }
    };

    const schema = fromZodJson(jsonSchema);

    expect(schema.parse('hello')).toBe('hello');
    expect(() => schema.parse('hi')).toThrow();
    expect(() => schema.parse(123)).toThrow();
  });
});

describe('fromZodJson - 字符串格式验证', () => {
  it('应该正确转换 email 格式', () => {
    const jsonSchema: ZodJsonRoot = {
      schema: {
        _schema: 'json-zod',
        method: 'email'
      }
    };

    const schema = fromZodJson(jsonSchema);

    expect(schema.parse('test@example.com')).toBe('test@example.com');
    expect(() => schema.parse('not-an-email')).toThrow();
  });

  it('应该正确转换 url 格式', () => {
    const jsonSchema: ZodJsonRoot = {
      schema: {
        _schema: 'json-zod',
        method: 'url'
      }
    };

    const schema = fromZodJson(jsonSchema);

    expect(schema.parse('https://example.com')).toBe('https://example.com');
    expect(() => schema.parse('not-a-url')).toThrow();
  });

  it('应该正确转换 uuid 格式', () => {
    const jsonSchema: ZodJsonRoot = {
      schema: {
        _schema: 'json-zod',
        method: 'uuid'
      }
    };

    const schema = fromZodJson(jsonSchema);

    const validUuid = '550e8400-e29b-41d4-a716-446655440000';
    expect(schema.parse(validUuid)).toBe(validUuid);
    expect(() => schema.parse('not-a-uuid')).toThrow();
  });
});

describe('fromZodJson - 数字类型验证', () => {
  it('应该正确转换 int 类型', () => {
    const jsonSchema: ZodJsonRoot = {
      schema: {
        _schema: 'json-zod',
        method: 'int'
      }
    };

    const schema = fromZodJson(jsonSchema);

    expect(schema.parse(42)).toBe(42);
    expect(schema.parse(-10)).toBe(-10);
    expect(() => schema.parse(3.14)).toThrow(); // 小数应该失败
  });

  it('应该正确处理数字的正负性验证', () => {
    const positiveSchema: ZodJsonRoot = {
      schema: {
        _schema: 'json-zod',
        method: 'number',
        tail: [['positive']]
      }
    };

    const schema = fromZodJson(positiveSchema);

    expect(schema.parse(42)).toBe(42);
    expect(schema.parse(0.1)).toBe(0.1);
    expect(() => schema.parse(0)).toThrow();
    expect(() => schema.parse(-1)).toThrow();
  });
});

describe('fromZodJson - 复杂嵌套结构', () => {
  it('应该正确处理深度嵌套的对象', () => {
    const jsonSchema: ZodJsonRoot = {
      schema: {
        _schema: 'json-zod',
        method: 'object',
        params: [{
          user: {
            _schema: 'json-zod',
            method: 'object',
            params: [{
              profile: {
                _schema: 'json-zod',
                method: 'object',
                params: [{
                  name: {
                    _schema: 'json-zod',
                    method: 'string'
                  },
                  age: {
                    _schema: 'json-zod',
                    method: 'number',
                    tail: [['min', [0]]]
                  }
                }]
              },
              settings: {
                _schema: 'json-zod',
                method: 'object',
                params: [{
                  theme: {
                    _schema: 'json-zod',
                    method: 'union',
                    params: [[
                      {
                        _schema: 'json-zod',
                        method: 'literal',
                        params: ['dark']
                      },
                      {
                        _schema: 'json-zod',
                        method: 'literal',
                        params: ['light']
                      }
                    ]]
                  }
                }]
              }
            }]
          }
        }]
      }
    };

    const schema = fromZodJson(jsonSchema);

    const validData = {
      user: {
        profile: {
          name: 'Alice',
          age: 30
        },
        settings: {
          theme: 'dark'
        }
      }
    };

    expect(schema.parse(validData)).toEqual(validData);

    // 测试无效数据
    expect(() => schema.parse({
      user: {
        profile: {
          name: 'Alice',
          age: -1 // 年龄不能为负数
        },
        settings: {
          theme: 'dark'
        }
      }
    })).toThrow();

    expect(() => schema.parse({
      user: {
        profile: {
          name: 'Alice',
          age: 30
        },
        settings: {
          theme: 'purple' // 无效的主题
        }
      }
    })).toThrow();
  });

  it('应该正确处理多层数组嵌套', () => {
    const jsonSchema: ZodJsonRoot = {
      schema: {
        _schema: 'json-zod',
        method: 'array',
        params: [{
          _schema: 'json-zod',
          method: 'array',
          params: [{
            _schema: 'json-zod',
            method: 'object',
            params: [{
              id: {
                _schema: 'json-zod',
                method: 'number'
              },
              data: {
                _schema: 'json-zod',
                method: 'array',
                params: [{
                  _schema: 'json-zod',
                  method: 'string'
                }]
              }
            }]
          }]
        }]
      }
    };

    const schema = fromZodJson(jsonSchema);

    const validData = [
      [
        { id: 1, data: ['a', 'b'] },
        { id: 2, data: ['c', 'd'] }
      ],
      [
        { id: 3, data: ['e'] }
      ]
    ];

    expect(schema.parse(validData)).toEqual(validData);
  });
});

describe('fromZodJson - 多重引用和循环依赖', () => {
  it('应该正确处理多个相互引用的定义', () => {
    const jsonSchema: ZodJsonRoot = {
      definitions: {
        User: {
          _schema: 'json-zod',
          method: 'object',
          params: [{
            id: {
              _schema: 'json-zod',
              method: 'string'
            },
            name: {
              _schema: 'json-zod',
              method: 'string'
            },
            posts: {
              _schema: 'json-zod',
              method: 'array',
              params: [{
                _is: 'ref',
                id: 'Post'
              }]
            }
          }]
        },
        Post: {
          _schema: 'json-zod',
          method: 'object',
          params: [{
            id: {
              _schema: 'json-zod',
              method: 'string'
            },
            title: {
              _schema: 'json-zod',
              method: 'string'
            },
            author: {
              _is: 'ref',
              id: 'User'
            },
            comments: {
              _schema: 'json-zod',
              method: 'array',
              params: [{
                _is: 'ref',
                id: 'Comment'
              }]
            }
          }]
        },
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
              method: 'string'
            },
            author: {
              _is: 'ref',
              id: 'User'
            }
          }]
        }
      },
      schema: {
        _is: 'ref',
        id: 'User'
      }
    };

    const schema = fromZodJson(jsonSchema);

    // 创建一个包含循环引用的测试数据
    const userData = {
      id: 'user1',
      name: 'Alice',
      posts: [
        {
          id: 'post1',
          title: 'Hello World',
          author: {
            id: 'user1',
            name: 'Alice',
            posts: [] // 为了避免无限嵌套，这里留空
          },
          comments: [
            {
              id: 'comment1',
              content: 'Nice post!',
              author: {
                id: 'user2',
                name: 'Bob',
                posts: []
              }
            }
          ]
        }
      ]
    };

    expect(schema.parse(userData)).toEqual(userData);
  });
});

describe('fromZodJson - 边缘情况', () => {
  it('应该正确处理空对象和空数组', () => {
    const objectSchema: ZodJsonRoot = {
      schema: {
        _schema: 'json-zod',
        method: 'object',
        params: [{}]
      }
    };

    const arraySchema: ZodJsonRoot = {
      schema: {
        _schema: 'json-zod',
        method: 'array',
        params: [{
          _schema: 'json-zod',
          method: 'string'
        }]
      }
    };

    expect(fromZodJson(objectSchema).parse({})).toEqual({});
    expect(fromZodJson(arraySchema).parse([])).toEqual([]);
  });

  it('应该正确处理 literal 类型', () => {
    const jsonSchema: ZodJsonRoot = {
      schema: {
        _schema: 'json-zod',
        method: 'literal',
        params: ['specific-value']
      }
    };

    const schema = fromZodJson(jsonSchema);

    expect(schema.parse('specific-value')).toBe('specific-value');
    expect(() => schema.parse('other-value')).toThrow();
    expect(() => schema.parse(123)).toThrow();
  });

  it('应该正确处理 undefined 和 null 类型', () => {
    const undefinedSchema: ZodJsonRoot = {
      schema: {
        _schema: 'json-zod',
        method: 'undefined'
      }
    };

    const nullSchema: ZodJsonRoot = {
      schema: {
        _schema: 'json-zod',
        method: 'null'
      }
    };

    expect(fromZodJson(undefinedSchema).parse(undefined)).toBe(undefined);
    expect(fromZodJson(nullSchema).parse(null)).toBe(null);

    expect(() => fromZodJson(undefinedSchema).parse(null)).toThrow();
    expect(() => fromZodJson(nullSchema).parse(undefined)).toThrow();
  });
});
