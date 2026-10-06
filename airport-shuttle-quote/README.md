# LA Airport Ride — AI Quote Flow

公开页面：
https://louisong1021-ux.github.io/page/airport-shuttle-quote/

## 新流程
1. 客户用文字或语音描述接送需求
2. AI 把自然语言整理成结构化 Trip JSON
3. 信息缺失时 AI 只追问缺少的字段
4. 信息完整后生成 Trip Summary
5. 客户点击“信息正确，获取报价”
6. 确定性 Quote Engine 才开始计算价格
7. 客户确认预约并提交联系方式

**AI 不负责决定价格。** AI 只负责理解、整理、追问和总结；价格仍由城市固定价 / 路线距离 / 时间费 / 人数费 / 儿童座椅等确定性规则计算。

## 前端
- index.html：AI 对话式页面
- app.js：聊天状态、语音录制、Trip JSON、总结确认、报价引擎、预约
- styles.css：桌面和手机 UI
- confirmation.html：预约确认
- account.html：本机预约记录

如果后端未部署，文字仍有基础本地解析兜底；真正 AI 理解和语音转写需要 Worker。

## Worker API
- POST /api/ai-trip
- POST /api/transcribe
- POST /api/address-quote
- POST /api/bookings
- GET /api/bookings/:id
- GET /health

## OpenAI
Worker 使用 OpenAI Responses API 做结构化行程解析，使用音频 transcription API 把录音转为文字。API Key 只放 Worker secret，不放 GitHub Pages 前端。

需要配置：
```bash
wrangler secret put OPENAI_API_KEY
wrangler secret put GOOGLE_MAPS_API_KEY
```

默认：
- OPENAI_TEXT_MODEL = gpt-5.6-luna
- OPENAI_TRANSCRIBE_MODEL = gpt-4o-mini-transcribe

OpenAI 官方文档当前支持 Responses API 的 JSON Schema structured outputs，以及 /v1/audio/transcriptions 的文件转写。

## Cloudflare D1
创建 D1 后替换 backend/wrangler.jsonc 中的 database_id，并执行 backend/schema.sql。

## 前端连接 Worker
Worker 部署完成后，在 app.js 加载前设置：
```html
<script>
window.SHUTTLE_API_BASE = "https://YOUR-WORKER.workers.dev";
</script>
```

也可以临时在浏览器 localStorage 设置 shuttle-api-base 用于测试。
