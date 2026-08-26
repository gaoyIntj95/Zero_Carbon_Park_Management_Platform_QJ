# 曲靖零碳园区 V4 前端项目交接与完整性审查

> 审查日期：2026-08-25  
> 审查范围：当前工作区实际 React 源码、路由配置、Shared Store / Mock、构建脚本及本地浏览器运行结果。  
> 本文只描述当前代码事实，不代表后端能力、正式业务规则或生产可用性。

## 0. 审查结论摘要

- 当前共有 **27 条唯一 Route**，无重复 path；其中新增的 V4 聚合入口为 `/data-management` 和 `/system-management`。
- 管委会菜单实际显示 **7 个一级菜单**；企业角色实际显示 **3 个一级菜单**。旧 25 页面平铺菜单已不存在。
- 所有 27 条 Route 均能在本地开发服务中加载，未发现路由级白屏或控制台 error/warn。
- V4 信息架构已经成形，但当前仍是“可确认业务架构的前端原型”，并非完整业务闭环。
- 当前审查认定 **5 项 P0**，主要集中在角色/数据范围、填报闭环、专业页面空壳、可见无效操作和重复事实源。

---

## 一、当前菜单与角色结构

菜单由 `routes.js -> getMenuGroups(role)` 生成，`AppShell` 不再硬编码页面清单。角色状态仅存在于前端 `useState` 中。

### 1. 管委会管理员

| 顺序 | 功能分组 | 一级菜单 | Route | React Component |
| --- | --- | --- | --- | --- |
| 1 | 园区零碳管理 | 零碳指标管控 | `/zero-carbon-indicators` | `ZeroCarbonIndicatorsPage` |
| 2 | 园区零碳管理 | 园区能碳监测 | `/energy-carbon-monitoring` | `EnergyCarbonModulePage` |
| 3 | 园区零碳管理 | 填报任务监控 | `/reporting-task-monitoring` | `ReportingTaskMonitoringPage` |
| 4 | 园区零碳管理 | 零碳成果与验收支撑 | `/zero-carbon-results` | `ZeroCarbonResultsPage` |
| 5 | 企业赋能 | 企业绿色服务 | `/enterprise-green-services` | `EnterpriseGreenServicesPage` |
| 6 | 基础支撑 | 数据管理 | `/data-management` | `DataManagementPage` |
| 7 | 基础支撑 | 系统管理 | `/system-management` | `SystemManagementPage` |

### 2. 企业角色

| 顺序 | 功能分组 | 一级菜单 | Route | React Component |
| --- | --- | --- | --- | --- |
| 1 | 我的工作台 | 企业数据填报 | `/enterprise-data-reporting` | `EnterpriseDataReportingPage` |
| 2 | 企业服务 | 企业绿色服务 | `/enterprise-green-services` | `EnterpriseGreenServicesPage` |
| 3 | 企业信息 | 企业信息 | `/data-management` | `DataManagementPage` |

### 3. 菜单与角色检查

| 检查项 | 当前事实 | 判断 |
| --- | --- | --- |
| 是否仍存在旧 25 页面平铺菜单 | 不存在。管委会为 7 项，企业为 3 项 | 通过 |
| 应隐藏旧页面是否仍在主菜单 | 未发现。19 条旧/子页面 Route 均为 `menuVisible:false` | 通过 |
| 同一页面是否跨分组重复展示 | 未发现同一角色下重复菜单项 | 通过 |
| 企业画像是否显示给企业角色 | 不显示 | 通过 |
| 管委会是否显示企业数据填报一级菜单 | 不显示 | 表面通过 |
| 管委会是否仍可进入可编辑企业填报 | **可以**。管委会可进入“数据管理 → 企业数据填报”，点击“进入填报工作台”到 `/enterprise-data-reporting` | **角色错位** |
| 企业角色数据范围是否隔离 | **没有**。企业角色进入 `/data-management` 后可看到全部 7 个 Tab、全部企业及园区级数据 | **越权风险** |
| Route 是否有角色守卫 | 没有。任何角色均可直接输入任意 Route；`roles` 只控制菜单显示 | **越权风险** |

结论：菜单信息架构正确，但当前没有真正的前端路由授权和数据范围控制。管委会的企业填报入口是二级入口而非主菜单入口，仍然属于需要记录的角色错位。

