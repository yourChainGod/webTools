#  [号多多|hdd.cm推特低至1毛5](https://hdd.cm)

# 号多多工具集
演示：[号多多工具](https://zh.hdd.cm)

一个基于 WebAssembly 的在线文本处理工具集，包含文本格式转换、合并、打乱、去重等功能。

## 功能特点

- 文本格式转换：支持自定义分隔符和输出格式
- 文本合并：支持两段文本的合并，可自定义分隔符
- 文本打乱：随机打乱文本行的顺序
- 文本去重：支持显示重复项和去重后的结果

## 构建说明

### 1. 环境要求

- Go 1.16 或更高版本
- 支持 WebAssembly 的现代浏览器

### 2. 获取 wasm_exec.js

这玩意在你GOROOT下的misc/wasm/wasm_exec.js，自己去找

```bash
# 复制 wasm_exec.js 到项目目录
cp "$(go env GOROOT)/misc/wasm/wasm_exec.js" .
```

### 3. 构建 WebAssembly

```bash
# 编译 Go 代码为 WebAssembly
CGO_ENABLED=0 GOOS=js GOARCH=wasm go build -ldflags="-s -w" -o main.wasm main.go
```

### 4. 运行项目

可以使用任何 HTTP 服务器运行项目

然后在浏览器中访问

## 开发说明

- `main.go`: Go 源代码，包含所有文本处理功能
- `main.js`: JavaScript 代码，处理用户界面交互
- `index.html`: 网页界面
- `wasm_exec.js`: Go WebAssembly 运行时支持文件

## 使用说明

### 文本格式转换
- 分隔符：用于分割输入文本
- 转换格式：使用 {1}, {2}, {3} 等占位符表示分割后的字段

示例：
- 输入：`张三----李四----王五`
- 分隔符：`----`
- 格式：`{2},{1}:{3}`
- 输出：`李四,张三:王五`

## 许可证

MIT License
