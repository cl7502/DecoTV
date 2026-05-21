# DecoTV Vercel 流量优化开发计划 (Optimization Plan)

## 状态: 已完成 (Completed)
- **完成日期:** 2026-05-20
- **目标:** 已实施全方位流量优化，预计可减少 60% 以上的 Vercel 数据传输。

---

## 2. 详细执行步骤

### 第一阶段：诊断与紧急止血 (已完成)
- [x] **Task 1.1:** 审计 `src/lib/image-url.ts` 及相关组件，确认所有图片请求路径。
- [x] **Task 1.2:** 替换内部图片代理为外部 CDN (weserv.nl)。
- [x] **Task 1.3:** 检查 `src/app/api` 下的 `route.ts`，找出未设置缓存的高频接口。

### 第二阶段：架构重构与缓存强化 (已完成)
- [x] **Task 2.1:** 为搜索和详情 API 注入 `Cache-Control` 响应头。
    - *优化:* 增加了 `s-maxage` (2x) 和 `stale-while-revalidate`。
- [x] **Task 2.2:** 迁移核心 API 至 `Edge Runtime`。
    - *优化:* `image-proxy` 已迁移至 Edge Runtime。
- [x] **Task 2.3:** 优化 Redis 缓存策略。
    - *优化:* 为 `PanSou` 搜索增加了 10 分钟缓存。

### 第三阶段：客户端与 Payload 优化 (已完成)
- [x] **Task 3.1:** 检查并精简 API 返回的 JSON 结构。
    - *优化:* 搜索结果中的 `desc` 字段已精简至 100 字符。
- [x] **Task 3.2:** 确保前端图片使用 `loading="lazy"`。
    - *确认:* `VideoCard` 组件已默认使用 `loading="lazy"`。

### 第四阶段：验证与清理 (已完成)
- [x] **Task 4.1:** 验证图片在各端（Web/TV）的显示稳定性。
- [x] **Task 4.2:** 移除不再使用的后端代理代码。 (保留 image-proxy 接口以维持兼容性，但已迁移至 Edge)

---

## 3. 进度跟踪
- [x] 制定优化方案并存档 (2026-05-20)
- [x] 第一阶段实施 (2026-05-20)
- [x] 第二阶段实施 (2026-05-20)
- [x] 第三阶段实施 (2026-05-20)
- [x] 第四阶段实施 (2026-05-20)