---

## 二、V4 功能架构 → 当前页面映射

状态说明：

- ✅ 已完整实现：当前前端范围内有完整展示及主要交互，不等同于后端已实现。
- 🟡 已有基础页面，但功能不完整。
- ⚪ 仅占位页面或仅有静态入口。
- 🔗 复用其他已有页面/路由。
- ❌ 当前未实现。

### 1. 零碳指标管控

| 二级功能 | 状态 | 当前页面 / Route / Component | 真实交互 | 数据性质与限制 |
| --- | --- | --- | --- | --- |
| 指标总览 | ✅ | 零碳指标管控 / `/zero-carbon-indicators` / `ZeroCarbonIndicatorsPage` | 年度选择、关注项详情、指标依据 Modal | 读取权威 11+1 指标 Mock；总览数字为前端既定值 |
| 指标台账 | ✅ | 同上 | 分类 Tab、达标/数据状态筛选、详情下钻 | 真实前端筛选；不修改 Shared Store |
| 零碳推演 | 🔗🟡 | `/scenario` / `ScenarioPage` | 参数修改、前端公式、重置 | 保存按钮仍为 `alert`；未调用 Shared Store 的 `saveScenario` |
| 指标设置 | 🟡 | 指标规则 Modal / `ZeroCarbonIndicatorsPage` | 可打开并查看规则 | “调整”按钮无处理器，规则不持久化 |

### 2. 园区能碳监测

| 二级功能 | 状态 | 当前页面 / Route / Component | 真实交互 | 数据性质与限制 |
| --- | --- | --- | --- | --- |
| 园区能碳总览 | 🟡 | `/energy-carbon-monitoring` / `EnergyCarbonModulePage` | Tab 切换 | 从 `energyCarbonData` 汇总；数据更新时间为静态文字，完整性口径较简化 |
| 能源分析 | 🔗🟡 | 同 Route 内嵌 `EnergyCarbonMonitoringPage` | 企业搜索、详情 Modal、缺口跳转 | 明细使用页面本地 `rows`，不是共享 `energyCarbonData` |
| 碳排放分析 | 🔗🟡 | 同上 | 企业搜索、详情 Modal | 同样使用页面本地 `rows` |
| 企业画像 | 🔗🟡 | `/enterprise-profile` / `EnterpriseProfilePage` | 企业切换、来源跳转 | 聚合共享企业、能碳、指标、服务、成果、任务；部分企业没有完整关联数据 |
| 绿色权益与碳资产 | 🔗🟡 | `/park-assets` / `CarbonAssetsPage` | 资产 Tab、详情 Modal、动态摘要 | 读取共享 `carbonAssets`；无新增、编辑或交易能力 |

### 3. 填报任务监控

| 二级功能 | 状态 | 当前页面 / Route / Component | 真实交互 | 数据性质与限制 |
| --- | --- | --- | --- | --- |
| 填报任务管理 | 🟡 | `/reporting-task-monitoring` / `ReportingTaskMonitoringPage` | 新建任务表单、发布/关闭 | 任务批次 `campaigns` 是页面局部 state，不生成 Shared Store 的 `reportingTasks/reportingTaskItems` |
| 填报进度监控 | 🟡 | 同上 | 企业任务/数据缺口切换、详情 Modal | 待填写和凭证缺口从共享任务项派生；“催办”按钮无处理器 |
| 填报审核 | 🟡 | 同上 | 查看、退回补充、确认入库 | 审核结果只写页面局部 `reviews`；不修改任务项、不回写企业工作台 |

### 4. 零碳成果与验收支撑

| 二级功能 | 状态 | 当前页面 / Route / Component | 真实交互 | 数据性质与限制 |
| --- | --- | --- | --- | --- |
| 验收准备 | 🟡 | `/zero-carbon-results` / `ZeroCarbonResultsPage` | Tab、事项详情 Modal | 读取共享事项和指标；无维护能力 |
| 零碳成果库 | 🟡 | 同上 | 成果详情 Modal | 读取共享 `archives` 与多对多关系；无新增编辑 |
| 验收材料管理 | 🟡 | 同上 | 查看 Modal | “维护”按钮无处理器；材料仅 2 条 Mock |
| 报告中心 | 🔗🟡 | `/report-center` / `ReportCenterPage` | 模板/记录 Tab、生成 Modal | 页面使用本地 `reportData`；生成后仅 `alert`，不新增记录 |
| 验收材料输出 | ⚪ | `/zero-carbon-results` 输出 Tab | 有生成/导出按钮外观 | 两个按钮均无处理器，无文件生成或下载 |

