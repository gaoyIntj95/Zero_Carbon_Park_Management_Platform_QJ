# 曲靖国家级零碳园区能碳管理平台
## 数据管理模块重构交接包

> 本文以当前工作区代码为准，不把 PRD 需求描述当作已实现功能。产品基线为 `docs/product-specs/data-management-prd-v1.0.md`。
> 本轮只更新数据管理模块及其必要的菜单、路由、共享 Mock/Context 和兼容投影；未继续重构零碳指标、绿色服务、填报任务等其他模块。

## 1. 项目当前状态

### 技术栈

- React + React DOM。
- React Router DOM，使用 `BrowserRouter`，部署基路径来自 `import.meta.env.BASE_URL`。
- Vite 8.2.2 构建。
- JavaScript/JSX；当前没有 TypeScript 类型文件，也没有独立的 API 类型生成层。
- 样式为项目既有 CSS 加本轮新增的 `src/data-management.css`。

### 数据与运行状态

当前仍是纯前端 Mock + 内存状态：

- 没有真实 API 调用。
- 没有数据库、持久化层或后端服务。
- `DataManagementContext` 只在当前前端会话内保存企业、业务记录、问题、节点和流向的修改。
- 刷新页面后恢复 Mock 初始数据。
- 其他旧业务模块仍从 `sharedStore.js` 读取兼容投影，因此不是所有模块都直接读取新的统一对象。

### 构建与路由

- `npm run build`：通过；Vite 转换 70 个模块并生成 `dist`。
- `package.json` 只配置 `dev`、`build`、`preview`，没有 `lint`、`test` 或 `typecheck` 脚本。
- 当前数据管理路由：
  - 管委会：`/data-management`、`/data-overview`、`/enterprise-archive`、`/energy-facilities`、`/business-data`。
  - 隐藏治理路由：`/data-issues`。
  - 企业端：`/my-data`、`/data-details`、`/enterprise-info`。
- `/energy-carbon-monitoring` 仍有页面和内部路由，但已经不在管委会左侧菜单。
- `/ioc-dashboard` 路由及导航入口已经删除。

## 2. 本轮四个页面的真实实现状态

### 2.1 数据总览

页面定位：管委会数据管理入口，使用统一业务记录、企业主数据、要求规则和 DataIssue 汇总数据底座状态。

已实现：

- 展示纳管企业、数据项覆盖率、正式入库率、待处理事项和 IOC/指标影响数量。
- 按能源、运营、碳排放、零碳专项四个数据域汇总准备情况。
- 展示企业数据覆盖情况，可跳转企业档案或业务数据。
- 展示 IOC/零碳指标数据支撑状态。
- 展示高优先级待处理数据事项，并可打开问题详情。
- “查看全部”跳转隐藏 `/data-issues`。
- 数据域、企业、问题详情均有下钻入口；业务数据下钻会携带 tab，企业下钻携带 `enterpriseId`。

已有控件和限制：

- 年度、截至月份、园中园、企业范围筛选控件已存在。
- 园中园和重点企业范围会影响当前页面表格的 `managed` 集合。
- 年度和月份当前只是页面状态，并未参与 `records` 的期间过滤；这是部分实现，不应视为完成了真实时间口径切换。
- 总览统计本身动态调用 `buildDataOverview(records, issues, enterpriseRows)`，但要求规则仍是初始化种子规则，新增企业没有自动生成规则。

与 PRD 的对照：

- 已实现：统一对象聚合、覆盖率/正式率/问题摘要、企业和业务数据下钻、IOC/指标支撑摘要。
- 部分实现：筛选控件的时间条件、问题与记录质量状态联动、真实数据源和可配置统计口径。
- 未实现：后端 API、持久化、完整导入后的实时服务端重算。

### 2.2 企业档案

页面定位：企业主数据及纳管生命周期管理，不再承担业务数据完整率工作台职责。

已实现：

- 企业列表，按园中园、纳管状态、企业名称/信用代码/主要产品搜索。
- 展示稳定 `enterpriseId`、统一社会信用代码、园中园、行业/产品、企业标签、联系人和纳管状态。
- 新增、编辑、查看企业档案。
- 退出纳管时保留已有业务引用，改为“已退出”，不物理删除对象。
- 企业详情可下钻到业务数据。
- 新增/编辑后的企业会进入当前 Context 中的档案、总览和下游企业选择项。

