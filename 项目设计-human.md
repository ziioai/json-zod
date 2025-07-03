# json-zod 项目设计

## 项目概述

json-zod 包，旨在为 zod 提供一个 json 格式的表示方案。
与 json-schema 没有任何关系。
侧重于从 json 构建 zod schema。
描述的是构建 zod schema 的过程。

比如：

```json5
{
  "_schema": "json-zod",
  "method": "object",
  "params": [{
    "name": { "method": "string", "tail": [ ["optional"], ["meta", [{ "description": "The name." }]] ] },
    "age": { "method": "number", "tail": [ ["optional"], ["meta", [{ "description": "The age." }]] ] },
  }],
  "tail": [
    ["meta", [{ "description": "A person object.", "examples": [{ "name": "John Doe", "age": 30 }] }]],
    ["partial"],
    ["refine", [{
      "_is": "function",
      "code": "(person) => person.age <= 255",
    }]]
  ],
}
```

## 数据结构设计

### 基础类型定义

```ts
export type BasicJsonLiteralType = string | number | boolean | null;
export type BasicJsonType = BasicJsonLiteralType | Array<BasicJsonType> | Record<string, BasicJsonType>;

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

/**
 * 定义一个参数可以是哪些类型。
 * 它可以是基础类型、另一个 ZodJson 结构、一个函数表示，
 * 或者是它们的数组或对象（用于 object 的 shape）。
 */
export type ZodJsonParam =
  | BasicJsonLiteralType
  | ZodJson
  | ZodJsonFunctionSpec
  | Record<string, ZodJson> // 用于 z.object(shape) 的 shape
  | ZodJsonParam[]; // 用于参数是数组的情况

/**
 * json-zod 的核心结构。
 * 任何 z.method(arg1, arg2, ...) 都被统一表示为
 * { method: "method", params: [arg1, arg2, ...] }
 */
export interface ZodJson {
  _schema: 'json-zod';
  
  /**
   * Zod 的方法名，例如 'object', 'string', 'enum'。
   */
  method: string;
  
  /**
   * 传递给 method 的参数数组。
   * 数组中的项可以是任何 ZodJsonParam 类型。
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
```


### `ZodJsonFunctionSpec` 使用场景示例

#### 场景1：作为主方法的参数 (在 `params` 中使用)

当 Zod 方法本身需要函数作为参数时，例如 `z.custom()`。

**Zod 代码:**
```ts
z.custom<string>((val) => typeof val === 'string', '必须是字符串');
```

**对应的 json-zod:**
```json5
{
  "_schema": "json-zod",
  "method": "custom",
  "params": [
    // 第一个参数是一个函数
    {
      "_is": "function",
      "code": "(val) => typeof val === 'string'"
    },
    // 第二个参数是错误信息
    "必须是字符串"
  ]
}
```

#### 场景2：作为链式方法的参数 (在 `tail` 中使用)

当链式方法需要函数作为参数时，例如 `.refine()` 或 `.transform()`。

**Zod 代码:**
```ts
z.string().min(1).transform(val => val.toUpperCase());
```

**对应的 json-zod:**
```json5
{
  "_schema": "json-zod",
  "method": "string",
  "tail": [
    ["min", [1]],
    ["transform", [
      // transform 的参数是一个函数
      {
        "_is": "function",
        "code": "val => val.toUpperCase()"
      }
    ]]
  ]
}
```