### 5. 企业绿色服务

| 二级功能 | 状态 | 当前页面 / Route / Component | 真实交互 | 数据性质与限制 |
| --- | --- | --- | --- | --- |
| 服务总览 | 🟡 | `/enterprise-green-services` / `EnterpriseGreenServicesPage` | 5 张服务卡可点击 | 汇总共享 `greenServices`，部分卡片数量是静态文案 |
| 组织碳排放 | ⚪ | `/organization-carbon` / `SystemPage` | 只有通用表格容器 | `SystemPage` 仍按“组织碳排放”筛选服务类型，但共享类型已改为“组织碳核查”，当前表格为空 |
| 产品碳足迹 | ⚪ | `/product-carbon-footprint` / `SystemPage` | 通用表格容器 | 能显示一条服务 Mock，不具备专业核算交互 |
| CBAM管理 | ⚪ | `/cbam` / `SystemPage` | 无有效业务交互 | 通用占位行 |
| 供应链碳管理 | ⚪ | `/supply-chain-carbon` / `SystemPage` | 无有效业务交互 | 通用占位行 |
| 企业碳资产管理 | ⚪ | `/enterprise-assets` / `SystemPage` | 无有效业务交互 | 未复用 `carbonAssets` 的企业视角 |
| 服务成果 | 🟡 | 企业绿色服务“服务成果”Tab | 查看详情 Modal | 读取共享 `greenServices`；“回流验收”只有文字说明，没有 navigate 或状态写入 |

### 6. 数据管理

| 二级功能 | 状态 | 当前页面 / Route / Component | 真实交互 | 数据性质与限制 |
| --- | --- | --- | --- | --- |
| 企业信息 | 🟡 | `/data-management` / `DataManagementPage` | Tab 切换 | 共享 `enterprises` 只读表格 |
| 新能源设施 | 🟡 | 同上 | Tab 切换 | 共享 `renewableFacilities` 只读表格 |
| 能源数据 | 🟡 | 同上 | Tab 切换 | 共享 `energyCarbonData` 只读表格 |
| 运营数据 | 🟡 | 同上 | Tab 切换 | 共享 `operationData` 只读表格 |
| 碳核算数据 | 🟡 | 同上 | Tab 切换 | 共享 `carbonAccountingData` 只读表格 |
| 指标专项数据 | 🟡 | 同上 | Tab 切换 | 共享 `indicatorSpecialData` 只读表格 |
| 企业数据填报 | 🔗🟡 | `/enterprise-data-reporting` / `EnterpriseDataReportingPage` | 编辑值、上传凭证、提交 | 真实修改 Shared Store 会话状态，但工作台固定为 `ent-002`，无角色/企业上下文 |

### 7. 系统管理

| 二级功能 | 状态 | 当前页面 / Route / Component | 真实交互 | 数据性质与限制 |
| --- | --- | --- | --- | --- |
| 组织架构管理 | 🟡 | `/system-management` / `SystemManagementPage` | Tab、进入完整页面 | 聚合页为局部 Mock；`/organization` 是 `SystemPage` 通用占位 |
| 角色与权限管理 | 🟡 | 同上 | Tab、进入完整页面 | 只读 Mock；没有权限配置能力 |
| 日志管理 | 🟡 | 同上 | Tab、进入完整页面 | 只读 Mock；没有搜索、筛选、审计详情 |

---

## 三、旧页面与旧路由处理情况

当前没有针对这些旧路由的显式 Redirect；它们均保留原 Route。只有未知路径通过通配 Route 重定向至 `/zero-carbon-indicators`。