与 PRD 的对照：

- 已实现：主数据字段、稳定 ID、园区归属、标签、纳管生命周期、历史引用保护。
- 部分实现：联系人和电话表单是演示性的非受控输入，点击保存只提示保存；没有后端校验、审计或并发处理。
- 未实现：真实信用代码唯一性校验、批量导入、服务端主数据同步、自动创建该企业的数据要求规则和用能节点。

### 2.3 能源与设施

页面定位：维护能源节点、能源设施稳定属性和长期能源流向关系；期间发生量由业务数据承担。

已实现：

- 两个页签：能源设施、能源流向。
- 能源设施/节点列表按园中园、状态、关键字筛选。
- 能源流向关系列表按状态和关键字筛选。
- 节点和流向关系均支持查看、编辑、新增。
- 节点支持停用；流向关系支持失效并写入结束日期。
- 能源流向详情明确提示不保存月度流量，期间数据转到业务数据能源 Tab。
- 流向问题可从隐藏问题详情跳转到 `/energy-facilities?tab=flow&objectId=...`。
- 企业选择项读取当前 `enterpriseRows` Context，而不是固定旧数组；节点的企业关联通过 `enterpriseId` 保存。

与 PRD 的对照：

- 已实现：EnergyNode、EnergyFlowRelation、source/target 节点关系、有效期、企业消费节点、绿电属性表达、稳定属性与期间量分离。
- 部分实现：当前节点和关系仍是前端数组；新增企业不会自动生成企业消费节点；缺失关系识别主要依赖种子 DataIssue。
- 未实现：真实能源接口、图形化流向图、服务端关系校验、流量计算和能量守恒校验。

### 2.4 业务数据

页面定位：四类期间型业务事实的统一查看、筛选和追溯入口。

已实现：

- 四个 Tab：能源数据、运营数据、碳排放数据、零碳专项数据。
- 按企业、数据状态、质量状态、来源类型、关键字筛选。
- 展示企业、数据项、期间、数据值、来源、数据状态、质量状态和版本。
- 查看来源及记录详情；详情显示凭证/来源说明、来源记录、版本和历史版本。
- 对正式数据支持修订；修订会提高版本号、保留历史并将新版本置为“待确认”。
- 新增数据生成“草稿 + 待确认质量状态”，不会直接生成正式数据。
- 有批量导入入口和失败行/校验说明，但当前是演示反馈，不解析真实文件。
- 业务记录若匹配 DataIssue，可打开问题详情。
- DataIssue 详情中的企业责任问题提供转填报入口；管委会进入填报任务管理，企业进入企业填报任务。

与 PRD 的对照：

- 已实现：四 Tab 共享 BusinessDataRecord、生命周期和质量状态分离、来源追溯、版本历史、问题入口、碳结果引用能源活动记录。
- 部分实现：新增/修订是内存态；URL 中的 `year`、`month` 参数当前不参与过滤；企业端仍有部分旧填报页面逻辑独立存在。
- 未实现：真实文件导入、批量校验结果落库、服务端版本并发控制、自动把问题参数转换成单企业任务。

## 3. 核心文件清单

