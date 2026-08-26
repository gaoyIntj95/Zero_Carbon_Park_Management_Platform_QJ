# 数据关系

## 单一事实源

- enterprises：企业主数据。
- energyCarbonData：园区能碳总览、数据管理、企业画像共享。
- indicators：零碳指标管控权威 11+1 指标源。
- enterpriseIndicatorResult：企业画像中的企业级指标表现，通过 indicatorId 引用权威指标。
- acceptanceItems / archives / acceptanceMaterials：验收事项、成果、材料及多对多关联。
- greenServices：企业绿色服务门户和成果列表共享。
- carbonAssets：绿色权益与碳资产唯一台账。
- reportingItemTemplates / reportingTasks / reportingTaskItems：任务管理、进度监控、审核和企业填报共享。
- renewableFacilities / operationData / carbonAccountingData / indicatorSpecialData：数据管理各专业数据 Tab 的共享 Mock。

## 页面归属

- scenario → zero-carbon-indicators。
- enterprise-profile / park-assets → energy-carbon-monitoring。
- report-center → zero-carbon-results。
- 五个专业应用路由 → enterprise-green-services。
- enterprise-archive / facilities / enterprise-data-reporting → data-management。
- organization / roles-permissions / logs → system-management。

## 仍存在的局部定义

- FocusPages 中报告中心、知识库、建设任务和情景原型仍保留局部展示数据；这些页面均非 V4 左侧一级入口。
- EnergyCarbonMonitoringPage 仍保留旧监测明细 rows；V4 总览已使用共享 energyCarbonData，后续可继续统一明细源。

