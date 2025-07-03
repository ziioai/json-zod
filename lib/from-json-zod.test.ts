/**
 * json-zod 库的测试用例
 * 测试从 JSON 到 Zod Schema 的转换功能
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod/v4';
import { fromZodJson } from '../lib/from-json-zod.js';
import type { ZodJsonRoot } from '../lib/types.js';

describe('fromZodJson - 基础类型转换', () => {
  it('应该正确转换基础字符串类型', () => {
    const jsonSchema: ZodJsonRoot = {
      schema: {
        _schema: 'json-zod',
        method: 'string'
      }
    };

    const schema = fromZodJson(jsonSchema);

    expect(schema.parse('hello')).toBe('hello');
    expect(() => schema.parse(123)).toThrow();
  });

  it('应该正确转换基础数字类型', () => {
    const jsonSchema: ZodJsonRoot = {
      schema: {
        _schema: 'json-zod',
        method: 'number'
      }
    };

    const schema = fromZodJson(jsonSchema);

    expect(schema.parse(42)).toBe(42);
    expect(() => schema.parse('hello')).toThrow();
  });

  it('应该正确转换布尔类型', () => {
    const jsonSchema: ZodJsonRoot = {
      schema: {
        _schema: 'json-zod',
        method: 'boolean'
      }
    };

    const schema = fromZodJson(jsonSchema);

    expect(schema.parse(true)).toBe(true);
    expect(schema.parse(false)).toBe(false);
    expect(() => schema.parse('true')).toThrow();
  });
});

describe('fromZodJson - 链式调用', () => {
  it('应该正确处理 optional 链式调用', () => {
    const jsonSchema: ZodJsonRoot = {
      schema: {
        _schema: 'json-zod',
        method: 'string',
        tail: [['optional']]
      }
    };

    const schema = fromZodJson(jsonSchema);

    expect(schema.parse('hello')).toBe('hello');
    expect(schema.parse(undefined)).toBe(undefined);
    expect(() => schema.parse(123)).toThrow();
  });

  it('应该正确处理带参数的链式调用', () => {
    const jsonSchema: ZodJsonRoot = {
      schema: {
        _schema: 'json-zod',
        method: 'string',
        tail: [['min', [3]], ['max', [10]]]
      }
    };

    const schema = fromZodJson(jsonSchema);

    expect(schema.parse('hello')).toBe('hello');
    expect(() => schema.parse('hi')).toThrow(); // 太短
    expect(() => schema.parse('this is too long')).toThrow(); // 太长
  });

  it('应该正确处理数字的范围验证', () => {
    const jsonSchema: ZodJsonRoot = {
      schema: {
        _schema: 'json-zod',
        method: 'number',
        tail: [['min', [0]], ['max', [100]]]
      }
    };

    const schema = fromZodJson(jsonSchema);

    expect(schema.parse(50)).toBe(50);
    expect(schema.parse(0)).toBe(0);
    expect(schema.parse(100)).toBe(100);
    expect(() => schema.parse(-1)).toThrow();
    expect(() => schema.parse(101)).toThrow();
  });
});

describe('fromZodJson - 对象类型', () => {
  it('应该正确转换简单对象', () => {
    const jsonSchema: ZodJsonRoot = {
      schema: {
        _schema: 'json-zod',
        method: 'object',
        params: [{
          name: {
            _schema: 'json-zod',
            method: 'string'
          },
          age: {
            _schema: 'json-zod',
            method: 'number'
          }
        }]
      }
    };

    const schema = fromZodJson(jsonSchema);

    const validData = { name: 'Alice', age: 30 };
    expect(schema.parse(validData)).toEqual(validData);

    expect(() => schema.parse({ name: 'Alice' })).toThrow(); // 缺少 age
    expect(() => schema.parse({ name: 'Alice', age: 'thirty' })).toThrow(); // age 类型错误
  });

  it('应该正确处理带有可选字段的对象', () => {
    const jsonSchema: ZodJsonRoot = {
      schema: {
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
            tail: [['optional']]
          }
        }]
      }
    };

    const schema = fromZodJson(jsonSchema);

    expect(schema.parse({ name: 'Alice', age: 30 })).toEqual({ name: 'Alice', age: 30 });
    expect(schema.parse({ name: 'Alice' })).toEqual({ name: 'Alice' });
    expect(() => schema.parse({})).toThrow(); // 缺少必需的 name
  });
});

describe('fromZodJson - 数组类型', () => {
  it('应该正确转换字符串数组', () => {
    const jsonSchema: ZodJsonRoot = {
      schema: {
        _schema: 'json-zod',
        method: 'array',
        params: [{
          _schema: 'json-zod',
          method: 'string'
        }]
      }
    };

    const schema = fromZodJson(jsonSchema);

    expect(schema.parse(['a', 'b', 'c'])).toEqual(['a', 'b', 'c']);
    expect(schema.parse([])).toEqual([]);
    expect(() => schema.parse(['a', 123, 'c'])).toThrow(); // 包含非字符串元素
  });

  it('应该正确转换对象数组', () => {
    const jsonSchema: ZodJsonRoot = {
      schema: {
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
            name: {
              _schema: 'json-zod',
              method: 'string'
            }
          }]
        }]
      }
    };

    const schema = fromZodJson(jsonSchema);

    const validData = [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' }
    ];

    expect(schema.parse(validData)).toEqual(validData);
    expect(() => schema.parse([{ id: 'invalid', name: 'Alice' }])).toThrow();
  });
});

describe('fromZodJson - 命名空间方法', () => {
  it('应该正确转换 coerce.string', () => {
    const jsonSchema: ZodJsonRoot = {
      schema: {
        _schema: 'json-zod',
        method: 'coerce.string'
      }
    };

    const schema = fromZodJson(jsonSchema);

    expect(schema.parse('hello')).toBe('hello');
    expect(schema.parse(123)).toBe('123');
    expect(schema.parse(true)).toBe('true');
  });

  it('应该正确转换 coerce.number', () => {
    const jsonSchema: ZodJsonRoot = {
      schema: {
        _schema: 'json-zod',
        method: 'coerce.number'
      }
    };

    const schema = fromZodJson(jsonSchema);

    expect(schema.parse(123)).toBe(123);
    expect(schema.parse('123')).toBe(123);
    expect(schema.parse('123.45')).toBe(123.45);
  });
});

describe('fromZodJson - 递归类型', () => {
  it('应该正确处理递归类型定义', () => {
    const jsonSchema: ZodJsonRoot = {
      definitions: {
        Category: {
          _schema: 'json-zod',
          method: 'object',
          params: [{
            name: {
              _schema: 'json-zod',
              method: 'string'
            },
            subcategories: {
              _schema: 'json-zod',
              method: 'array',
              params: [{
                _is: 'ref',
                id: 'Category'
              }]
            }
          }]
        }
      },
      schema: {
        _is: 'ref',
        id: 'Category'
      }
    };

    const schema = fromZodJson(jsonSchema);

    const validData = {
      name: 'Electronics',
      subcategories: [
        {
          name: 'Phones',
          subcategories: []
        },
        {
          name: 'Laptops',
          subcategories: [
            {
              name: 'Gaming Laptops',
              subcategories: []
            }
          ]
        }
      ]
    };

    expect(schema.parse(validData)).toEqual(validData);

    // 测试无效数据
    expect(() => schema.parse({
      name: 'Electronics',
      subcategories: [
        { name: 123, subcategories: [] } // name 应该是字符串
      ]
    })).toThrow();
  });
});

describe('fromZodJson - 联合类型', () => {
  it('应该正确转换联合类型', () => {
    const jsonSchema: ZodJsonRoot = {
      schema: {
        _schema: 'json-zod',
        method: 'union',
        params: [
          [
            {
              _schema: 'json-zod',
              method: 'string'
            },
            {
              _schema: 'json-zod',
              method: 'number'
            }
          ]
        ]
      }
    };

    const schema = fromZodJson(jsonSchema);

    expect(schema.parse('hello')).toBe('hello');
    expect(schema.parse(123)).toBe(123);
    expect(() => schema.parse(true)).toThrow(); // 布尔值不在联合类型中
  });
});

describe('fromZodJson - 错误处理', () => {
  it('应该在引用不存在的定义时抛出错误', () => {
    const jsonSchema: ZodJsonRoot = {
      schema: {
        _is: 'ref',
        id: 'NonExistentDefinition'
      }
    };

    expect(() => fromZodJson(jsonSchema)).toThrow('[json-zod] Definition not found for ref: "NonExistentDefinition"');
  });

  it('应该在使用未知方法时抛出错误', () => {
    const jsonSchema: ZodJsonRoot = {
      schema: {
        _schema: 'json-zod',
        method: 'unknownMethod'
      }
    };

    expect(() => fromZodJson(jsonSchema)).toThrow('[json-zod] Unknown Zod method: "z.unknownMethod"');
  });

  it('应该在使用未知链式方法时抛出错误', () => {
    const jsonSchema: ZodJsonRoot = {
      schema: {
        _schema: 'json-zod',
        method: 'string',
        tail: [['unknownTailMethod']]
      }
    };

    expect(() => fromZodJson(jsonSchema)).toThrow('[json-zod] Unknown Zod tail method: ".unknownTailMethod()" on "z.string"');
  });
});