| 文件 | 类型/职责 |
|---|---|
| `src/routes.js` | 角色路由、菜单分组、菜单顺序、隐藏路由和可见性配置。 |
| `src/main.jsx` | BrowserRouter、AppShell、ProtectedPage、页面映射和 Context 装配。 |
| `src/pages/DataManagementPage.jsx` | 数据管理路由编排、隐藏问题列表、企业端数据入口和问题详情承接。 |
| `src/pages/data-management/DataOverviewPage.jsx` | 管委会数据总览、摘要、数据域/企业/问题下钻。 |
| `src/pages/data-management/EnterpriseArchivePage.jsx` | 企业主数据列表、详情、新增、编辑和退出纳管。 |
| `src/pages/data-management/EnergyFacilitiesPage.jsx` | 能源节点、设施和能源流向关系维护。 |
| `src/pages/data-management/BusinessDataPage.jsx` | 四 Tab 业务事实、筛选、详情、版本修订和导入演示。 |
| `src/pages/data-management/shared.jsx` | 表格、字段、问题详情、记录详情、Tab、状态色和企业/园区显示辅助。 |
| `src/mock/DataManagementContext.jsx` | 数据管理模块会话态 Store/Context。 |
| `src/mock/dataManagementStore.js` | 园区、园中园、数据项、要求规则、业务记录、节点、流向和 DataIssue Mock，以及 `buildDataOverview`。 |
| `src/mock/masterData.js` | 企业主数据种子，保存稳定 `enterpriseId` 和企业属性。 |
| `src/mock/sharedStore.js` | 原有模块共享 Store；导出统一企业和统一业务数据的兼容投影。 |
| `src/data-management.css` | 数据管理工作台、表格、筛选、详情和表单样式。 |
| `docs/product-specs/data-management-prd-v1.0.md` | 本轮采用的 PRD 基线。 |
| `docs/handoffs/data-management-refactor-handoff.md` | 本交接包。 |

当前没有单独的类型定义文件或工具目录；对象结构以 `dataManagementStore.js` 的对象工厂和种子数组为准。

## 4. 数据模型现状

### PRD 对象到当前代码对象

| PRD 对象 | 当前代码对象/类型 | 当前状态 |
|---|---|---|
| Enterprise | `masterData.js` 的 `enterprises`，由 `sharedStore.js` 兼容导出 | 已集中到一份主数据种子，但仍为 JS 对象而非类型。 |
| Park | `park` | 已实现 Mock。 |
| SubPark | `subParks` | 已实现 Mock。 |
| EnergyNode | `energyNodes` | 已实现 Mock；包含来源、设施、企业消费节点。 |
| EnergyFlowRelation | `energyFlowRelations` | 已实现 Mock；通过 `sourceNodeId`/`targetNodeId` 连接节点。 |
| BusinessDataRecord | `businessDataRecords`、运行时 Context 中的 `records` | 已成为数据管理四 Tab 的统一事实数组。 |
| DataItemDefinition | `dataItemDefinitions` | 已实现。 |
| DataRequirementRule | `dataRequirementRules` | 已实现种子规则，但不是动态规则引擎。 |
| DataIssue | `dataIssues`、Context 中的 `issues` | 已保留为隐藏治理对象，当前主要是种子数据。 |

### 关键判断

1. 企业主数据：已集中到 `masterData.js` 的 `enterprises`；`sharedStore.js` 只做兼容导出。旧的 `enterpriseRecords` 数组已不再存在于当前 `src`。
2. 稳定关联键：`enterpriseId` 已用于企业、业务记录、能源节点、流向间的跨模块关联；企业对象同时保留 `id` 以兼容旧模块。
3. 能源设施重复档案：能源设施不再复制企业名称、行业等主数据，只保存 `enterpriseId`；页面通过 Context/辅助函数显示企业名称。
4. EnergyFlowRelation 与期间能源量：已分离。流向只保存来源、去向、能源属性和有效期；期间量在 BusinessDataRecord。
5. BusinessDataRecord：已成为数据管理四 Tab 的统一业务事实模型；旧模块仍通过兼容投影读取它。
6. 能源、运营、碳排、专项数据：源头已统一为 `businessDataRecords`，但 `sharedStore.js` 仍保留旧字段形状的投影，因此工程上仍有兼容模型。
7. 状态：`dataStatus` 表示草稿/待审核/正式/退回/作废，`qualityStatus` 表示正常/待确认/异常/缺失关联/来源冲突，已经分离。
8. DataIssue：当前在 `dataManagementStore.js` 静态初始化，Context 可持有问题数组，但本轮没有提供问题状态编辑、自动生成或修复回写服务。
9. 数据总览：通过 `buildDataOverview` 和页面本地聚合动态读取当前 Context 的 `records`、`issues`、`enterpriseRows`；不是单独写死一套总览数字。但 `dataRequirementRules` 仍是种子规则，时间筛选和问题回写未完全动态化。

## 5. 已废弃或仍遗留的旧模型

