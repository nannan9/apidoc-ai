# API Doc AI

一键将 OpenAPI/Swagger 文件生成专业 API 文档，支持 AI 智能补描述、真实示例数据、自动校验和可运行 Demo 服务器。

**English version below / 英文版在下方**

## 特性 Features

- 🚀 **一键生成**：输入 OpenAPI JSON/YAML → 自动输出美观 HTML 文档
- 🤖 **AI 补描述**：自动生成人性化接口说明（规则驱动，增值版支持真实 AI 如 OpenAI/Grok）
- 📝 **真实示例**：使用 faker 生成逼真请求/响应数据
- 🔍 **自动校验**：检测缺失描述、无效 schema 等问题，并输出报告
- 💻 **调用示例**：自动生成 curl 和 JavaScript (fetch) 示例
- 🖥️ **可运行 Demo**：生成 Express 模拟服务器，立刻测试接口
- 🎨 **现代样式**：Bootstrap 美化，专业感十足

## 快速开始 Quick Start

```bash
# 1. 克隆仓库
git clone https://github.com/nannan9/apidoc-ai.git
cd apidoc-ai

# 2. 安装依赖（需要 Node.js v16+）
npm install

# 3. 生成文档（使用内置示例）
node generateDocs.js -i apis/petstore.json -o dist

# 4. 查看生成的文档
open dist/index.html  # Mac
# 或 Windows/Linux 直接浏览器打开 dist/index.html

# 5. 启动 Demo 服务器测试
node dist/demo-server.js
curl http://localhost:3000/pets

效果展示
生成的 HTML 文档 与 Demo 测试对比
（左：专业 HTML 文档 | 右：真实 curl 测试响应）
增值版 Pro Version（即将上线）

真实 AI 描述（集成 OpenAI / Grok API）
自定义模板库（企业品牌风格）
批量处理多个 API 文件 + ZIP 导出
云端分享链接（团队协作）

定价：99-299 元/人/年
感兴趣？Star + Watch 本项目，第一时间收到更新通知！⭐
贡献 Contribute
欢迎提 Issue、提交 PR！

Fork 本仓库
创建分支 git checkout -b feature/xxx
Commit 并 Push
提交 Pull Request

License
MIT License

API Doc AI (English)
One-click generate professional API documentation from OpenAPI/Swagger files.
Features

One-click HTML doc generation with Bootstrap styling
AI-powered human-readable descriptions (rule-based now, real AI in Pro)
Realistic examples powered by faker
Automatic validation and issue reporting
curl & JavaScript (fetch) examples
Runnable Express demo server for instant testing

Quick Start
Same as Chinese version above.
Screenshots
Generated Doc & Demo Test
Pro Version Coming Soon

Real AI integration
Custom templates
Batch processing
Team collaboration

Star & Watch for updates! ⭐