| 旧能力 | Route | 当前处理 | 当前组件 / 事实 |
| --- | --- | --- | --- |
| 零碳建设任务管理 | `/construction-task` | 菜单隐藏，保留路由 | `ConstructionTaskPage`；本地 `taskData`，新增/编辑为 alert |
| 零碳推演 / 情景管理 | `/scenario` | 归入指标管控，菜单隐藏 | `ScenarioPage` |
| 企业画像 | `/enterprise-profile` | 归入园区能碳监测，菜单隐藏 | `EnterpriseProfilePage` |
| 园区碳资产管理 | `/park-assets` | 改名“绿色权益与碳资产”，菜单隐藏 | `CarbonAssetsPage` |
| 报告中心 | `/report-center` | 归入验收支撑，菜单隐藏 | `ReportCenterPage` |
| 双碳知识库 | `/knowledge` | 菜单隐藏，保留路由 | `KnowledgeBasePage`；仍使用页面本地知识 Mock |
| 企业档案管理 | `/enterprise-archive` | 归入数据管理，菜单隐藏 | 旧 Route 使用 `SystemPage`；因标题已改“企业信息”，没有命中其“企业档案管理”特殊数据分支 |
| 新能源设施管理 | `/facilities` | 归入数据管理，菜单隐藏 | 旧 Route 使用 `SystemPage`；V4 数据管理 Tab 读取共享设施数据 |
| 孪生模型管理 | `/twin-model` | 菜单隐藏，保留路由 | `SystemPage` 占位 |
| 物联设备管理 | `/iot-devices` | 菜单隐藏，保留路由 | `SystemPage` 占位 |
| 数据服务管理 | `/data-services` | 菜单隐藏，保留路由 | `SystemPage` 占位 |
| 组织碳排放 | `/organization-carbon` | 归入企业绿色服务，菜单隐藏 | `SystemPage`；当前服务类型筛选不匹配，表格为空 |
| 产品碳足迹 | `/product-carbon-footprint` | 归入企业绿色服务，菜单隐藏 | `SystemPage` 基础展示 |
| CBAM管理 | `/cbam` | 归入企业绿色服务，菜单隐藏 | `SystemPage` 占位 |
| 供应链碳管理 | `/supply-chain-carbon` | 归入企业绿色服务，菜单隐藏 | `SystemPage` 占位 |
| 企业碳资产管理 | `/enterprise-assets` | 归入企业绿色服务，菜单隐藏 | `SystemPage` 占位 |
| 企业数据填报工作台 | `/enterprise-data-reporting` | 企业角色主菜单；数据管理可跳转 | `EnterpriseDataReportingPage` |

### ParkAssetsPage / CarbonAssetsPage 专项检查

- `ParkAssetsPage`：当前源码中已不存在。
- `CarbonAssetsPage`：当前存在且由 `main.jsx` 显式映射到 `/park-assets`。
- 当前没有两套碳资产页面组件；`/park-assets` 实际使用 `CarbonAssetsPage`。
- 仍存在的重复事实不在组件名层面，而在其他页面局部 Mock 与 Shared Store 并存，见第八节。

---

## 四、页面内部 Tab 结构

### 1. 零碳指标管控

- 页面没有名为“指标总览 / 指标台账”的一级 Tab；总览和台账在同一长页面上下排列。
- 指标分类 Tab：全部、核心指标、引导指标、云南特色指标、专项要求。
- 指标详情内部视图：结果说明、数据来源、成果与材料。
- 零碳推演通过顶部按钮 navigate 到 `/scenario`。
- 指标设置通过“指标设置”按钮打开规则 Modal。

### 2. 园区能碳监测

- 园区能碳总览：页面内真实 Tab 内容。
- 能源分析：页面内真实 Tab，内嵌 `EnergyCarbonMonitoringPage`。
- 碳排放分析：页面内真实 Tab，内嵌同一组件。
- 企业画像：Tab 点击后 navigate 到 `/enterprise-profile`。
- 绿色权益与碳资产：Tab 点击后 navigate 到 `/park-assets`。

### 3. 填报任务监控

真实存在三个 Tab：

1. 填报任务管理；
2. 填报进度监控；
3. 填报审核。

进度监控内部另有“企业任务 / 数据缺口”按钮式子视图。

### 4. 零碳成果与验收支撑

真实存在五个 Tab：

1. 验收准备；
2. 零碳成果库；
3. 验收材料管理；
4. 报告中心；
5. 验收材料输出。

