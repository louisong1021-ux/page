# Airport Shuttle Backend

Cloudflare Worker 后端草案，给 GitHub Pages 前端提供两个核心能力：

- `POST /api/address-quote`：使用 Google Routes API 计算路线距离，然后按你自己的运营公式生成基础价。
- `POST /api/bookings`：把预约保存到 Cloudflare D1。
- `GET /api/bookings/:id`：读取一笔订单。

## 部署前需要
1. Cloudflare Worker / Wrangler
2. Google Maps Platform 的 Routes API Key
3. Cloudflare D1 数据库

## Secrets
不要把 Google API Key 写进 GitHub。
使用：

```bash
wrangler secret put GOOGLE_MAPS_API_KEY
```

## D1
创建数据库后，把 `wrangler.jsonc` 里的 `database_id` 替换成真实 ID，然后执行 schema.sql。

## 地址报价公式
默认：
- 单程路线距离 × 1.55 = 计费运营里程
- 计费运营里程 × $1.65
- 最低基础价 $70
- 最终基础价向上取到 $5

这不是复制第三方的隐藏后端公式，而是一个可调整的自有运营公式。三个参数都可通过 Worker 环境变量修改。

## 前端连接
Worker 部署完成后，在页面加载 app.js 之前设置：

```html
<script>window.SHUTTLE_API_BASE="https://YOUR-WORKER.workers.dev"</script>
```
