/**
 * 测试示例的正确性
 */

import { describe, it, expect } from 'vitest';
import {
  validateUser,
  validateProduct,
  validateComment,
  createSimpleFormSchema,
  dynamicFormSchema
} from '../lib/simple-examples.js';
import { fromZodJson } from '../lib/from-json-zod.js';

describe('使用示例测试', () => {
  describe('用户验证', () => {
    it('应该验证有效的用户数据', () => {
      const validUser = {
        name: 'Alice',
        email: 'alice@example.com',
        age: 25
      };

      expect(validateUser(validUser)).toEqual(validUser);
    });

    it('应该拒绝无效的用户数据', () => {
      const invalidUser = {
        name: 'A', // 太短
        email: 'not-an-email', // 无效邮箱
        age: -5 // 负数年龄
      };

      expect(() => validateUser(invalidUser)).toThrow();
    });
  });

  describe('产品验证', () => {
    it('应该验证有效的产品数据', () => {
      const validProduct = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'iPhone 15',
        price: 999.99,
        description: 'Latest iPhone model',
        category: 'electronics',
        tags: ['smartphone', 'apple', 'mobile'],
        inStock: true
      };

      expect(validateProduct(validProduct)).toEqual(validProduct);
    });

    it('应该接受没有可选字段的产品数据', () => {
      const minimalProduct = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Basic Product',
        price: 10.99,
        category: 'books',
        tags: [],
        inStock: false
      };

      expect(validateProduct(minimalProduct)).toEqual(minimalProduct);
    });

    it('应该拒绝无效的产品数据', () => {
      const invalidProduct = {
        id: 'not-a-uuid',
        name: '',
        price: -10,
        category: 'invalid-category',
        tags: [123], // 应该是字符串数组
        inStock: 'true' // 应该是布尔值
      };

      expect(() => validateProduct(invalidProduct)).toThrow();
    });
  });

  describe('评论系统验证', () => {
    it('应该验证简单的评论', () => {
      const simpleComment = {
        id: 'comment-1',
        content: 'This is a great post!',
        author: 'Alice',
        timestamp: '2024-01-01T10:00:00Z',
        replies: []
      };

      expect(validateComment(simpleComment)).toBeDefined();
    });

    it('应该验证带有嵌套回复的评论', () => {
      const nestedComment = {
        id: 'comment-1',
        content: 'This is a great post!',
        author: 'Alice',
        timestamp: '2024-01-01T10:00:00Z',
        replies: [
          {
            id: 'reply-1',
            content: 'I agree!',
            author: 'Bob',
            timestamp: '2024-01-01T11:00:00Z',
            replies: [
              {
                id: 'reply-2',
                content: 'Thanks for sharing!',
                author: 'Charlie',
                timestamp: '2024-01-01T12:00:00Z',
                replies: []
              }
            ]
          }
        ]
      };

      expect(validateComment(nestedComment)).toBeDefined();
    });
  });

  describe('动态表单生成器', () => {
    it('应该正确生成动态表单 Schema', () => {
      const customSchema = createSimpleFormSchema({
        username: 'string',
        email: 'email',
        score: 'number',
        active: 'boolean'
      });

      const schema = fromZodJson(customSchema);

      const validData = {
        username: 'testuser',
        email: 'test@example.com',
        score: 100,
        active: true
      };

      expect(schema.parse(validData)).toEqual(validData);
    });

    it('应该正确验证预定义的动态表单', () => {
      const schema = fromZodJson(dynamicFormSchema);

      const validData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        age: 30,
        isSubscribed: false
      };

      expect(schema.parse(validData)).toEqual(validData);
    });
  });

  describe('Schema 序列化', () => {
    it('应该能够序列化和反序列化 Schema', () => {
      const originalSchema = createSimpleFormSchema({
        name: 'string',
        email: 'email'
      });

      // 序列化
      const serialized = JSON.stringify(originalSchema);

      // 反序列化
      const deserialized = JSON.parse(serialized);

      // 验证功能是否相同
      const originalZodSchema = fromZodJson(originalSchema);
      const deserializedZodSchema = fromZodJson(deserialized);

      const testData = {
        name: 'Test User',
        email: 'test@example.com'
      };

      expect(originalZodSchema.parse(testData)).toEqual(deserializedZodSchema.parse(testData));
    });
  });
});