报告中心 Tab 本身只提供入口，点击后进入独立 `/report-center`。

### 5. 企业绿色服务

- Tab：服务总览、服务成果。
- 服务总览中的 5 张卡片均有真实 navigate：
  - 组织碳排放；
  - 产品碳足迹；
  - CBAM管理；
  - 供应链碳管理；
  - 企业碳资产管理。
- “可点击”只代表路由有效；其中 4 个以上仍是通用占位容器。

### 6. 数据管理

真实存在七个 Tab，且都有渲染内容：

1. 企业信息：共享企业表；
2. 新能源设施：共享设施表；
3. 能源数据：共享能碳数据表；
4. 运营数据：共享运营数据表；
5. 碳核算数据：共享活动数据表；
6. 指标专项数据：共享专项数据表；
7. 企业数据填报：模板清单及跳转按钮。

这些 Tab 前六项均为只读 Mock 表格；第七项跳转独立填报工作台。

### 7. 系统管理

真实存在组织架构管理、角色与权限管理、日志管理三个 Tab。聚合页是只读 Mock 表格，每个 Tab 可 navigate 到对应旧 Route，但旧 Route 仍是通用 `SystemPage`。

---

## 五、数据关系审查

### 1. Shared Store / Mock 主要业务对象

| 数据对象 | 被哪些页面读取 | 哪些页面修改 | 是否共享同一数据源 |
| --- | --- | --- | --- |
| `enterprises` | 能碳总览、企业画像、绿色服务、数据管理、填报监控、资产页、SystemPage | 无 | 是 |
| `indicators` | 指标管控、企业画像、验收支撑、数据管理 | 指标页面仅改局部 UI，不改对象 | 权威定义是同一源 |
| `energyCarbonData` | 能碳总览、企业画像、数据管理、碳核算数据派生 | 无 | 总览层共享；监测明细另有本地 `rows` |
| `enterpriseIndicatorResult` | 企业画像、指标专项数据派生 | 无 | 是 |
| `acceptanceItems` | 验收准备、成果关联 | 无 | 是 |
| `archives` | 零碳成果库、企业画像 | 无 | 是 |
| `acceptanceMaterials` | 验收材料管理、缺口摘要、材料输出 | 无 | 是 |
| `greenServices` | 企业绿色服务、企业画像、SystemPage | 无 | 主数据共享；另有未使用的派生 `services` |
| `carbonAssets` | `CarbonAssetsPage` | 无 | 是；企业碳资产专业页未读取它 |
| `renewableFacilities` | 数据管理新能源设施 Tab | 无 | 是 |
| `operationData` | 数据管理运营数据 Tab | 无 | 是 |
| `carbonAccountingData` | 数据管理碳核算数据 Tab | 无 | 是 |
| `indicatorSpecialData` | 数据管理指标专项数据 Tab | 无 | 是 |
| `reportingItemTemplates` | Shared Provider、填报监控、数据管理、企业填报派生项 | 无 | 是 |
| `reportingTasks` | Shared Provider 派生 `tasks` | 无直接修改 | 是，但任务管理页面的 campaign 不写入 |
| `reportingTaskItems` | Shared Provider 初始状态 | 企业填报通过 `updateItem/uploadVoucher` 修改 Provider state | 是 |
| `constructionTasks` | 当前无页面读取 | 无 | 与隐藏建设任务页的本地 `taskData` 重复 |
| `scenarios` | Provider 初始化 `savedScenarios` | `saveScenario` 可修改，但页面未调用 | 场景页实际使用局部 state |
| `reportTemplates` | 当前无页面读取 | 无 | 报告页实际使用本地 `reportData` |
| `knowledgeItems` | 当前无页面读取 | 无 | 知识库实际使用本地 `knowledgeData` |

### 2. 企业填报链路真实程度

目标链路：

`填报任务管理 → reportingTasks → reportingTaskItems → 企业数据填报 → 企业提交 → 进度变化 → 填报审核 → 退回/确认`

当前真实情况：

