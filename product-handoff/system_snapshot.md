# 系统事实快照

- 日期：2026-08-25
- 当前架构：V4 七个一级业务模块，二级能力通过页面 Tab、入口和保留路由承载。
- 路由：27 条，无重复 path；其中 7 个管委会主菜单模块、3 个企业角色入口，其余为隐藏子页面或历史兼容入口。
- 管委会菜单：园区零碳管理 4 项、企业赋能 1 项、基础支撑 2 项。
- 企业菜单：我的工作台、企业服务、企业信息各 1 项。
- 实际碳资产组件：CarbonAssetsPage；旧 ParkAssetsPage 及其本地 assetData 已移除。
- 企业画像：独立 EnterpriseProfilePage，按 enterpriseId 聚合共享事实。
- 构建：npm run build 通过。
- 浏览器：27 条路由均可加载；全新页面上下文控制台无 error/warn。

