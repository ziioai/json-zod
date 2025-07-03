
# json-zod

一个强大的库，用于将 Zod Schema 序列化为 JSON 格式，并能够从 JSON 重新构建 Zod Schema。

## 🚀 特性

- **完全可序列化**: 将任何 Zod Schema 转换为 JSON 格式
- **类型安全**: 完整的 TypeScript 支持
- **递归支持**: 完美处理递归和循环引用类型
- **函数支持**: 支持 transform、refine、custom 等函数类型
- **链式调用**: 支持所有 Zod 的链式方法
- **命名空间**: 支持 `z.coerce.*`、`z.iso.*` 等命名空间方法
- **零依赖**: 除了 Zod 本身，无其他运行时依赖

## 📦 安装

```bash
pnpm add json-zod zod
```

## 🔧 基本使用

### 从 JSON 创建 Zod Schema

```typescript
import { fromZodJson } from 'json-zod';
import type { ZodJsonRoot } from 'json-zod';

// 定义 JSON 格式的 Schema
const jsonSchema: ZodJsonRoot = {
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

// 转换为 Zod Schema
const schema = fromZodJson(jsonSchema);

// 使用 Schema 验证数据
const userData = {
  name: 'Alice',
  email: 'alice@example.com',
  age: 25
};

const result = schema.parse(userData); // ✅ 通过验证
```

### 递归类型支持

```typescript
const recursiveSchema: ZodJsonRoot = {
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

const categorySchema = fromZodJson(recursiveSchema);
```

### 函数支持

```typescript
const schemaWithTransform: ZodJsonRoot = {
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

const transformSchema = fromZodJson(schemaWithTransform);
transformSchema.parse('hello'); // => 'HELLO'
```

## 🔥 高级功能

### 命名空间方法

支持所有 Zod v4 的命名空间方法：

```typescript
const coerceSchema: ZodJsonRoot = {
  schema: {
    _schema: 'json-zod',
    method: 'coerce.number'
  }
};

const isoSchema: ZodJsonRoot = {
  schema: {
    _schema: 'json-zod',
    method: 'iso.datetime'
  }
};
```

### 动态 Schema 生成

```typescript
function createFormSchema(fields: Record<string, string>): ZodJsonRoot {
  const shape: Record<string, any> = {};
  
  for (const [name, type] of Object.entries(fields)) {
    shape[name] = {
      _schema: 'json-zod',
      method: type
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
```

## 🏗️ 项目结构

```
lib/
├── types.ts              # 核心类型定义
├── from-json-zod.ts      # JSON 到 Zod Schema 转换
├── to-json-zod.ts        # Zod Schema 到 JSON 转换（实验性）
├── simple-examples.ts    # 使用示例
├── from-json-zod.test.ts # 基础功能测试
├── advanced.test.ts      # 高级功能测试
└── examples.test.ts      # 示例测试
```

## 🧪 测试

运行测试：

```bash
pnpm test:run
```

当前测试覆盖率：41 个测试用例全部通过 ✅

## 📖 设计理念

json-zod 的设计基于以下核心原则：

1. **统一结构**: 所有 Zod 方法都表示为 `{ method: string, params: array }` 的统一格式
2. **命名空间**: 使用点号分隔命名空间和方法名
3. **递归引用**: 通过 `definitions` 和 `ref` 机制支持递归类型
4. **链式调用**: 使用 `tail` 数组表示链式方法调用

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

SEE LICENSE IN LICENSE

## 🔗 相关链接

- [Zod 官方文档](https://zod.dev)
- [项目设计文档](./项目设计.md)
