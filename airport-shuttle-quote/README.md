# LA Airport Ride — Airport Shuttle Quote

这是一个独立的机场接送在线报价与预约前端，放在 `page/airport-shuttle-quote/`。

## 已实现
- 接机 / 送机
- LAX / ONT / SNA / LGB / BUR
- 大量南加州城市固定价表
- 详细地址输入与后端地址报价接口挂钩
- 日期、上车/航班到达时间
- Airline / Flight Number
- 根据航班号前缀辅助判断国内/国际航班
- 早班、深夜接机附加费
- 乘客、行李、Car Seat、Booster
- 举牌接机、返程需求、备注
- 姓名、电话、Email、微信、LINE
- 优惠码入口（演示码 WELCOME10）
- 实时报价拆分
- EN / 简 / 繁三语言主要界面
- 手机底部固定报价栏
- 确认预约弹窗
- 预约编号、确认页
- 本机订单管理（localStorage）

## 当前后端状态
GitHub Pages 本身只有静态前端。页面已预留 `window.SHUTTLE_API_BASE`，设置后会调用：
- `POST /api/address-quote`

如果不设置后端，页面会使用城市固定价，不会报错。

正式上线还建议增加：
- Google Routes / Places 或其他地图服务
- 服务端 API Key
- D1 / PostgreSQL / Supabase 等订单数据库
- 短信 / Email / 微信通知
- 正式优惠码
- 管理后台
- Stripe / Square 等付款流程

## 公开地址
https://louisong1021-ux.github.io/page/airport-shuttle-quote/