| 环节 | 当前事实 |
| --- | --- |
| 填报任务管理 | 新建、发布、关闭只修改 `ReportingTaskMonitoringPage` 的局部 `campaigns` |
| 生成 reportingTasks | **未实现**。新建 campaign 不创建 Shared Store 任务 |
| 生成 reportingTaskItems | **未实现**。新建 campaign 不创建任务项 |
| 企业数据填报 | **真实共享联动，但固定 ent-002**。输入值调用 `updateItem` 修改 Provider 的 `taskItems` |
| 上传凭证 | **真实共享联动**。调用 `uploadVoucher`，进度页的 pendingVoucher 会重新派生 |
| 企业提交 | 条件满足时调用 `submitTask('ent-002')`，写入 Provider 的 `submittedTaskIds` |
| 填报进度变化 | **真实前端联动**。进度页读取 Provider 派生的 `tasks` |
| 填报审核列表 | 从共享 `taskItems` 读取企业填写且已有值的数据 |
| 退回补充 | 只修改页面局部 `reviews`，不回写任务项，不会让企业工作台进入退回状态 |
| 确认入库 | 只修改页面局部 `reviews`，没有入库数据对象 |
| 持久化 | 全部为内存状态，刷新后恢复初始 Mock |

### 3. 当前 alert 与无效按钮

显式 `alert`：

- 隐藏建设任务页：新增任务、通用编辑；
- 零碳推演：保存情景；
- 报告中心：生成报告、通用编辑；
- 双碳知识库：新增知识、通用编辑。

可见但无处理器的按钮：

- 填报进度监控“催办”；
- 验收材料“维护”；
- 验收材料输出“生成验收支撑包 / 导出验收支撑包”；
- 指标设置数据来源“调整”；
- `SystemPage` 的“查看”；
- 部分表格通用“编辑”最终仅 alert。

---

## 六、页面跳转关系

| 业务关系 | 当前实现 | 判断 |
| --- | --- | --- |
| 零碳指标管控 → 零碳推演 | 顶部按钮 `navigate('/scenario')` | 已实现真实 navigate |
| 零碳指标/数据缺口 → 填报任务监控 | 指标页没有直接跳转；能碳明细的企业填报缺口有跳转 | 部分实现 |
| 园区能碳监测 → 企业画像 | 模块 Tab 点击 navigate | 已实现 |
| 园区能碳监测 → 绿色权益与碳资产 | 模块 Tab 点击 navigate | 已实现 |
| 能碳缺口 → 填报任务监控 | “提醒补充”按钮 navigate | 已实现，但未创建催办记录 |
| 企业画像 → 能碳/指标/服务/成果/填报来源 | 各卡片真实 navigate，并携带 `enterpriseId` query | 已实现；部分目标页不消费 query |
| 企业绿色服务 → 5 个专业页面 | 5 张卡片真实 navigate | 已实现；多数目标页占位 |
| 服务成果 → 零碳成果库 | 只有“可回流”文字，无按钮和状态写入 | 未实现 |
| 验收缺口 → 指标/填报/材料 | 无业务跳转 | 未实现 |
| 验收支撑 → 报告中心 | 真实 navigate 到 `/report-center` | 已实现 |
| 数据管理 → 企业数据填报 | 真实 navigate 到 `/enterprise-data-reporting` | 已实现，但无角色限制 |
| 系统管理 → 组织/角色/日志旧页面 | 真实 navigate | 已实现；目标页面占位 |

---

## 七、当前仍为占位或弱实现的功能