| 旧模型/页面 | 状态 | 具体情况 |
|---|---|---|
| `enterprises` | 仍存在、作为主数据 | 已迁移到 `src/mock/masterData.js`；`sharedStore.js` 重新导出，旧模块仍使用。 |
| `enterpriseRecords` | 已删除 | 当前 `src` 未发现该数组；企业完整度不再作为企业档案主列表字段。 |
| `energyCarbonData` | 已停用为源模型，仍被引用 | `sharedStore.js` 从统一业务记录生成兼容投影；`EnergyCarbonModulePage`、`EnterpriseManagementPage`、`ProfessionalServicePage` 仍引用它。 |
| `carbonAccountingData` | 已停用为源模型，保留兼容投影 | 当前主要由 `sharedStore.js` 导出；不再作为数据管理业务事实的主写入源。 |
| `operationData` | 已停用为源模型，保留兼容投影 | 从统一运营记录投影给旧模块使用。 |
| `indicatorSpecialData` | 已停用为源模型，保留兼容投影 | 从零碳专项 BusinessDataRecord 投影。 |
| `renewableFacilities` | 已停用为源模型，保留兼容投影 | 从 `energyNodes` 的设施节点投影。 |
| `constructionTasks` | 仍保留、与本轮无关 | `sharedStore.js` 仍有建设任务 Mock；`FocusPages.jsx` 另有 `taskData`，属于零碳建设模块，未在本轮合并。 |
| `taskData` | 仍存在、与本轮无关 | 位于 `FocusPages.jsx`，不是数据管理业务数据。 |
| IOC 独立路由/Mock | 路由已删除，旧监测页面仍保留 | `/ioc-dashboard` 不存在；`/energy-carbon-monitoring` 隐藏保留，使用兼容的 `energyCarbonData` 投影。 |
| 旧数据问题页面 | 已替换为隐藏承接页 | `DataManagementPage.jsx` 中的 `IssuesInternalPage` 承接 `/data-issues`，不再作为侧栏业务页。 |
| 旧单体数据管理页面 | 已由编排页和四个子页面替代 | `DataManagementPage.jsx` 只负责路由分发和少量企业端/隐藏页承接。 |
| 类型定义/重复 Store | 尚未完全清理 | 项目没有 TS 类型层；`sharedStore.js` 的兼容投影仍是后续迁移成本。 |

## 6. 关键业务链路

| 链路 | 当前状态 | 真实行为 |
|---|---|---|
| 企业档案 → 能源与设施 | 部分跑通 | 新增/编辑企业写入 `enterpriseRows`；能源设施页面读取同一 Context 的企业选择项并用 `enterpriseId` 保存。但不会自动生成该企业消费节点。 |
| 企业档案 → 业务数据 | 部分跑通 | 业务数据页面读取同一 `enterpriseRows`，记录用 `enterpriseId`/`objectId` 关联；新增企业不会自动生成要求规则或业务记录。 |
| 业务数据 → 数据总览 | 部分跑通 | 新增/修订 `records` 会使页面重新渲染，并影响记录数、正式率和覆盖率聚合；新记录若没有对应 `dataRequirementRule`，不会增加要求覆盖率分母/分子。 |
| DataIssue → 数据总览 | 部分跑通 | `issues` 会影响待处理事项、企业问题数和 IOC/指标问题摘要；不会自动修改对应记录的 `qualityStatus`，问题与记录质量状态可能暂时不一致。 |
| 数据总览 → 业务数据 | 部分跑通 | 跳转会携带 `tab`、企业 ID、`dataItemCode`，问题跳转还携带 `issueId`；目标页消费 tab、企业、数据项和 issueId。`year/month` 会被带上但当前未用于过滤。 |
| 数据总览 → 企业档案 | 已实现 | 企业覆盖表携带 `enterpriseId`，档案页可从查询参数打开对应详情。 |
| 数据总览 → 能源与设施 | 已实现（问题下钻） | 能源流向类 DataIssue 的详情入口跳转 `tab=flow` 和 `objectId`，页面会打开对应关系/节点详情。总览本身没有独立“能源缺失”列表。 |
| 数据总览 → 填报任务 | 部分实现 | 企业责任问题详情才显示转填报按钮；管委会进入任务管理，企业进入自身填报页。现有任务页面不消费 `issueId` 自动创建单企业任务。 |

## 7. 数据总览计算逻辑

主要代码在 `src/mock/dataManagementStore.js` 的 `buildDataOverview` 和 `src/pages/data-management/DataOverviewPage.jsx`。

- 纳管企业：`enterpriseRows.filter(item => item.managedStatus === '已纳管')`。
- 预期企业：`managedStatus !== '已退出'` 的企业数量。
- 数据项覆盖率：使用 `dataRequirementRules` 中适用纳管企业的规则，检查 `records` 中是否存在同一 `enterpriseId:dataItemCode` 且未作废的记录。按数据项是否存在计算，不按月份计算。
- 正式入库率：`records` 中未作废记录里 `dataStatus === '正式'` 的比例。当前是记录条数比例，不是按企业/数据项去重比例。
- 待处理数据事项：`issues.status !== '已解决'` 的数量。
- IOC 支撑风险：收集 active DataIssue 的 `relatedIOC` 去重数量，同时页面显示固定基准 `3`，即当前是“动态受影响数 + 静态总基数”。
- 零碳指标风险：收集 `relatedIndicator` 去重数量，同时页面显示固定基准 `11`，总基数不是从指标配置动态计算。
- 数据域准备状态：页面按四个 `businessTabs` 过滤记录，计算覆盖企业数、正式率、待确认数、异常类质量状态数和最近更新时间；这些是动态聚合，但没有按年度/月度筛选。
- 企业数据覆盖状态：按企业统计已出现的数据项数、规则数、正式记录数和关联问题数；规则数仍来自静态 `dataRequirementRules`。

因此，总览不是全静态 Mock，但属于“共享内存数据 + 静态规则/基数 + 页面聚合”的混合实现。

## 8. 能源与设施实现说明

### EnergyNode

当前节点包括：

- `SOURCE`：电网接入点、园区绿电交易来源。
- `FACILITY`：分布式光伏、储能等能源设施。
- `CONSUMER`：每个企业的企业用能节点。

主要字段：`nodeId`、`nodeType`、`nodeRole`、`name`、`enterpriseId`、`subParkId`、`energyType`、`energyAttribute`、`greenSourceType`、`capacity`、`location`、`sourceType`、`status`、`effectiveFrom`。

### EnergyFlowRelation

主要字段：`flowId`、`sourceNodeId`、`targetNodeId`、`energyType`、`energyAttribute`、`greenSourceType`、`effectiveFrom`、`effectiveTo`、`sourceType`、`status`。来源和去向通过节点 ID 关联，页面展示时动态查找节点名称。

### 企业消费节点与绿电

企业消费节点是 `nodeRole: 'CONSUMER'` 的 EnergyNode，通过 `enterpriseId` 对应企业。绿电不是独立能源大类，而是电力节点/关系上的 `energyAttribute: '绿色电力'`，并可附带 `greenSourceType`，例如直连绿电或中长期绿电交易。

### 流量来源与维护边界

能源流向页面不保存月度流量，也没有“最近流量”字段。期间量来自 `businessDataRecords` 的能源数据记录，当前页面只提供“查看期间能源数据”跳转。没有发现流向页面独立维护月度流量的实现。

## 9. 业务数据实现说明

四个 Tab 使用同一 `businessDataRecords` 数组，筛选条件由 `BusinessDataPage.jsx` 实现。

| Tab | 当前记录/口径 |
|---|---|
| 能源数据 | `ENERGY_TOTAL`、`ENERGY_ELECTRICITY`；来源示例为系统自动获取；能源量、电力量为期间记录。 |
| 运营数据 | `OP_INDUSTRIAL_VALUE`；来源为企业常规填报或园区维护；用于工业增加值等经营事实。 |
| 碳排放数据 | `CARBON_SCOPE12`；来源类型为系统计算；通过 `sourceRecordId` 引用对应购入电力业务记录。 |
| 零碳专项数据 | `SPECIAL_CLEAN_RATE`；带 `indicatorId`、年度、凭证/证据，用于清洁能源消费占比等专项支撑值。 |

BusinessDataRecord 当前实际字段包括：

`recordId`、`objectType`、`objectId`、`enterpriseId`、`dataDomain`、`dataItemCode`、`period`、`value`、`unit`、`sourceType`、`sourceRecordId`、`evidence`、`dataStatus`、`qualityStatus`、`createdAt`、`updatedAt`、`version`、`indicatorId`、`history`。