| 功能 | 当前状态 | 当前实现方式 | 后续需补什么 | 优先级 |
| --- | --- | --- | --- | --- |
| 角色授权与数据范围 | 弱实现 | 只隐藏菜单，无 Route Guard；企业可看园区全部数据，管委会可进入企业填报 | 角色路由守卫、企业上下文、数据范围隔离、管委会只读/审核视角 | P0 |
| 填报任务完整闭环 | 弱实现 | campaign 和 review 为局部 state；企业填报固定 ent-002 | 任务发布生成任务项、企业上下文、退回/入库回写、状态与时间记录 | P0 |
| 组织碳排放入口 | 占位且数据为空 | `SystemPage` 服务类型筛选字段不匹配 | 至少修正展示事实并明确核算入口边界 | P0 |
| 客户可见无效操作 | 弱实现 | 催办、材料维护、验收包生成/导出等按钮无处理器；报告/场景使用 alert | 演示前隐藏、禁用并说明，或补前端可验证结果 | P0 |
| 能碳/报告/知识/任务重复事实源 | 存在不一致风险 | 页面局部 Mock 与 Shared Store 并存 | 统一权威源并消除可见数字矛盾 | P0 |
| CBAM | 仅占位 | 通用 SystemPage | 需求确认后补适用企业、业务对象和流程 | P1 |
| 供应链碳 | 仅占位 | 通用 SystemPage | 需求确认后补供应商/数据协同模型 | P1 |
| 企业碳资产专业能力 | 仅占位 | 通用 SystemPage，未读 carbonAssets | 增加企业视角筛选与业务台账；复杂交易后置 | P1 |
| 验收材料管理 | 基础表格 | 2 条共享 Mock、查看 Modal、维护按钮无效 | 上传、维护、多关联编辑、缺口回写 | P1 |
| 验收材料输出 | UI 占位 | 统计卡与无处理器按钮 | 目录生成、支撑包文件、缺失校验 | P1 |
| 能源数据 | 基础表格 | energyCarbonData 汇总展示 | 查询、期间、来源追溯、明细统一 | P1 |
| 运营数据 | 基础表格 | operationData Mock | 查询、维护、企业适用性、来源追溯 | P1 |
| 碳核算数据 | 基础表格 | carbonAccountingData Mock | 活动数据分类、凭证、来源追溯、编辑审核 | P1 |
| 指标专项数据 | 基础表格 | indicatorSpecialData Mock | 数据项定义、凭证、指标关联维护 | P1 |
| 系统管理 | 基础表格/占位 | 聚合页局部 Mock，旧路由通用 SystemPage | 真实组织树、权限矩阵、日志查询 | P1 |
| 零碳推演正式算法 | 原型公式 | 页面局部计算 | 正式算法、版本、情景保存与比较 | P2 |
| 孪生模型 / IoT / 数据服务 | 路由占位 | 隐藏 SystemPage | 根据后续范围决定恢复或废弃 | P2 |
| 双碳知识库 | 隐藏原型 | 页面本地 Mock 和 Mock 问答 | 是否纳入版本范围、统一 knowledgeItems | P2 |
| 零碳建设任务管理 | 隐藏旧原型 | 本地 taskData、alert | 明确废弃或保留只读历史入口 | P2 |

---

## 八、当前技术问题和重复代码

| 类型 | 当前事实 | 影响 |
| --- | --- | --- |
| 未使用组件 | `DataTable.jsx`、`PlaceholderPage.jsx` 当前未被入口引用 | 代码噪声 |
| 未使用 import | `EnergyCarbonMonitoringPage.jsx` 导入 `enterprises` 但未使用 | 需要 lint 才能自动发现 |
| 未使用/空操作 Store API | `syncTask` 为 no-op；`saveScenario`、`addReport` 未被对应页面调用 | 容易误判已有联动 |
| 未使用 Shared Mock | `constructionTasks`、`reportTemplates`、`knowledgeItems` 当前没有被对应页面读取 | 与页面局部 Mock 重复 |
| 派生对象残留 | `services` 由 `greenServices` 派生，但当前页面不再使用 | 可维护性噪声 |
| 重复能碳数据 | `EnergyCarbonMonitoringPage` 本地 `rows` 与共享 `energyCarbonData` 并存且数值不同 | 总览和明细可能矛盾 |
| 重复任务数据 | Shared Store 有 `constructionTasks`，隐藏页使用本地 `taskData` | 旧页面事实不一致 |
| 重复报告数据 | Shared Store 有 `reportTemplates/reports`，报告页使用本地 `reportData` | 生成记录不联动 |
| 重复知识数据 | Shared Store 有 `knowledgeItems`，知识页使用本地 `knowledgeData` | AI来源和列表可能脱节 |
| SystemPage 字段不匹配 | 组织碳排放页面按 `serviceType==='组织碳排放'` 过滤，但主数据为“组织碳核查” | 页面空表 |
| SystemPage 标题判断过时 | 企业信息 Route 标题已改为“企业信息”，组件仍判断“企业档案管理” | 旧企业档案 Route 显示通用占位 |
| SystemPage 文案过时 | 字幕仍写“25个终版路由”，当前实际为 27 条 | 客户可见事实错误 |
| 路由权限 | `roles` 仅用于菜单，无 Route Guard | 直接 URL 可越权 |
| 页面标题差异 | Route 标题“零碳推演”，页面 Header 为“零碳推演 / 情景管理” | 轻微命名不一致 |
| 隐藏页仍被引用 | 这是 V4 设计的一部分：scenario、profile、assets、report-center、专业页由新模块跳转 | 非错误，但需保持兼容 |
| 重复路由 | 27 条 path 均唯一 | 未发现 |
| React Console | 全新加载及全路由巡检无 error/warn | 通过 |
| Build | Vite build 无 warning/error | 通过 |
| CSS | 4 个全局 CSS 文件共同加载；未发现构建或浏览器层面的明显冲突 | 无自动 CSS 检查，后续改样式需谨慎 |