- `dataStatus`：草稿、待审核、正式、已退回、已作废。
- `qualityStatus`：正常、待确认、异常、缺失关联、来源冲突。
- 来源追溯：显示 `sourceType`、`sourceRecordId` 和 `evidence`；碳记录详情额外显示活动数据引用。
- 正式数据修改：只允许在详情中点“修订数据”，保留历史版本并将当前版本置为待确认。
- 新增数据：生成草稿，不直接入正式库。
- 批量导入：只有入口、校验说明和演示提示，没有真实文件选择/解析/落库。
- 空状态：公共 `Table` 在过滤无结果时显示“暂无匹配数据”；没有按四 Tab 分别设计空状态文案。

碳排放记录没有重新维护一份购电活动量；其 `sourceRecordId` 指向同一统一业务记录中的能源电力记录。需要注意，`sharedStore.js` 的 `carbonAccountingData` 兼容投影会按旧字段形状输出活动值，这是读取适配，不是新的数据管理写入源。

## 10. PRD 差异清单

| PRD要求 | 当前实现状态 | 原因/后续 |
|---|---|---|
| 四个管委会页面及菜单收口 | 已实现 | 路由和菜单已按四页配置，数据问题仅保留隐藏路由。 |
| 双碳知识库一级模块直接可点击 | 已实现 | `menuGroupOnly` 控制一级菜单直接跳转。 |
| 企业主数据单一来源 | 已实现 | 主数据迁移到 `masterData.js`；旧模块通过 re-export 使用。 |
| 企业稳定 ID 关联全部下游对象 | 部分实现 | 核心数据管理页面已使用 `enterpriseId`；新增企业不会自动生成规则、节点和记录。 |
| 企业档案不承担业务完整度工作台 | 已实现 | 档案页只展示主数据、标签、生命周期和引用提示。 |
| 企业退出不删除历史引用 | 已实现 | 有业务引用时改为“已退出”。 |
| 能源设施维护稳定属性 | 已实现 | 节点支持新增、编辑、查看、停用。 |
| 能源流向只维护关系和有效期 | 已实现 | 无月度流量字段，期间量转业务数据。 |
| 绿电作为电力属性 | 已实现 | 使用 `energyAttribute` 和 `greenSourceType`。 |
| 业务数据四 Tab 统一事实模型 | 已实现 | 四 Tab 均来自 `businessDataRecords`。 |
| 数据生命周期与质量状态分离 | 已实现 | `dataStatus` 与 `qualityStatus` 独立展示和筛选。 |
| 数据来源、版本、历史可追溯 | 已实现 | 详情、来源记录、凭证说明和版本历史已实现。 |
| 正式数据修订留痕 | 部分实现 | 前端内存中保留 history；无服务端审计、权限和并发控制。 |
| 批量导入及失败行校验 | 部分实现 | 有导入入口和校验说明，但未实现真实文件解析与落库。 |
| 数据总览由共享对象聚合 | 部分实现 | 记录、问题、企业来自共享 Context；要求规则和 IOC/指标总基数仍是静态种子/基数。 |
| 数据总览时间筛选 | 部分实现 | 年/月控件存在，但当前不参与记录过滤。 |
| DataIssue 作为底层对象而非菜单 | 已实现 | `/data-issues` 隐藏，问题可从总览/业务数据下钻。 |
| DataIssue 自动与质量状态联动 | 未实现 | 问题数组与记录数组分离，没有规则引擎或回写服务。 |
| 问题按责任主体处理 | 部分实现 | 企业责任问题显示转填报入口，园区/系统问题不显示；没有问题处理状态编辑工作流。 |
| 问题详情包含类型、描述、关联数据、来源、影响和状态 | 已实现 | `IssueModal` 展示这些字段及相关 IOC/指标。 |
| 企业责任问题转填报 | 部分实现 | 只保留原有页面跳转；任务页不按 issue 参数自动创建单企业任务。 |
| 上下文跳转完整消费 enterpriseId/dataItemCode/period | 部分实现 | enterpriseId、dataItemCode、issueId 已消费；period/year/month 未用于目标筛选。 |
| 真实 API/数据库持久化 | 未实现 | 当前项目仍为前端 Mock/内存状态。 |
| 管委会、企业、admin 权限隔离 | 已实现 | `ProtectedPage` 与路由 roles 生效；未做真实后端权限校验。 |

## 11. 验证结果

已执行：

- `npm run build`：通过，Vite 8.2.2，70 modules transformed。
- 菜单断言：committee 和 enterprise 菜单顺序、菜单项及隐藏问题路由通过；admin 菜单保持可用。
- 数据一致性检查：业务记录 ID 唯一、企业引用有效、碳记录来源引用有效、能源流向节点引用有效、状态枚举有效、业务 DataIssue 对象引用有效。
- HTTP 冒烟：数据总览、企业档案、能源与设施、业务数据、隐藏数据问题、企业数据明细、企业信息等路径均返回 200 和 SPA 根节点。

未执行/不可执行：

- `npm run lint`：项目没有该脚本。
- `npm test`：项目没有该脚本。
- TypeScript/ESLint：项目未配置，因此不存在可报告的对应检查结果，不能据此推断“无类型或 lint 错误”。
- 控制台运行时报错：未通过真实浏览器逐页观察，无法声明“没有控制台错误”。
- 浏览器交互：当前执行环境没有可用的交互浏览器工具；未完成逐按钮人工验收。HTTP 200 不等于交互已验证。
- 中文乱码：源码和构建未发现明显乱码，但未完成浏览器字体/编码视觉验收。
- 交互按钮：代码路径已静态核对主要按钮；未完成真实浏览器点击验收，不能绝对声明所有按钮均无响应问题。

## 12. 当前已知问题

### P0

当前未发现会导致数据管理主路由无法访问、统一数据记录无法加载或构建失败的 P0 问题。

### P1

- DataIssue 不会自动回写对应 BusinessDataRecord 的 `qualityStatus`；问题状态和质量状态可能不一致。
- 数据总览年/月筛选控件、下钻传递的年/月参数目前没有真正参与记录过滤。
- `dataRequirementRules` 是静态种子；新增企业没有自动规则，因此新增企业的覆盖率统计不完整。
- 新增企业没有自动生成企业消费 EnergyNode 和默认业务记录。
- DataIssue 的状态和责任主体没有完整的编辑/处置工作流；主要能力是查看和条件跳转。
- 填报任务页面不消费 issueId/dataItemCode 自动创建单企业任务，当前只是上下文跳转。
- 总览 IOC 基数 3、指标基数 11 是静态展示基数，未从当前指标配置自动计算。

### P2

- 项目仍保留旧模块兼容投影和旧能碳监测页面，后续迁移需要逐页清理。
- 项目没有 TypeScript 类型层、lint、test 和 API 契约，统一模型主要靠 JS 约定维护。
- Breadcrumb 当前是“平台 / 当前页面标题”形式，不是完整的多级返回路径。
- 批量导入、保存等部分交互是原型提示，不提供持久化结果。
- 尚未完成真实浏览器视觉与交互验收。
- 工作区存在本轮之外的既有未跟踪文件，本轮未处理。

## 13. 下一阶段建议：是否进入零碳指标管控模块重构

结论：可以进入“零碳指标管控模块”的页面级原型重构，但不建议直接进入跨模块数据联动和后端契约定稿。

进入前建议先明确或补齐：

1. 确定 DataIssue 与 `qualityStatus` 的权威关系：问题创建、解决、关闭时是否回写质量状态。
2. 确定数据要求规则的生成方式，尤其是新增企业、企业退出和年度切换时的规则生命周期。
3. 确定 BusinessDataRecord 的期间唯一键、版本并发规则和正式入库权限。
4. 确定指标模块读取哪些 DataItemDefinition/BusinessDataRecord，指标结果与数据质量问题如何区分。
5. 定义填报任务从问题详情创建时的真实 API 行为，而不是继续依赖页面跳转参数。
6. 为下一轮建立至少一组可重复的路由/状态测试；如果仍是原型，至少保留模型一致性脚本。

如果下一阶段只做零碳指标页面的信息架构和 Mock 展示，上述事项不是阻塞；如果要做指标自动计算、问题联动或正式验收，它们是进入联动开发前的必要前置条件。