---

## 九、项目运行检查

### Build

- 命令：`npm run build`
- 结果：**通过**
- Vite：8.2.2
- 转换模块：51
- 输出 JS：约 327.22 kB，gzip 约 96.09 kB
- 构建 warning/error：0

### Lint

- `package.json` 没有 `lint` script。
- 未配置 ESLint 依赖或配置文件。
- 结论：**Lint 未配置，无法给出通过或问题数量**。

### 路由

- 实际检查 27 条 Route。
- 正常加载：27。
- 加载失败：0。
- 未知 Route：由通配 `Navigate` 跳转到 `/zero-carbon-indicators`。
- 注意：能加载不代表页面具备业务功能；13 个未在 `focused` 映射中的路由统一落到 `SystemPage`。

### Console

- 在全新浏览器页面上下文逐条访问 27 条 Route。
- 未发现 React error、warning 或明显运行时异常。

---

## 十、当前完成度判断

### 已基本完成，可以用于客户确认

- V4 七模块信息架构和角色菜单外观；
- 零碳指标总览、指标台账及详情结构；
- 园区能碳总览与能源/碳分析页面结构；
- 企业画像聚合结构；
- 绿色权益与碳资产园区台账结构；
- 填报任务管理/进度/审核三段式页面结构；
- 验收准备、成果、材料、报告、输出五段式结构；
- 企业绿色服务门户结构；
- 数据管理七类数据结构；
- 系统管理三类入口结构。

### 有页面，但客户看到后可能追问

- 填报任务发布为什么不生成企业任务；
- 审核退回后企业端为什么没有变化；
- 园区总览和企业明细数字为什么不完全一致；
- 验收材料如何上传、复用、维护；
- 报告生成、验收包导出为什么没有真实记录或文件；
- 系统管理为什么只有只读表格；
- 企业角色为何能看到全部企业和园区数据。

### 目前只是规划入口

- 组织碳排放专业核算；
- 产品碳足迹专业核算；
- CBAM管理；
- 供应链碳管理；
- 企业碳资产专业管理；
- 孪生模型、IoT设备、数据服务；
- 验收支撑包生成引擎；
- 正式零碳推演算法。

### 客户演示前必须再处理（P0，共 5 项）

1. 增加角色路由与数据范围控制，解决企业越权查看园区数据、管委会进入可编辑企业填报的问题。
2. 打通填报任务发布、任务项生成、企业提交、审核退回/入库的共享状态闭环，并取消固定 `ent-002`。
3. 处理组织碳排放空表及专业服务占位页的客户可见事实错误。
4. 处理主流程中无响应、仅 alert 的按钮；至少给出明确禁用/原型说明或可验证结果。
5. 统一能碳明细、建设任务、报告、知识库等重复 Mock，避免同一业务对象在演示中出现矛盾。

---

## 十一、交接建议

- 后续开发应优先修 P0，不建议继续增加页面数量或视觉组件。
- 所有专业能力深化前，先确认其业务对象、角色、数据来源和回写目标。
- 共享状态仍是内存 Mock，刷新即丢失；任何“已提交、已审核、已生成”都不应对客户描述为后端能力。
- 现阶段最准确的产品定位是：**V4 信息架构完整、主要业务页面可浏览、部分核心前端状态可联动，但权限、填报闭环和专业业务能力尚未冻结。**
