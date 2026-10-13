import { useMemo, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styles from './ProductCarbonFootprint.module.css';
import inventoryStyles from './ProductCarbonFootprintInventory.module.css';

function downloadHtmlReport({ filename, content }: { filename: string; title: string; content: string }) { const blob = new Blob([content], { type: 'text/html;charset=utf-8' }); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click(); URL.revokeObjectURL(url); }

type Project = { id: number; name: string; spec: string; category: string; unit: string; boundary: string; year: string; period: string; processFile?: string; footprint: number; updated: string; status: '已完成' | '数据待完善' };
type Activity = { id: number; stage: string; name: string; amount: string; unit: string; factor: string; source: string; result: string; dataSource: '系统引用' | '页面录入' };
type ActivityType = '原辅材料' | '能源' | '运输' | '工艺排放' | '废弃物';
type ActivityDataCategory = '原辅材料' | '能源与动力' | '运输' | '直接排放' | '废弃物及其他';
type ActivityDataRow = { id: number; category: ActivityDataCategory; name: string; amount: string; unit: string; stage: string; process: string; factor: string; factorValue: string; source: string; evidence: number; remark: string; extra?: string };
type ConfirmedInventory = Record<number, ActivityDataRow[]>;

function emissionOf(row: ActivityDataRow) { return row.amount.trim() && row.factor ? Number(row.amount) * Number.parseFloat(row.factorValue) : 0; }
function inventoryTotal(rows: ActivityDataRow[]) { return rows.reduce((total, row) => total + emissionOf(row), 0); }
function stageLabel(stage: string) { return stage === '原材料获取' ? '原材料获取' : stage === '产品配送' ? '分销与运输' : '生产制造'; }

const initialProjects: Project[] = [
  { id: 1, name: '工业变频器 VFD-75', spec: 'VFD-75 标准型', category: '机械设备', unit: '1 台产品', boundary: '摇篮到大门', year: '2026', period: '2026-01-01 至 2026-12-31', processFile: 'VFD-75-工艺流程图.png', footprint: 86.4, updated: '2026-09-14 16:20', status: '已完成' },
  { id: 2, name: '铝合金型材 6063', spec: '6063-T5', category: '金属制品', unit: '1 t 产品', boundary: '摇篮到大门', year: '2026', period: '2026-01-01 至 2026-12-31', footprint: 1240.8, updated: '2026-09-12 14:30', status: '已完成' },
  { id: 3, name: '电子控制器 EC-20', spec: 'EC-20 通用型', category: '电子电器', unit: '1 件产品', boundary: '摇篮到大门', year: '2026', period: '2026-01-01 至 2026-12-31', footprint: 42.8, updated: '2026-09-10 09:10', status: '已完成' },
  { id: 4, name: '环保包装箱 E-50', spec: 'E-50', category: '包装制品', unit: '1 个产品', boundary: '摇篮到大门', year: '2026', period: '2026-01-01 至 2026-12-31', footprint: 0, updated: '2026-09-08 11:45', status: '数据待完善' },
];

const resultStages = [{ label: '原材料获取', value: 187.55, color: '#4d87da' }, { label: '生产制造', value: 54.62, color: '#24a8b5' }, { label: '分销与运输', value: 4.22, color: '#68bd69' }];
const resultActivities = [
  ['原材料获取', '主要原材料A', '58.00 kg/功能单位', '2.150 kgCO₂e/kg', '供应商特定因子', '124.70'],
  ['原材料获取', '主要原材料B', '12.00 kg/功能单位', '4.320 kgCO₂e/kg', 'CPCD', '51.84'],
  ['原材料获取', '辅助材料', '3.50 kg/功能单位', '1.860 kgCO₂e/kg', 'CPCD', '6.51'],
  ['原材料获取', '原材料入厂运输', '46.00 t·km/功能单位', '0.0978 kgCO₂e/(t·km)', 'CPCD', '4.50'],
  ['生产制造', '外购电力', '82.00 kWh/功能单位', '0.5306 kgCO₂e/kWh', '国家电力因子', '43.51'],
  ['生产制造', '天然气燃烧', '4.20 Nm³/功能单位', '2.162 kgCO₂e/Nm³', '国家因子库', '9.08'],
  ['生产制造', '工艺过程排放', '1.00 功能单位', '0.850 kgCO₂e/功能单位', '企业特定数据', '0.85'],
  ['生产制造', '生产废弃物处理', '2.80 kg/功能单位', '0.420 kgCO₂e/kg', 'CPCD', '1.18'],
  ['分销与运输', '成品公路运输', '35.00 t·km/功能单位', '0.0978 kgCO₂e/(t·km)', 'CPCD', '3.42'],
  ['分销与运输', '成品仓储用电', '1.50 kWh/功能单位', '0.5306 kgCO₂e/kWh', '国家电力因子', '0.80'],
];
type FactorRow = { id: string; name: string; category: string; value: string; unit: string; region: string; year: string; source: string };
const factorRows: FactorRow[] = [
  { id: 'factor-steel', name: '电工钢', category: '原辅材料', value: '2.150', unit: 'kgCO₂e/kg', region: '中国', year: '示例', source: '供应商/数据库' },
  { id: 'factor-aluminum', name: '铝材', category: '原辅材料', value: '4.320', unit: 'kgCO₂e/kg', region: '中国', year: '示例', source: 'CPCD' },
  { id: 'factor-electricity', name: '外购电力', category: '能源与燃料', value: '0.5306', unit: 'kgCO₂e/kWh', region: '全国', year: '2024', source: '国家因子库' },
  { id: 'factor-gas', name: '天然气燃烧', category: '能源与燃料', value: '2.162', unit: 'kgCO₂e/Nm³', region: '中国', year: '示例', source: '国家因子库' },
  { id: 'factor-transport', name: '重型柴油货车运输', category: '运输', value: '0.0978', unit: 'kgCO₂e/(t·km)', region: '中国', year: '示例', source: 'CPCD' },
  { id: 'factor-waste', name: '一般工业固废处理', category: '废弃物处理', value: '0.120', unit: 'kgCO₂e/kg', region: '中国', year: '示例', source: 'CPCD' },
];
const lifecycleStages = [
  ['raw', '原材料获取阶段', '原辅材料、包装物及原材料入厂运输'],
  ['manufacturing', '产品制造阶段', '能源与燃料、工艺过程排放及废弃物处理'],
  ['distribution', '产品配送阶段', '成品运输方式、距离及装载率'],
  ['use', '使用阶段', '产品使用期间的能源与资源消耗'],
  ['end', '生命周期末端', '回收、处置及废弃物处理数据'],
] as const;
const initialActivities: Activity[] = [
  { id: 1, stage: '原材料获取', name: '热轧钢卷', amount: '36.2', unit: 'kg', factor: '1.82', source: '供应商报告', result: '65.88', dataSource: '页面录入' },
  { id: 2, stage: '生产制造', name: '外购电力', amount: '25.6', unit: 'kWh', factor: '0.5703', source: '全国电力因子', result: '14.60', dataSource: '系统引用' },
  { id: 3, stage: '分销与运输', name: '公路运输', amount: '42.0', unit: 't·km', factor: '0.108', source: 'IPCC 2006', result: '4.54', dataSource: '页面录入' },
];

type ActivityGroupKey = 'materials' | 'inboundTransport' | 'energy' | 'process' | 'waste' | 'distribution';
type PreparedActivity = { name: string; sourceValue: string; attribution: string; perUnit: string; basis: string; status: '已转换' | '待确认' };
type InventoryItem = { name: string; activity: string; factor: string; factorMeta: string; result: string; status: '已完成' | '待选择因子' };

const activityGroups: Array<{ key: ActivityGroupKey; stage: string; label: string }> = [
  { key: 'materials', stage: '原材料获取阶段', label: '原辅材料' },
  { key: 'inboundTransport', stage: '原材料获取阶段', label: '入厂运输' },
  { key: 'energy', stage: '产品制造阶段', label: '能源消耗' },
  { key: 'process', stage: '产品制造阶段', label: '工艺过程排放' },
  { key: 'waste', stage: '产品制造阶段', label: '废弃物处理' },
  { key: 'distribution', stage: '产品配送阶段', label: '产品运输' },
];

const preparedActivities: Record<ActivityGroupKey, PreparedActivity[]> = {
  materials: [
    { name: '热轧钢卷', sourceValue: '362,000 kg', attribution: '1#机加工与装配线｜直接归属 100%', perUnit: '36.20 kg/台', basis: '采购台账', status: '已转换' },
    { name: '铜材', sourceValue: '18,500 kg', attribution: '1#机加工与装配线｜按产品产量分配 82%', perUnit: '1.52 kg/台', basis: '领料记录', status: '已转换' },
    { name: '纸箱及包装物', sourceValue: '待补充', attribution: '目标产品直接数据｜无需分配', perUnit: '—', basis: '包装清单', status: '待确认' },
  ],
  inboundTransport: [{ name: '原材料公路运输', sourceValue: '420,000 t·km', attribution: '1#机加工与装配线｜直接归属 100%', perUnit: '42.00 t·km/台', basis: '物流台账', status: '已转换' }],
  energy: [{ name: '外购电力', sourceValue: '256,000 kWh', attribution: '1#机加工与装配线｜按工时分配 100%', perUnit: '25.60 kWh/台', basis: '电表与产量记录', status: '已转换' }],
  process: [{ name: '表面处理工艺排放', sourceValue: '10,000 台', attribution: '目标产品直接数据｜无需分配', perUnit: '1.00 台/台', basis: '工艺记录', status: '已转换' }],
  waste: [{ name: '一般工业固废', sourceValue: '28,000 kg', attribution: '1#机加工与装配线｜按产量分配 100%', perUnit: '2.80 kg/台', basis: '固废台账', status: '已转换' }],
  distribution: [{ name: '成品公路运输', sourceValue: '350,000 t·km', attribution: '目标产品直接数据｜无需分配', perUnit: '35.00 t·km/台', basis: '销售物流台账', status: '已转换' }],
};

const inventoryItems: Record<ActivityGroupKey, InventoryItem[]> = {
  materials: [
    { name: '热轧钢卷', activity: '36.20 kg/台', factor: '热轧钢材', factorMeta: '1.82 kgCO₂e/kg · 供应商报告', result: '65.88 kgCO₂e/台', status: '已完成' },
    { name: '铜材', activity: '1.52 kg/台', factor: '铜材生产', factorMeta: '4.32 kgCO₂e/kg · CPCD', result: '6.57 kgCO₂e/台', status: '已完成' },
    { name: '纸箱及包装物', activity: '0.80 kg/台', factor: '尚未选择背景因子', factorMeta: '', result: '—', status: '待选择因子' },
  ],
  inboundTransport: [{ name: '原材料公路运输', activity: '42.00 t·km/台', factor: '重型柴油货车运输', factorMeta: '0.108 kgCO₂e/(t·km) · IPCC 2006', result: '4.54 kgCO₂e/台', status: '已完成' }],
  energy: [{ name: '外购电力', activity: '25.60 kWh/台', factor: '全国电力平均因子', factorMeta: '0.5703 kgCO₂e/kWh · 国家因子库', result: '14.60 kgCO₂e/台', status: '已完成' }],
  process: [{ name: '表面处理工艺排放', activity: '1.00 台/台', factor: '企业工艺过程因子', factorMeta: '0.85 kgCO₂e/台 · 企业特定数据', result: '0.85 kgCO₂e/台', status: '已完成' }],
  waste: [{ name: '一般工业固废', activity: '2.80 kg/台', factor: '一般工业固废处理', factorMeta: '0.42 kgCO₂e/kg · CPCD', result: '1.18 kgCO₂e/台', status: '已完成' }],
  distribution: [{ name: '成品公路运输', activity: '35.00 t·km/台', factor: '重型柴油货车运输', factorMeta: '0.0978 kgCO₂e/(t·km) · CPCD', result: '3.42 kgCO₂e/台', status: '已完成' }],
};

const activityDataCategories: Array<{ key: ActivityDataCategory; count: number }> = [
  { key: '原辅材料', count: 12 },
  { key: '能源与动力', count: 8 },
  { key: '运输', count: 5 },
  { key: '直接排放', count: 2 },
  { key: '废弃物及其他', count: 4 },
];
const initialActivityData: ActivityDataRow[] = [
  { id: 101, category: '原辅材料', name: '热轧钢卷', amount: '36.2', unit: 'kg', stage: '原材料获取', process: '—', factor: '热轧钢材', factorValue: '1.82 kgCO₂e/kg', source: '供应商报告', evidence: 2, remark: '' },
  { id: 102, category: '原辅材料', name: '铜材', amount: '1.52', unit: 'kg', stage: '原材料获取', process: '—', factor: '铜材生产', factorValue: '4.32 kgCO₂e/kg', source: 'CPCD', evidence: 1, remark: '' },
  { id: 103, category: '原辅材料', name: '纸箱及包装物', amount: '0.8', unit: 'kg', stage: '原材料获取', process: '—', factor: '', factorValue: '', source: '采购台账', evidence: 1, remark: '包装材料归入原辅材料' },
  { id: 104, category: '能源与动力', name: '外购电力', amount: '25.6', unit: 'kWh', stage: '产品生产', process: '装配', factor: '中国区域电网平均电力', factorValue: '0.5306 kgCO₂e/kWh', source: '电表记录', evidence: 2, remark: '按单台产品装配、测试工序分摊' },
  { id: 105, category: '能源与动力', name: '天然气', amount: '0.85', unit: 'Nm³', stage: '产品生产', process: '表面处理', factor: '天然气燃烧因子', factorValue: '2.162 kgCO₂e/Nm³', source: '抄表记录', evidence: 1, remark: '按单台产品表面处理工序分摊' },
  { id: 106, category: '运输', name: '原材料公路运输', amount: '42', unit: 't·km', stage: '原材料获取', process: '—', factor: '重型柴油货车运输', factorValue: '0.0978 kgCO₂e/(t·km)', source: '物流台账', evidence: 1, remark: '', extra: '公路 · 120 km · 0.35 t' },
  { id: 107, category: '直接排放', name: '表面处理工艺排放', amount: '1', unit: '功能单位', stage: '产品生产', process: '表面处理', factor: '企业工艺过程因子', factorValue: '0.85 kgCO₂e/功能单位', source: '工艺记录', evidence: 1, remark: '' },
  { id: 108, category: '废弃物及其他', name: '一般工业固废', amount: '2.8', unit: 'kg', stage: '产品生产', process: '—', factor: '一般工业固废处理', factorValue: '0.42 kgCO₂e/kg', source: '固废台账', evidence: 1, remark: '' },
  { id: 109, category: '运输', name: '成品公路运输', amount: '35', unit: 't·km', stage: '产品配送', process: '成品出库', factor: '重型柴油货车运输', factorValue: '0.0978 kgCO₂e/(t·km)', source: '销售物流台账', evidence: 1, remark: '按单台产品 0.035 t、平均配送距离 1,000 km 折算' },
];

// 核算清单必须按“产品 + 功能单位 + 边界 + 期间”对应的项目隔离，不能在
// 不同产品项目间复用活动数据或已确认快照。
const initialProjectInventories: ConfirmedInventory = {
  1: initialActivityData,
  2: [
    { ...initialActivityData[0], id: 201, name: '铝锭', amount: '1.04', unit: 't', factor: '原铝生产', factorValue: '10.80 kgCO₂e/kg', source: '供应商 EPD', evidence: 2 },
    { ...initialActivityData[4], id: 202, name: '外购电力', amount: '185', unit: 'kWh', factorValue: '0.5306 kgCO₂e/kWh', source: '挤压车间电表', evidence: 2 },
    { ...initialActivityData[8], id: 203, name: '型材公路运输', amount: '280', unit: 't·km', source: '销售物流台账', evidence: 1 },
  ],
  3: [
    { ...initialActivityData[0], id: 301, name: 'PCB 线路板', amount: '0.32', unit: 'kg', factor: '印制电路板生产', factorValue: '16.40 kgCO₂e/kg', source: '供应商碳数据', evidence: 2 },
    { ...initialActivityData[1], id: 302, name: '电子元器件', amount: '0.18', unit: 'kg', factor: '电子元器件生产', factorValue: '22.60 kgCO₂e/kg', source: '采购台账', evidence: 1 },
    { ...initialActivityData[4], id: 303, name: '外购电力', amount: '12.6', unit: 'kWh', source: '装配线电表', evidence: 1 },
  ],
  4: [],
};

export function ProductCarbonFootprint({ pathname }: { pathname: string }) {
  const [projects, setProjects] = useState(initialProjects);
  const [activeProjectId, setActiveProjectId] = useState(1);
  const [inventories, setInventories] = useState<ConfirmedInventory>(() => initialProjectInventories);
  const [confirmedInventories, setConfirmedInventories] = useState<ConfirmedInventory>(() => ({ 1: initialProjectInventories[1], 2: initialProjectInventories[2], 3: initialProjectInventories[3] }));
  const [generatedReportIds, setGeneratedReportIds] = useState<number[]>([1]);
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');
  const [year, setYear] = useState('');
  const [modal, setModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Project | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [factorModal, setFactorModal] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const page = pathname.split('/').pop() ?? 'projects';
  const detailProjectId = pathname.match(/\/product-carbon-footprint\/projects\/([^/]+)$/)?.[1];
  const requestedProjectId = Number(searchParams.get('projectId'));
  const selectedProjectId = projects.some((item) => item.id === requestedProjectId) ? requestedProjectId : activeProjectId;
  const selectProject = (projectId: number) => {
    setActiveProjectId(projectId);
    navigate(`/product-carbon-footprint/${page}?projectId=${projectId}`);
  };
  const filtered = useMemo(() => projects.filter((item) => (!keyword || item.name.includes(keyword)) && (!category || item.category === category) && (!year || item.year.startsWith(year))), [projects, keyword, category, year]);
  const addProject = (project: Pick<Project, 'name' | 'spec' | 'category' | 'unit' | 'boundary' | 'period' | 'processFile'>) => { setProjects((items) => [{ ...project, id: Date.now(), year: project.period, footprint: 0, updated: '刚刚', status: '数据待完善' }, ...items]); setModal(false); };
  const updateInventory = (projectId: number, rows: ActivityDataRow[]) => setInventories((items) => ({ ...items, [projectId]: rows }));
  const confirmInventory = (projectId: number, rows: ActivityDataRow[]) => {
    const total = inventoryTotal(rows);
    setConfirmedInventories((items) => ({ ...items, [projectId]: rows.map((row) => ({ ...row })) }));
    setProjects((items) => items.map((item) => item.id === projectId ? { ...item, footprint: total, status: '已完成', updated: '刚刚' } : item));
  };
  const updateProject = (project: Pick<Project, 'name' | 'spec' | 'category' | 'unit' | 'boundary' | 'period' | 'processFile'>) => {
    if (!editTarget) return;
    setProjects((items) => items.map((item) => item.id === editTarget.id ? { ...item, ...project, year: project.period.match(/\d{4}/)?.[0] ?? item.year, updated: '刚刚' } : item));
    setEditTarget(null);
  };

  if (page === 'activity' || page === 'data') return <InventoryReferencePageV2 projects={projects} project={projects.find((item) => item.id === selectedProjectId) ?? projects[0]} activities={inventories[selectedProjectId] ?? []} confirmed={Boolean(confirmedInventories[selectedProjectId])} onProjectChange={selectProject} onActivitiesChange={(rows) => updateInventory(selectedProjectId, rows)} onConfirm={(rows) => confirmInventory(selectedProjectId, rows)} />;
  if (page === 'results') return <LinkedResultsPage projects={projects} activeProjectId={selectedProjectId} confirmedRows={confirmedInventories[selectedProjectId]} onProjectChange={selectProject} />;
  if (page === 'reports') return <LinkedReportsPage projects={projects} activeProjectId={selectedProjectId} confirmedRows={confirmedInventories[selectedProjectId]} generatedReportIds={generatedReportIds} onProjectChange={selectProject} onGenerate={() => setGeneratedReportIds((ids) => ids.includes(selectedProjectId) ? ids : [...ids, selectedProjectId])} />;
  if (page === 'factors') return <FactorsPage addModal={factorModal} onCloseAddModal={() => setFactorModal(false)} />;
  if (detailProjectId) {
    return <ActivityPreparationPage projectId={detailProjectId} />;
  }
  return <div className={styles.page}>
    <div className={styles.notice}><b>通用版 V1：</b>先确定产品与核算范围，再按生命周期阶段维护原辅材料、能源、运输、工艺排放和废弃物等活动数据。</div>
    <div className={styles.filters}><label>产品名称<input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="请输入产品名称" /></label><label>产品类别<select value={category} onChange={(event) => setCategory(event.target.value)}><option value="">全部类别</option><option>机械设备</option><option>金属制品</option><option>电子电器</option><option>包装制品</option></select></label><label>核算年度<select value={year} onChange={(event) => setYear(event.target.value)}><option value="">全部年度</option><option value="2026">2026 年度</option><option value="2025">2025 年度</option></select></label><button className={styles.primary}>查询</button><button className={styles.button} onClick={() => { setKeyword(''); setCategory(''); setYear(''); }}>重置</button></div>
    <section className={styles.card}><div className={styles.cardHead}><div><b>产品碳足迹项目列表</b><span>共 {filtered.length} 个项目</span></div><button className={styles.primary} onClick={() => setModal(true)}>＋ 新建项目</button></div><div className={`${styles.tableWrap} ${styles.projectTableWrap}`}><table className={styles.projectTable}><thead><tr>{['序号', '产品名称', '产品类别', '功能单位', '系统边界', '核算年度', '产品碳足迹', '更新时间', '状态', '操作'].map((head) => <th key={head}>{head}</th>)}</tr></thead><tbody>{filtered.map((item, index) => <tr key={item.id}><td>{index + 1}</td><td><button className={styles.projectLink} onClick={() => { setActiveProjectId(item.id); navigate(`/product-carbon-footprint/activity?projectId=${item.id}`); }}>{item.name}</button></td><td>{item.category}</td><td>{item.unit}</td><td>{item.boundary}</td><td>{item.year}</td><td>{item.footprint ? <strong className={styles.footprint}>{item.footprint.toFixed(2)} <small>kgCO₂e/功能单位</small></strong> : '—'}</td><td>{item.updated}</td><td><span className={item.status === '已完成' ? styles.success : styles.warning}>{item.status}</span></td><td><button className={styles.text} onClick={() => { setActiveProjectId(item.id); navigate(`/product-carbon-footprint/activity?projectId=${item.id}`); }}>进入项目</button><button className={styles.text} onClick={() => setEditTarget(item)}>编辑</button><button className={`${styles.text} ${styles.deleteButton}`} onClick={() => setDeleteTarget(item)}>删除</button></td></tr>)}</tbody></table></div><div className={styles.pager}>共 {filtered.length} 条 <span>10 条/页 &lt; <b>1</b> &gt;</span></div></section>
    {modal && <ProjectModal onClose={() => setModal(false)} onSubmit={addProject} />}
    {editTarget && <ProjectModal project={editTarget} onClose={() => setEditTarget(null)} onSubmit={updateProject} />}
    {deleteTarget && <DeleteConfirm project={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={() => { setProjects((items) => items.filter((project) => project.id !== deleteTarget.id)); setDeleteTarget(null); }} />}
  </div>;
}

function ProjectDetail({ project, onBack, onEdit }: { project: Project; onBack: () => void; onEdit: () => void }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'lifecycle' | 'data' | 'result' | 'report'>('lifecycle');
  const [activityModal, setActivityModal] = useState(false);
  const [activities, setActivities] = useState(initialActivities);
  const labels = { lifecycle: '生命周期模型', data: '核算清单', result: '核算结果', report: '报告' };
  const addActivity = (activity: Activity) => { setActivities((items) => [...items, activity]); setActivityModal(false); };
  return <div className={styles.page}><button className={styles.back} onClick={onBack}>‹ 返回项目管理</button><section className={styles.projectHeader}><div><h2>{project.name} 碳足迹项目</h2><div className={styles.projectMeta}><span>产品类别<b>{project.category}</b></span><span>功能单位<b>{project.unit}</b></span><span>系统边界<b>{project.boundary}</b></span><span>核算年度<b>{project.year}</b></span></div></div><div><button className={styles.button} onClick={onEdit}>编辑项目</button><button className={styles.primary} onClick={() => setTab('report')}>生成报告</button></div></section><div className={styles.projectTabs}>{(Object.keys(labels) as Array<keyof typeof labels>).map((key) => <button key={key} className={tab === key ? styles.projectTabActive : ''} onClick={() => setTab(key)}>{labels[key]}</button>)}</div>{tab === 'lifecycle' && <LifecycleTab onPrepare={(group) => navigate(`/product-carbon-footprint/activity?projectId=${project.id}&group=${group}`)} />}{tab === 'data' && <section className={styles.card}><div className={styles.cardHead}><div><b>项目活动数据</b><span> 共 {activities.length} 项排放活动</span></div><button className={styles.primary} onClick={() => setActivityModal(true)}>＋ 新增活动数据</button></div><ActivityTable activities={activities} /></section>}{tab === 'result' && <ResultsPage />}{tab === 'report' && <ProjectReport project={project} />}{activityModal && <ActivityModal onClose={() => setActivityModal(false)} onSubmit={addActivity} />}</div>;
}
function LifecycleTab({ onPrepare }: { onPrepare: (group: ActivityGroupKey) => void }) { return <><div className={styles.cardHead}><div><b>生命周期范围</b><span>由项目创建时选择的系统边界确定，当前页面只读展示</span></div></div><div className={styles.notice}>具体数据统一在活动数据准备页面维护；使用阶段和生命周期末端一期不纳入。</div><div className={styles.lifecycleFlow}>{lifecycleModelStages.map((stage, index) => <section className={`${styles.lifecycleStage} ${!stage.available ? styles.lifecycleStageDisabled : ''}`} key={stage.key}><div><span>{`0${index + 1}`}</span><b>{stage.title}</b></div><p>{stage.description}</p>{stage.available ? <><ul>{stage.groups.map((groupKey) => <li key={groupKey}>✓ {activityGroups.find((item) => item.key === groupKey)?.label}</li>)}</ul><button className={styles.text} onClick={() => onPrepare(stage.groups[0])}>进入该阶段数据准备 →</button></> : <div className={styles.phaseUnavailable}><b>一期不纳入</b><span>仅保留范围说明，不提供录入入口。</span></div>}</section>)}</div></>; }
function ProjectReport({ project }: { project: Project }) { return <><div className={styles.notice}>报告将自动汇集产品信息、功能单位、系统边界、数据来源、因子来源与核算结果；适用 PCR 或行业标准可按项目选择。</div><section className={styles.card}><div className={styles.cardHead}><b>{project.name} 产品碳足迹报告</b><div><button className={styles.button}>预览报告</button> <button className={styles.primary}>⇩ 下载报告</button></div></div><div className={styles.reportReady}><span>✓</span><div><b>报告已具备生成条件</b><p>最近核算：2026-09-14 16:20 | 报告格式：产品碳足迹量化报告</p></div></div></section></>; }

const lifecycleModelStages: Array<{ key: string; title: string; description: string; groups: ActivityGroupKey[]; available: boolean }> = [
  { key: 'raw', title: '原材料获取阶段', description: '覆盖原辅材料、包装物及原材料入厂运输。', groups: ['materials', 'inboundTransport'], available: true },
  { key: 'manufacturing', title: '产品制造阶段', description: '覆盖能源与燃料、工艺过程排放及废弃物处理。', groups: ['energy', 'process', 'waste'], available: true },
  { key: 'distribution', title: '产品配送阶段', description: '覆盖成品公路、铁路、水路等运输活动，是否纳入以项目核算边界为准。', groups: ['distribution'], available: true },
  { key: 'use', title: '使用阶段', description: '产品使用期间的能源与资源消耗。', groups: [], available: false },
  { key: 'end', title: '生命周期末端', description: '产品回收、处置及废弃物处理。', groups: [], available: false },
];

function InventoryReferencePageV2({ projects, project, activities, confirmed, onProjectChange, onActivitiesChange, onConfirm }: { projects: Project[]; project: Project; activities: ActivityDataRow[]; confirmed: boolean; onProjectChange: (projectId: number) => void; onActivitiesChange: (rows: ActivityDataRow[]) => void; onConfirm: (rows: ActivityDataRow[]) => void }) {
  const [group, setGroup] = useState<ActivityGroupKey>('materials');
  const [queryInput, setQueryInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dataTarget, setDataTarget] = useState<ActivityDataRow | null>(null);
  const [factorTarget, setFactorTarget] = useState<ActivityDataRow | null>(null);
  const [evidenceTarget, setEvidenceTarget] = useState<ActivityDataRow | null>(null);
  const [viewTarget, setViewTarget] = useState<ActivityDataRow | null>(null);
  const groupCategory: Record<ActivityGroupKey, ActivityDataCategory> = { materials: '原辅材料', inboundTransport: '运输', energy: '能源与动力', process: '直接排放', waste: '废弃物及其他', distribution: '运输' };
  const rows = activities.filter((item) => item.category === groupCategory[group] && (!keyword || `${item.name}${item.source}${item.factor}`.includes(keyword)));
  const total = rows.reduce((sum, row) => sum + (row.factor ? Number(row.amount) * Number.parseFloat(row.factorValue) : 0), 0);
  const allTotal = activities.reduce((sum, row) => sum + (row.factor ? Number(row.amount) * Number.parseFloat(row.factorValue) : 0), 0);
  const pendingCount = activities.filter((item) => !item.amount.trim() || !item.factor).length;
  const selectedGroup = activityGroups.find((item) => item.key === group);
  const addType: ActivityType = group === 'materials' ? '原辅材料' : group === 'energy' ? '能源' : group === 'process' ? '工艺排放' : group === 'waste' ? '废弃物' : '运输';
  const groups: Array<{ title: string; keys: ActivityGroupKey[] }> = [
    { title: '原材料获取', keys: ['materials', 'inboundTransport'] },
    { title: '产品制造', keys: ['energy', 'process', 'waste'] },
    { title: '产品配送', keys: ['distribution'] },
  ];
  const resetQuery = () => { setQueryInput(''); setKeyword(''); };
  return <div className={inventoryStyles.page}>
    <div className={inventoryStyles.head}>
      <div><div className={inventoryStyles.crumb}>产品碳足迹 / 核算清单</div><h1>碳足迹核算清单</h1><div className={inventoryStyles.subtitle}>按生命周期阶段维护核算项、活动数据、排放因子和证明材料。</div></div>
      <div className={inventoryStyles.actions}><button className={`${inventoryStyles.btn} ${inventoryStyles.primary}`} style={pendingCount > 0 ? { background: '#6d817a', borderColor: '#6d817a', color: '#fff', opacity: 1 } : undefined} disabled={pendingCount > 0} onClick={() => onConfirm(activities)}>{confirmed ? '已确认核算清单' : '确认核算清单'}</button></div>
    </div>
    <div className={inventoryStyles.summary}>
      <div className={inventoryStyles.project}>
        <label className={inventoryStyles.projectSelect}><span>核算项目</span><select aria-label="核算项目" value={String(project.id)} onChange={(event) => { onProjectChange(Number(event.target.value)); resetQuery(); setGroup('materials'); }}>
          {projects.map((item) => <option value={item.id} key={item.id}>{item.name}｜{item.spec}｜{item.year}年度</option>)}
        </select></label>
        <span className={inventoryStyles.meta}>功能单位：{project.unit}</span><span className={inventoryStyles.meta}>核算边界：{project.boundary}</span>
      </div>
      <div className={inventoryStyles.project}><span className={inventoryStyles.meta}>共 {activities.length} 项</span><span className={inventoryStyles.meta}>已完成 {activities.length - pendingCount} 项</span><span className={inventoryStyles.meta}>待完善 {pendingCount} 项</span><strong>{allTotal.toFixed(2)} kgCO₂e</strong></div>
    </div>
    <div className={inventoryStyles.workspace}>
      <aside className={inventoryStyles.side} aria-label="生命周期阶段导航">
        <div className={inventoryStyles.sideHead}>
          <div className={inventoryStyles.sideTitle}>生命周期</div>
          <p>按阶段完善核算项</p>
        </div>
        <div className={inventoryStyles.lifecycleRail}>
        {groups.map((stage, stageIndex) => {
          return <div className={inventoryStyles.group} key={stage.title}>
          <div className={inventoryStyles.groupTitle}><span className={inventoryStyles.stageMarker}>{stageIndex + 1}</span><span>{stage.title}</span></div>
          {stage.keys.map((key) => {
            const active = group === key;
            return <button key={key} className={`${inventoryStyles.nav} ${active ? inventoryStyles.navActive : ''}`} onClick={() => { setGroup(key); resetQuery(); }}><span className={inventoryStyles.navDot} aria-hidden="true" /><span className={inventoryStyles.navLabel}>{activityGroups.find((item) => item.key === key)?.label}</span></button>;
          })}
        </div>; })}
        </div>
      </aside>
      <main className={inventoryStyles.main}>
        <div className={inventoryStyles.stageHead}>
          <div><div className={inventoryStyles.stageName}>{selectedGroup?.label}</div><div className={inventoryStyles.stageMeta}>{rows.length} 项核算数据 ｜ 阶段小计 {total.toFixed(2)} kgCO₂e</div></div>
          <div className={inventoryStyles.stageActions}>
            <input className={inventoryStyles.search} value={queryInput} onChange={(event) => setQueryInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') setKeyword(queryInput.trim()); }} placeholder="搜索核算项、因子或来源" />
            <button className={`${inventoryStyles.btn} ${inventoryStyles.primary}`} onClick={() => setKeyword(queryInput.trim())}>查询</button>
            <button className={inventoryStyles.btn} onClick={resetQuery}>重置</button>
            <button className={inventoryStyles.btn} onClick={() => setDrawerOpen(true)}>＋ 新增{group === 'materials' ? '原辅材料' : selectedGroup?.label}</button>
          </div>
        </div>
        <div className={inventoryStyles.tableWrap}><table className={inventoryStyles.table}>
          <thead><tr>{['核算项', '活动数据', '排放因子', '排放量', '证明材料', '数据状态', '操作'].map((head) => <th key={head}>{head}</th>)}</tr></thead>
          <tbody>{rows.map((row) => {
            const dataMissing = !row.amount.trim();
            const factorMissing = !row.factor;
            const emission = !dataMissing && !factorMissing ? Number(row.amount) * Number.parseFloat(row.factorValue) : 0;
            const status = dataMissing && factorMissing ? '数据与因子缺失' : dataMissing ? '数据缺失' : factorMissing ? '因子缺失' : '已完成';
            return <tr key={row.id}><td><span className={inventoryStyles.name}>{row.name}</span></td><td><b>{dataMissing ? '—' : `${row.amount} ${row.unit}`}</b></td><td><span className={inventoryStyles.factorInfo}>{factorMissing ? '—' : row.factor}<small>{factorMissing ? '' : row.factorValue}</small></span></td><td>{!dataMissing && !factorMissing ? <b className={inventoryStyles.emission}>{emission.toFixed(2)} kgCO₂e</b> : '—'}</td><td>{row.evidence > 0 ? <button className={inventoryStyles.evidenceLink} onClick={() => setEvidenceTarget(row)}>{row.evidence} 份材料</button> : <span className={inventoryStyles.muted}>未上传</span>}</td><td><span className={`${inventoryStyles.status} ${status === '已完成' ? inventoryStyles.statusDone : ''}`}>{status}</span></td><td><div className={inventoryStyles.rowActions}><button className={inventoryStyles.text} onClick={() => setViewTarget(row)}>查看</button><button className={inventoryStyles.text} onClick={() => setDataTarget(row)}>编辑</button><button className={`${inventoryStyles.text} ${inventoryStyles.deleteText}`} onClick={() => { if (window.confirm(`确定删除“${row.name}”吗？`)) onActivitiesChange(activities.filter((item) => item.id !== row.id)); }}>删除</button></div></td></tr>;
          })}</tbody>
        </table></div>
        <div className={inventoryStyles.foot}>当前阶段小计 <strong>{total.toFixed(2)} kgCO₂e</strong></div>
      </main>
    </div>
    {drawerOpen && <ReferenceActivityDrawer type={addType} group={group} onClose={() => setDrawerOpen(false)} onSubmit={(row) => { onActivitiesChange([...activities, row]); setDrawerOpen(false); }} />}
    {dataTarget && <ReferenceActivityDrawer type={addType} group={group} row={dataTarget} mode="data" onClose={() => setDataTarget(null)} onSubmit={(row) => { onActivitiesChange(activities.map((item) => item.id === dataTarget.id ? row : item)); setDataTarget(null); }} />}
    {factorTarget && <FactorPicker activity={factorTarget} onClose={() => setFactorTarget(null)} onSelect={(factor) => { onActivitiesChange(activities.map((item) => item.id === factorTarget.id ? { ...item, factor: factor.name, factorValue: factor.value } : item)); setFactorTarget(null); }} />}
    {evidenceTarget && <InventoryEvidenceModal activity={evidenceTarget} onClose={() => setEvidenceTarget(null)} />}
    {viewTarget && <InventoryActivityDetail activity={viewTarget} onClose={() => setViewTarget(null)} />}
  </div>;
}

function InventoryActivityDetail({ activity, onClose }: { activity: ActivityDataRow; onClose: () => void }) {
  const emission = activity.factor && activity.amount.trim() ? Number(activity.amount) * Number.parseFloat(activity.factorValue) : null;
  return <div className={styles.overlay} onMouseDown={onClose}><section className={styles.modal} role="dialog" aria-modal="true" aria-label="核算项详情" style={{ width: 'min(680px, 94vw)' }} onMouseDown={(event) => event.stopPropagation()}><header><div><b>核算项详情</b><span className={styles.modalSubTitle}>{activity.name}</span></div><button type="button" onClick={onClose}>×</button></header><div><FactorDetail title="核算数据" rows={[["核算项", activity.name], ["类别", activity.category], ["活动数据", activity.amount ? `${activity.amount} ${activity.unit}` : "未填写"], ["数据来源", activity.source || "未填写"], ["排放因子", activity.factor || "未选择"], ["因子值", activity.factorValue || "—"], ["排放量", emission === null ? "—" : `${emission.toFixed(2)} kgCO₂e`], ["证明材料", `${activity.evidence} 份`], ["备注", activity.remark || "—"]]} /></div><footer><button type="button" className={inventoryStyles.btn} onClick={onClose}>关闭</button></footer></section></div>;
}

function InventoryEvidenceModal({ activity, onClose }: { activity: ActivityDataRow; onClose: () => void }) {
  const files = Array.from({ length: activity.evidence }, (_, index) => `${activity.name}-材料-${index + 1}.${index === 1 ? 'xlsx' : 'pdf'}`);
  return <div className={styles.overlay} onMouseDown={onClose}><section className={styles.modal} role="dialog" aria-modal="true" aria-label="查看核查材料" style={{ width: 'min(840px, 94vw)' }} onMouseDown={(event) => event.stopPropagation()}><header><div><b>查看核查材料</b><span className={styles.modalSubTitle}>{activity.name} · 活动数据证明材料</span></div><button type="button" onClick={onClose}>×</button></header><div><div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '10px 14px', marginBottom: 18, color: '#526860' }}><span style={{ color: '#71808f' }}>材料类别</span><span>核算活动证明材料</span><span style={{ color: '#71808f' }}>材料说明</span><span>{activity.name} · 数据来源：{activity.source}</span></div><div style={{ overflow: 'auto', border: '1px solid #dce8e3', borderRadius: 8 }}><table style={{ width: '100%', minWidth: 0, borderCollapse: 'collapse' }}><thead><tr><th style={{ padding: '12px 16px', background: '#eff9f5', textAlign: 'left' }}>文件名称</th><th style={{ padding: '12px 16px', background: '#eff9f5', textAlign: 'left' }}>文件类型</th><th style={{ padding: '12px 16px', background: '#eff9f5', textAlign: 'left' }}>操作</th></tr></thead><tbody>{files.map((file) => { const extension = file.split('.').pop()?.toUpperCase() ?? 'FILE'; return <tr key={file}><td style={{ padding: '14px 16px', borderTop: '1px solid #e7efec' }}>{file}</td><td style={{ padding: '14px 16px', borderTop: '1px solid #e7efec' }}>{extension}</td><td style={{ padding: '14px 16px', borderTop: '1px solid #e7efec' }}><a className={inventoryStyles.btn} href={`data:text/plain;charset=utf-8,${encodeURIComponent(`${activity.name} - ${file}`)}`} download={file} style={{ display: 'inline-flex', alignItems: 'center', height: 34, textDecoration: 'none' }}>下载材料</a></td></tr>; })}</tbody></table></div></div><footer><button type="button" className={inventoryStyles.btn} onClick={onClose}>关闭</button></footer></section></div>;
}

function InventoryReferencePage() {
  const [group, setGroup] = useState<ActivityGroupKey>('materials');
  const [keyword, setKeyword] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [activities, setActivities] = useState(initialActivityData);
  const groupCategory: Record<ActivityGroupKey, ActivityDataCategory> = { materials: '原辅材料', inboundTransport: '运输', energy: '能源与动力', process: '直接排放', waste: '废弃物及其他', distribution: '运输' };
  const rows = activities.filter((item) => item.category === groupCategory[group] && (!keyword || `${item.name}${item.source}${item.factor}`.includes(keyword)));
  const total = rows.reduce((sum, row) => sum + (row.factor ? Number(row.amount) * Number.parseFloat(row.factorValue) : 0), 0); const allTotal = activities.reduce((sum, row) => sum + (row.factor ? Number(row.amount) * Number.parseFloat(row.factorValue) : 0), 0);
  const addType: ActivityType = group === 'materials' ? '原辅材料' : group === 'energy' ? '能源' : group === 'process' ? '工艺排放' : group === 'waste' ? '废弃物' : '运输';
  return <div className={inventoryStyles.page}><div className={inventoryStyles.head}><div><div className={inventoryStyles.crumb}>产品碳足迹 / 核算清单</div><h1>碳足迹核算清单</h1><div className={inventoryStyles.subtitle}>按生命周期阶段维护核算项、活动数据、排放因子和证明材料。</div></div><div className={inventoryStyles.actions}><button className={inventoryStyles.btn} onClick={() => setDrawerOpen(true)}>＋ 新增{group === 'materials' ? '原辅材料' : activityGroups.find((item) => item.key === group)?.label}</button><button className={`${inventoryStyles.btn} ${inventoryStyles.primary}`} disabled={activities.some((item) => !item.factor)} onClick={() => setConfirmed(true)}>{confirmed ? '已确认核算清单' : '确认核算清单'}</button></div></div><div className={inventoryStyles.summary}><div className={inventoryStyles.project}><strong>工业变频器 VFD-75</strong><span className={inventoryStyles.meta}>功能单位：1 台产品</span><span className={inventoryStyles.meta}>核算边界：摇篮到大门</span></div><div className={inventoryStyles.overview}><span>共 {activities.length} 项核算数据</span><span>已匹配 {activities.filter((item) => item.factor).length} 项</span><span>待完善 {activities.filter((item) => !item.factor).length} 项</span><span>{allTotal.toFixed(2)} kgCO₂e 累计排放</span></div></div><div className={inventoryStyles.workspace}><aside className={inventoryStyles.side}><div className={inventoryStyles.sideTitle}>生命周期</div>{[['原材料获取', ['materials', 'inboundTransport']], ['产品制造', ['energy', 'process', 'waste']], ['产品配送', ['distribution']]].map(([stage, keys]) => <div className={inventoryStyles.group} key={stage as string}><div className={inventoryStyles.groupTitle}>{stage as string}</div>{(keys as ActivityGroupKey[]).map((key) => <button key={key} className={`${inventoryStyles.nav} ${group === key ? inventoryStyles.navActive : ''}`} onClick={() => { setGroup(key); setKeyword(''); }}><span>{activityGroups.find((item) => item.key === key)?.label}</span><span className={inventoryStyles.badge}>{activities.filter((row) => row.category === groupCategory[key]).length}</span></button>)}</div>)}</aside><main className={inventoryStyles.main}><div className={inventoryStyles.stageHead}><div><div className={inventoryStyles.stageName}>{activityGroups.find((item) => item.key === group)?.label}</div><div className={inventoryStyles.stageMeta}>{rows.length} 项核算数据 ｜ 阶段小计 {total.toFixed(2)} kgCO₂e</div></div><div className={inventoryStyles.stageActions}><input className={inventoryStyles.search} value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索核算项、因子或来源" /></div></div>{activities.some((item) => !item.factor) && <div className={inventoryStyles.alert}>当前有 {activities.filter((item) => !item.factor).length} 项数据尚未匹配排放因子，完成后才能确认核算清单。<a>查看待完善项</a></div>}<div className={inventoryStyles.tableWrap}><table className={inventoryStyles.table}><thead><tr>{['核算项', '活动数据', '排放因子', '排放量', '贡献率', '数据依据', '操作'].map((head) => <th key={head}>{head}</th>)}</tr></thead><tbody>{rows.map((row) => { const emission = row.factor ? Number(row.amount) * Number.parseFloat(row.factorValue) : 0; return <tr key={row.id}><td><span className={inventoryStyles.name}>{row.name}</span></td><td><b>{row.amount} {row.unit}</b><span className={inventoryStyles.minor}>来源：{row.source}</span></td><td>{row.factor ? <button className={inventoryStyles.factorButton} onClick={() => setDrawerOpen(true)}><b>{row.factor}</b><span className={inventoryStyles.minor}>{row.factorValue}<br />公共因子库</span></button> : <button className={inventoryStyles.pending} onClick={() => setDrawerOpen(true)}>＋ 选择排放因子</button>}</td><td>{row.factor ? <b className={inventoryStyles.emission}>{emission.toFixed(2)} kgCO₂e</b> : '—'}</td><td>{row.factor ? <div className={inventoryStyles.contrib}><span className={inventoryStyles.bar}><i style={{ width: `${allTotal ? Math.min(emission / allTotal * 100, 100) : 0}%` }} /></span><span>{allTotal ? (emission / allTotal * 100).toFixed(1) : '0.0'}%</span></div> : '—'}</td><td><span className={inventoryStyles.evidence}>{row.evidence} 个附件</span></td><td><button className={inventoryStyles.text} onClick={() => setDrawerOpen(true)}>编辑</button></td></tr>; })}</tbody></table></div><div className={inventoryStyles.foot}>当前阶段小计 <strong>{total.toFixed(2)} kgCO₂e</strong></div></main></div>{drawerOpen && <ReferenceActivityDrawer type={addType} onClose={() => setDrawerOpen(false)} onSubmit={(row) => { setActivities((items) => [...items, row]); setDrawerOpen(false); }} />}</div>;
}

function ReferenceActivityDrawer({ type, group, row, mode = 'add', onClose, onSubmit }: { type: ActivityType; group?: ActivityGroupKey; row?: ActivityDataRow; mode?: 'add' | 'data'; onClose: () => void; onSubmit: (row: ActivityDataRow) => void }) {
  const transportLabel = group === 'inboundTransport' ? '入厂运输' : group === 'distribution' ? '产品运输' : '运输';
  const config: Record<ActivityType, { label: string; stage: string; name: string; unit: string }> = {
    原辅材料: { label: '原辅材料', stage: '原材料获取', name: '', unit: 'kg' }, 能源: { label: '能源', stage: '产品制造', name: '', unit: 'kWh' }, 运输: { label: transportLabel, stage: group === 'inboundTransport' ? '原材料获取' : '产品配送', name: '', unit: 't' }, 工艺排放: { label: '工艺排放', stage: '产品制造', name: '', unit: 'kg' }, 废弃物: { label: '废弃物', stage: '产品制造', name: '', unit: 'kg' },
  };
  const current = { ...config[type], label: type === '工艺排放' ? '工艺过程排放' : config[type].label };
  const category: ActivityDataCategory = row?.category ?? (type === '能源' ? '能源与动力' : type === '工艺排放' ? '直接排放' : type === '废弃物' ? '废弃物及其他' : type === '运输' ? '运输' : '原辅材料');
  const unitOptions = ['kg', 'g', 't', 'L', 'm³', 'Nm³', 'kWh', 'MWh', 'MJ', 'GJ', 't·km', 'kg·km', '件', '台', '套', 'm', 'm²', '自定义'];
  const transportModes = ['公路货运（柴油货车）', '公路货运（汽油货车）', '公路货运（LNG 货车）', '公路货运（纯电动货车）', '铁路货运', '内河货运', '沿海及远洋海运', '航空货运', '多式联运（请按各运输段分别录入）'];
  const processTypes = ['碳酸盐分解', '金属冶炼与精炼', '化学反应过程', '焚烧 / 热处理', '制冷剂 / 温室气体逸散', '其他生产过程'];
  const processMethods = ['排放因子法', '物料平衡法', '直接测量法'];
  const processBases = ['按原料消耗量', '按产品产量', '按过程排放量'];
  const sourceOptions = ['采购台账', '供应商报告', '企业计量', '运输单据', '处置台账', '检测报告', '手工录入', '自定义'];
  const previousTransport = row?.extra?.split(' · ') ?? [];
  const previousMass = previousTransport[2]?.match(/^(.+) (kg|t)$/);
  const initialAmount = type === '运输' ? previousMass?.[1] ?? row?.amount ?? '' : row?.amount ?? '';
  const initialUnit = type === '运输' ? previousMass?.[2] ?? current.unit : row?.unit ?? current.unit;
  const [name, setName] = useState(row?.name ?? current.name); const [amount, setAmount] = useState(initialAmount); const [unit, setUnit] = useState(initialUnit); const [customUnit, setCustomUnit] = useState(''); const [source, setSource] = useState(row?.source ?? (type === '工艺排放' ? '生产台账' : '采购台账')); const [customSource, setCustomSource] = useState(''); const [factor, setFactor] = useState(row?.factor ?? ''); const [factorValue, setFactorValue] = useState(row?.factorValue ?? ''); const [evidence, setEvidence] = useState(row?.evidence ?? 0); const [remark, setRemark] = useState(row?.remark ?? ''); const [factorPickerOpen, setFactorPickerOpen] = useState(false);
  const [transportMode, setTransportMode] = useState(previousTransport[0] ?? transportModes[0]);
  const [transportDistance, setTransportDistance] = useState(previousTransport[1]?.replace(' km', '') ?? '');
  const requiredMark = <span style={{ color: '#d64545' }} aria-hidden="true">*</span>;
  const finalUnit = unit === '自定义' ? customUnit.trim() : unit; const finalSource = source === '自定义' ? customSource.trim() : source;
  const massInTons = Number(amount || 0) * (finalUnit === 'kg' ? 0.001 : 1);
  const transportTurnover = massInTons * Number(transportDistance || 0);
  const calculatedAmount = type === '运输' ? transportTurnover.toFixed(4) : amount;
  const calculatedUnit = type === '运输' ? 't·km' : finalUnit || '未填写单位';
  const processActivityOptions = [...new Set([...(row?.name ? [row.name] : []), ...processTypes])];
  const [processActivity, setProcessActivity] = useState(row?.extra?.split(' · ')[0] ?? ''); const [processMethod, setProcessMethod] = useState(processMethods[0]); const [processBasis, setProcessBasis] = useState(processBases[0]); const [advancedOpen, setAdvancedOpen] = useState(false); const [emissionSpecies, setEmissionSpecies] = useState('CO₂'); const [emissionMode, setEmissionMode] = useState<'activity' | 'direct'>('activity'); const [directAmount, setDirectAmount] = useState('');
  const productionConfig: Record<string, { method: string; label: string; hint: string; unit: string; factor: string; meta: string }> = { 碳酸盐分解: { method: '活动数据 × 排放因子', label: '碳酸盐原料消耗量', hint: '例如石灰石、白云石等含碳酸盐原料消耗量。', unit: 't', factor: '请选择碳酸盐分解排放因子', meta: '根据原料类型、成分及因子来源进一步筛选。' }, 金属冶炼与精炼: { method: '物料平衡 / 参数计算', label: '冶炼相关活动数据', hint: '由工艺规则加载所需输入参数。', unit: 't', factor: '', meta: '' }, 化学反应过程: { method: '物料平衡 / 参数计算', label: '反应活动数据', hint: '由具体化学反应规则加载所需输入参数。', unit: 't', factor: '', meta: '' }, '焚烧 / 热处理': { method: '活动数据 × 排放因子', label: '处理 / 投入物料量', hint: '例如焚烧物料量、热处理物料量等。', unit: 't', factor: '请选择焚烧 / 热处理排放因子', meta: '可按物料类型、含碳量等条件进一步筛选。' }, '制冷剂 / 温室气体逸散': { method: '直接录入排放量', label: '逸散 / 补充量', hint: '例如制冷剂补充量、泄漏量等。', unit: 'kg', factor: '', meta: '' }, '其他生产过程': { method: '活动数据 × 排放因子', label: '活动数据', hint: '由具体生产过程规则加载所需输入参数。', unit: 't', factor: '请选择排放因子', meta: '根据活动类型和因子来源进一步筛选。' } };
  const currentProductionConfig = productionConfig[processActivity];
  const submit = (event: FormEvent) => { event.preventDefault(); const isProductionEmission = type === '工艺排放'; onSubmit({ id: row?.id ?? Date.now(), category, name: isProductionEmission ? processActivity || '其他生产过程' : name || `新增${current.label}`, amount: isProductionEmission ? amount : calculatedAmount, unit: isProductionEmission ? unit : calculatedUnit, stage: row?.stage ?? current.stage, process: row?.process ?? '—', factor: isProductionEmission ? (mode === 'data' ? row?.factor ?? '' : factor) : mode === 'data' ? row?.factor ?? '' : factor, factorValue: isProductionEmission ? (mode === 'data' ? row?.factorValue ?? '' : factorValue) : mode === 'data' ? row?.factorValue ?? '' : factorValue, source: finalSource || '手工录入', evidence, remark, extra: type === '运输' ? `${transportMode} · ${transportDistance || '0'} km · ${amount || '0'} ${finalUnit}` : isProductionEmission ? `${processActivity} · ${currentProductionConfig?.method ?? '活动数据 × 排放因子'} · ${emissionSpecies}` : row?.extra }); };
  const pickerActivity: ActivityDataRow = { id: row?.id ?? 0, category, name: name || `新增${current.label}`, amount: calculatedAmount, unit: calculatedUnit, stage: row?.stage ?? current.stage, process: row?.process ?? '—', factor, factorValue, source: finalSource, evidence, remark };
  if (type === '工艺排放') return <div className={styles.overlay} onMouseDown={onClose}>
    <form className={styles.modal} style={{ width: 'min(760px, 92vw)', maxHeight: 'calc(100vh - 48px)' }} onMouseDown={(event) => event.stopPropagation()} onSubmit={submit}>
      <header><div><div className={inventoryStyles.drawerTitle}>{mode === 'data' ? '补充生产过程排放' : '新增生产过程排放'}</div><small>每个排放活动对应固定的排放量获取方式；录入数据均对应 1 个功能单位产品。</small></div><button className={inventoryStyles.close} type="button" onClick={onClose}>×</button></header>
      <div style={{ maxHeight: 'calc(100vh - 190px)', overflowY: 'auto', padding: '20px 24px' }}>
        <div className={inventoryStyles.section}>基础信息</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 22px' }}>
          <div className={inventoryStyles.form}><label className={inventoryStyles.label}>排放活动 {requiredMark}</label><select className={inventoryStyles.select} required value={processActivity} onChange={(event) => { setProcessActivity(event.target.value); const next = productionConfig[event.target.value]; if (next) { setUnit(next.unit); setFactor(''); setFactorValue(''); } }}><option value="">请选择排放活动</option>{processTypes.map((option) => <option key={option}>{option}</option>)}</select><span className={inventoryStyles.minor}>优先选择系统预设活动；无法匹配时选择“其他生产过程”。</span></div>
          <div className={inventoryStyles.form}><label className={inventoryStyles.label}>温室气体 {requiredMark}</label><select className={inventoryStyles.select} value={emissionSpecies} onChange={(event) => setEmissionSpecies(event.target.value)}><option>CO₂</option><option>CH₄</option><option>N₂O</option><option>HFCs</option><option>PFCs</option><option>SF₆</option><option>NF₃</option><option>其他温室气体</option></select></div>
        </div>
        <div className={inventoryStyles.section}>排放量获取方式</div>
        <div className={inventoryStyles.calc} style={{ marginBottom: 18 }}><span>排放量获取方式</span><b style={{ marginLeft: 12 }}> {currentProductionConfig?.method ?? '请选择排放活动'}</b><span className={inventoryStyles.minor} style={{ display: 'inline', marginLeft: 12 }}>系统根据排放活动自动确定</span></div>
        {currentProductionConfig ? <><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 22px' }}><div className={inventoryStyles.form}><label className={inventoryStyles.label}>{currentProductionConfig.label}（每 1 个功能单位） {requiredMark}</label><div className={inventoryStyles.grid2}><input className={inventoryStyles.field} required type="number" min="0" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="请输入对应 1 个功能单位的数值" /><select className={inventoryStyles.select} value={unit} onChange={(event) => setUnit(event.target.value)}>{['t', 'kg', 'Nm³', 'GJ', '功能单位'].map((option) => <option key={option}>{option}</option>)}</select></div><span className={inventoryStyles.minor}>{currentProductionConfig.hint}</span></div><div className={inventoryStyles.form}><label className={inventoryStyles.label}>数据来源</label><select className={inventoryStyles.select} value={source} onChange={(event) => setSource(event.target.value)}>{['生产台账', '采购台账', '计量记录', '检测 / 监测报告', '其他'].map((option) => <option key={option}>{option}</option>)}</select></div></div><div className={inventoryStyles.form}><label className={inventoryStyles.label}>排放因子 {requiredMark}</label><div className={inventoryStyles.factorCard}><div><b>{factor || currentProductionConfig.factor || '请选择排放因子'}</b><span className={inventoryStyles.minor}>{factor ? `因子值：${factorValue}` : currentProductionConfig.meta}</span></div><button type="button" className={inventoryStyles.btn} onClick={() => setFactorPickerOpen(true)}>选择排放因子</button></div></div><details style={{ gridColumn: '1 / -1', marginBottom: 16 }}><summary>高级设置</summary><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 22px', marginTop: 14 }}><div className={inventoryStyles.form}><label className={inventoryStyles.label}>核算说明</label><input className={inventoryStyles.field} value={remark} onChange={(event) => setRemark(event.target.value)} placeholder="特殊边界、口径或计算说明" /></div><div className={inventoryStyles.form}><label className={inventoryStyles.label}>GWP版本</label><select className={inventoryStyles.select}><option>沿用项目级配置</option><option>IPCC AR6</option><option>IPCC AR5</option></select></div></div></details></> : <div className={inventoryStyles.calc}>选择排放活动后，系统自动加载对应的数据录入项。</div>}
        <div className={inventoryStyles.section}>数据依据</div>
        <div className={inventoryStyles.form}><label className={inventoryStyles.label}>证明材料（可选）</label><label className={styles.uploadField}><span className={styles.uploadTitle}>☁</span><strong>上传与本条数据对应的证明材料</strong><input type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" onChange={(event) => setEvidence(event.target.files?.length ?? 0)} /><span className={styles.uploadHint}>{evidence ? `已上传 ${evidence} 个附件` : '支持 PDF、XLSX、DOCX、JPG、PNG，可多选'}</span></label></div>
        <div className={inventoryStyles.form}><label className={inventoryStyles.label}>备注（可选）</label><textarea className={inventoryStyles.field} rows={3} value={remark} onChange={(event) => setRemark(event.target.value)} placeholder="补充特殊数据口径、来源或说明" /></div>
      </div>
      <footer><button className={inventoryStyles.btn} type="button" onClick={onClose}>取消</button><button className={`${inventoryStyles.btn} ${inventoryStyles.primary}`}>保存</button></footer>
    </form>
    {factorPickerOpen && <FactorPicker activity={{ ...pickerActivity, name, amount, unit, factor, factorValue, source }} onClose={() => setFactorPickerOpen(false)} onSelect={(selected) => { setFactor(selected.name); setFactorValue(selected.value); setFactorPickerOpen(false); }} />}
  </div>;
  const nonProcessType = type as Exclude<ActivityType, '工艺排放'>;
  return <div className={styles.overlay} onMouseDown={onClose}>
    <form className={styles.modal} style={{ width: 'min(760px, 92vw)', maxHeight: 'calc(100vh - 48px)' }} onMouseDown={(event) => event.stopPropagation()} onSubmit={submit}>
      <header><div><div className={inventoryStyles.drawerTitle}>{mode === 'data' ? '补充活动数据' : `新增${current.label}`}</div><small>系统根据当前生命周期阶段自动归类；活动数据均对应 1 个功能单位产品。</small></div><button className={inventoryStyles.close} type="button" onClick={onClose}>×</button></header>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0 22px', maxHeight: 'calc(100vh - 190px)', overflowY: 'auto' }}>
        <div style={{ gridColumn: '1 / -1' }} className={inventoryStyles.section}>活动数据（每 1 个功能单位产品）</div>
        <div className={inventoryStyles.form}><label className={inventoryStyles.label}>{nonProcessType === '原辅材料' ? '材料/产品名称' : '排放活动名称'} {requiredMark}</label><input className={inventoryStyles.field} required value={name} onChange={(event) => setName(event.target.value)} placeholder={nonProcessType === '原辅材料' ? '例如：热轧钢卷' : '请输入活动名称'} /></div>
        <div className={inventoryStyles.form}><label className={inventoryStyles.label}>{nonProcessType === '运输' ? '运输重量（每 1 个功能单位）' : '用量（每 1 个功能单位）'} {requiredMark}</label><div className={inventoryStyles.grid2}><input className={inventoryStyles.field} required type="number" min="0" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="请输入对应 1 个功能单位的数值" /><select className={inventoryStyles.select} value={unit} onChange={(event) => setUnit(event.target.value)}>{(nonProcessType === '运输' ? ['t', 'kg'] : unitOptions).map((option) => <option key={option}>{option}</option>)}</select></div>{unit === '自定义' && <input className={inventoryStyles.field} required value={customUnit} onChange={(event) => setCustomUnit(event.target.value)} placeholder="请输入自定义单位，例如：箱、批" style={{ marginTop: 10 }} />}</div>
        {nonProcessType === '原辅材料' && <div className={inventoryStyles.form}><label className={inventoryStyles.label}>供应商（选填）</label><input className={inventoryStyles.field} placeholder="用于记录供应商特定数据来源" /></div>}
        {nonProcessType === '运输' && <div className={inventoryStyles.form} style={{ gridColumn: '1 / -1' }}><label className={inventoryStyles.label}>运输参数（每 1 个功能单位） {requiredMark}</label><div className={inventoryStyles.gridTransport}><select className={inventoryStyles.select} value={transportMode} onChange={(event) => { setTransportMode(event.target.value); setFactor(''); setFactorValue(''); }}>{transportModes.map((option) => <option key={option}>{option}</option>)}</select><input className={inventoryStyles.field} required type="number" min="0" step="0.01" value={transportDistance} onChange={(event) => setTransportDistance(event.target.value)} placeholder="每 1 个功能单位的运输距离（km）" /></div><div className={inventoryStyles.calc}>每 1 个功能单位的运输周转量：<b>{amount && transportDistance ? `${transportTurnover.toFixed(4)} t·km` : '待根据运输重量和距离计算'}</b><span className={inventoryStyles.minor}>按每 1 个功能单位的运输重量折算为吨后 × 运输距离（km）自动计算，并作为排放因子匹配与核算依据。</span></div></div>}
        {type === '能源' && <div className={inventoryStyles.form}><label className={inventoryStyles.label}>能源品种</label><input className={inventoryStyles.field} placeholder="例如：电力、天然气" /></div>}
        <div className={inventoryStyles.form} style={nonProcessType === '运输' ? { gridColumn: '1 / -1' } : undefined}><label className={inventoryStyles.label}>数据来源</label><select className={inventoryStyles.select} value={source} onChange={(event) => setSource(event.target.value)}>{sourceOptions.map((option) => <option key={option}>{option}</option>)}</select>{source === '自定义' && <input className={inventoryStyles.field} required value={customSource} onChange={(event) => setCustomSource(event.target.value)} placeholder="请输入自定义数据来源" style={{ marginTop: 10 }} />}</div>
        <div style={{ gridColumn: '1 / -1' }} className={inventoryStyles.form}><label className={inventoryStyles.label}>证明材料</label><label className={styles.uploadField}><span className={styles.uploadTitle}>☁</span><strong>点击上传附件</strong><input type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" onChange={(event) => setEvidence(event.target.files?.length ?? 0)} /><span className={styles.uploadHint}>{evidence ? `已上传 ${evidence} 个附件` : '支持 PDF、XLSX、DOCX、JPG、PNG，可多选'}</span></label></div>
        <div style={{ gridColumn: '1 / -1' }} className={inventoryStyles.section}>排放因子</div>
        <div style={{ gridColumn: '1 / -1' }} className={inventoryStyles.factorCard}><div><b>{factor || '暂未选择排放因子'}</b><span className={inventoryStyles.minor}>{factor ? `${factorValue} · 公共因子库` : '请选择与当前活动数据匹配的因子'}</span></div><button type="button" className={inventoryStyles.btn} onClick={() => setFactorPickerOpen(true)}>选择排放因子</button></div>
        <div style={{ gridColumn: '1 / -1' }} className={inventoryStyles.form}><label className={inventoryStyles.label}>备注</label><textarea className={inventoryStyles.field} rows={3} value={remark} onChange={(event) => setRemark(event.target.value)} placeholder="补充数据口径或说明" /></div>
      </div>
      <footer><button className={inventoryStyles.btn} type="button" onClick={onClose}>取消</button><button className={`${inventoryStyles.btn} ${inventoryStyles.primary}`}>保存</button></footer>
    </form>
    {factorPickerOpen && <FactorPicker activity={pickerActivity} onClose={() => setFactorPickerOpen(false)} onSelect={(selected) => { setFactor(selected.name); setFactorValue(selected.value); setFactorPickerOpen(false); }} />}
  </div>;
}

function ActivityPreparationPage({ projectId }: { projectId?: string } = {}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedProject = initialProjects.find((item) => String(item.id) === (projectId ?? searchParams.get('projectId')));
  const [product, setProduct] = useState(requestedProject?.name ?? initialProjects[0].name);
  const [category, setCategory] = useState<ActivityDataCategory>('原辅材料');
  const [group, setGroup] = useState<ActivityGroupKey>('materials');
  const [keyword, setKeyword] = useState('');
  const [activities, setActivities] = useState(initialActivityData);
  const [activityModal, setActivityModal] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [evidenceTarget, setEvidenceTarget] = useState<ActivityDataRow | null>(null);
  const [factorTarget, setFactorTarget] = useState<ActivityDataRow | null>(null);
  const selectedProject = initialProjects.find((item) => item.name === product) ?? initialProjects[0];
  const groupCategory: Record<ActivityGroupKey, ActivityDataCategory> = { materials: '原辅材料', inboundTransport: '运输', energy: '能源与动力', process: '直接排放', waste: '废弃物及其他', distribution: '运输' };
  const rows = activities.filter((item) => item.category === groupCategory[group] && (!keyword || `${item.name}${item.stage}${item.process}${item.factor}${item.source}`.includes(keyword)));
  return <div className={styles.page}>
    {projectId && <button className={styles.back} onClick={() => navigate('/product-carbon-footprint/projects')}>‹ 返回项目管理</button>}
    <section className={styles.activityContext}><div><span>产品碳足迹 · 核算清单</span><h1>碳足迹核算清单</h1><p>按生命周期过程维护活动数据、排放因子和单位产品排放结果。</p></div><div className={styles.activityActions}><button className={styles.button} onClick={() => setActivityModal(true)}>＋ 新增活动数据</button><button className={styles.primary} onClick={() => setConfirmed(true)}>{confirmed ? '已确认正式清单' : '确认正式清单'}</button></div></section>
    <section className={styles.card}><div className={styles.activityProjectMeta}><label>当前项目<select value={product} onChange={(event) => setProduct(event.target.value)}>{initialProjects.map((item) => <option key={item.id}>{item.name}</option>)}</select></label><span>核算产品 <b>{selectedProject.name}</b></span><span>功能单位 <b>{selectedProject.unit}</b></span><span>核算边界 <b>{selectedProject.boundary}</b></span></div></section>
    <section className={`${styles.card} ${styles.inventoryLayout} ${styles.mergedInventory}`}><aside className={styles.inventoryTree}><h3>生命周期树</h3>{activityGroups.map((item, index) => <div key={item.key}><b>{index === 0 || activityGroups[index - 1].stage !== item.stage ? item.stage : ''}</b><button className={group === item.key ? styles.inventoryTreeActive : ''} onClick={() => { setGroup(item.key); setKeyword(''); }}><span>{item.label}</span><small>{activities.filter((row) => row.category === groupCategory[item.key]).length}</small></button></div>)}</aside><div className={styles.inventoryMain}><div className={styles.activityListHeader}><div><b>{activityGroups.find((item) => item.key === group)?.label} · 核算清单</b><span>共 {rows.length} 条活动数据，因子由用户主动选择</span></div><div><input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索清单项、因子或来源" /></div></div><div className={styles.tableWrap}><table className={styles.inventoryTable}><thead><tr>{['排放活动', '活动数据', '生命周期阶段', '排放因子', '证明材料', '排放量', '操作'].map((head) => <th key={head}>{head}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td><b>{row.name}</b>{row.extra && <small>{row.extra}</small>}</td><td><strong>{row.amount} {row.unit}</strong><small>来源：{row.source}</small></td><td>{row.stage}</td><td>{row.factor ? <button className={styles.factorInfo} onClick={() => setFactorTarget(row)}><b>{row.factor}</b><small>{row.factorValue}</small></button> : <button className={styles.factorSelect} onClick={() => setFactorTarget(row)}>选择因子</button>}</td><td><button className={styles.attachmentLink} onClick={() => setEvidenceTarget(row)}>{row.evidence} 个附件</button></td><td>{row.factor ? <strong className={styles.footprint}>{(Number(row.amount) * Number.parseFloat(row.factorValue)).toFixed(2)} kgCO₂e</strong> : '—'}</td><td><button className={styles.text}>编辑</button></td></tr>)}</tbody></table></div><div className={styles.inventorySubtotal}>当前生命周期清单小计 <strong>{rows.reduce((total, row) => total + (row.factor ? Number(row.amount) * Number.parseFloat(row.factorValue) : 0), 0).toFixed(2)} kgCO₂e</strong></div></div></section>
    {activityModal && <LinkedActivityModal type={group === 'materials' ? '原辅材料' : group === 'energy' ? '能源' : group === 'distribution' || group === 'inboundTransport' ? '运输' : group === 'process' ? '工艺排放' : '废弃物'} onClose={() => setActivityModal(false)} onSubmit={(activity) => { setActivities((items) => [...items, activity]); setActivityModal(false); }} />}
    {evidenceTarget && <EvidenceViewer activity={evidenceTarget} onClose={() => setEvidenceTarget(null)} />}
    {factorTarget && <FactorPicker activity={factorTarget} onClose={() => setFactorTarget(null)} onSelect={(factor) => { setActivities((items) => items.map((item) => item.id === factorTarget.id ? { ...item, factor: factor.name, factorValue: factor.value } : item)); setFactorTarget(null); }} />}
  </div>;
}

function ProcessViewer({ project, onClose }: { project: Project; onClose: () => void }) {
  return <div className={styles.drawerMask} onMouseDown={onClose}><aside className={styles.processDrawer} onMouseDown={(event) => event.stopPropagation()}><header><div><b>工艺流程图</b><span>{project.name} · 项目创建阶段上传</span></div><button className={styles.button} onClick={onClose}>× 关闭</button></header><div className={styles.processPreview}><div className={styles.processPlaceholder}><span>⌁</span><b>{project.processFile || '项目工艺流程图'}</b><p>此处仅用于录入活动数据时参考，不支持在当前页面编辑。</p></div></div></aside></div>;
}

function EvidenceViewer({ activity, onClose }: { activity: ActivityDataRow; onClose: () => void }) {
  return <div className={styles.drawerMask} onMouseDown={onClose}><aside className={styles.processDrawer} onMouseDown={(event) => event.stopPropagation()}><header><div><b>证明材料</b><span>{activity.name} · 活动数据附件</span></div><button className={styles.button} onClick={onClose}>× 关闭</button></header><div className={styles.evidenceList}>{activity.evidence ? ['发票.pdf', '抄表记录.xlsx'].slice(0, activity.evidence).map((file) => <div key={file}><span>FILE</span><b>{file}</b><small>数据来源：{activity.source}</small></div>) : <p>暂无证明材料，可在编辑数据时补充。</p>}</div></aside></div>;
}

function FactorPicker({ activity, onClose, onSelect }: { activity: ActivityDataRow; onClose: () => void; onSelect: (factor: { name: string; value: string }) => void }) {
  const options = activity.category === '能源与动力'
    ? [{ name: '中国区域电网平均电力', value: '0.5306 kgCO₂e/kWh', source: '国家因子库' }, { name: '天然气燃烧因子', value: '2.162 kgCO₂e/Nm³', source: '国家因子库' }]
    : activity.category === '直接排放'
      ? [{ name: '碳酸盐原料分解排放因子', value: '0.525 tCO₂e/t', source: '企业核算因子库' }, { name: '碳酸盐分解通用因子', value: '0.440 tCO₂e/t', source: '公共因子库' }]
    : activity.category === '运输'
      ? [{ name: '重型柴油货车运输', value: '0.0978 kgCO₂e/(t·km)', source: 'CPCD' }, { name: '铁路货运', value: '0.0286 kgCO₂e/(t·km)', source: 'CPCD' }]
      : [{ name: '热轧钢材生产', value: '1.820 kgCO₂e/kg', source: '公共因子库' }, { name: '通用原材料因子', value: '2.150 kgCO₂e/kg', source: '公共因子库' }, { name: '供应商特定因子', value: '1.820 kgCO₂e/kg', source: '供应商报告' }];
  const [keyword, setKeyword] = useState('');
  const [selectedName, setSelectedName] = useState(activity.factor);
  const [customOpen, setCustomOpen] = useState(false);
  const filtered = options.filter((option) => `${option.name}${option.value}${option.source}`.includes(keyword.trim()));
  const selected = options.find((option) => option.name === selectedName);
  return <div className={styles.overlay} onMouseDown={onClose}>
    <section className={styles.modal} role="dialog" aria-modal="true" aria-label="选择排放因子" style={{ width: 'min(880px, 94vw)' }} onMouseDown={(event) => event.stopPropagation()}>
      <header><div><b>快速选择碳排放因子</b><span className={styles.modalSubTitle}>{activity.name || '当前活动数据'} · {activity.category}</span></div><button type="button" onClick={onClose}>×</button></header>
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 16, border: '1px solid #dce8e3', borderRadius: 8, overflow: 'hidden' }}><div style={{ padding: 12 }}><small>活动数据</small><b style={{ display: 'block', marginTop: 4 }}>{activity.amount ? `${activity.amount} ${activity.unit}` : '待补充'}</b></div><div style={{ padding: 12, borderLeft: '1px solid #dce8e3' }}><small>适用类别</small><b style={{ display: 'block', marginTop: 4 }}>{activity.category}</b></div><div style={{ padding: 12, borderLeft: '1px solid #dce8e3' }}><small>当前因子</small><b style={{ display: 'block', marginTop: 4 }}>{activity.factor || '未选择'}</b></div></div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}><select className={inventoryStyles.select} style={{ width: 160 }} aria-label="因子类型"><option>全部类型</option><option>公共因子库</option><option>供应商报告</option></select><input className={inventoryStyles.field} value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索因子名称、来源或版本" /></div>
        <div style={{ color: '#71808f', fontSize: 13, marginBottom: 8 }}>适用因子 {filtered.length} 个</div>
        <div style={{ display: 'grid', gap: 8, maxHeight: 330, overflowY: 'auto' }}>{filtered.map((option) => <label key={option.name} style={{ display: 'grid', gridTemplateColumns: '28px minmax(0, 1fr) 210px 120px', alignItems: 'center', gap: 12, minHeight: 52, padding: '0 16px', border: `1px solid ${selectedName === option.name ? '#0aa36f' : '#dce8e3'}`, borderRadius: 8, cursor: 'pointer', background: selectedName === option.name ? '#f0faf6' : '#fff' }}><input type="radio" name="inventory-factor" checked={selectedName === option.name} onChange={() => setSelectedName(option.name)} /><b style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{option.name}</b><span style={{ color: '#526860', whiteSpace: 'nowrap' }}>{option.value}</span><small style={{ color: '#71808f', whiteSpace: 'nowrap' }}>{option.source}</small></label>)}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginTop: 16, padding: '14px 16px', border: '1px solid #dce8e3', borderRadius: 8, background: '#f6fbf9' }}><div><b>未找到适用因子？</b><small style={{ display: 'block', marginTop: 4, color: '#71808f' }}>可录入当前企业实测或供应商因子，并填写可核验依据。</small></div><button type="button" className={inventoryStyles.btn} onClick={() => setCustomOpen(true)}>新增自定义因子</button></div>
      </div>
      <footer><button type="button" className={inventoryStyles.btn} onClick={onClose}>取消</button><button type="button" className={`${inventoryStyles.btn} ${inventoryStyles.primary}`} disabled={!selected} onClick={() => selected && onSelect(selected)}>确认选择</button></footer>
    </section>
    {customOpen && <CustomFactorModal activity={activity} onClose={() => setCustomOpen(false)} onSave={(factor) => onSelect(factor)} />}
  </div>;
}

function CustomFactorModal({ activity, onClose, onSave }: { activity: ActivityDataRow; onClose: () => void; onSave: (factor: { name: string; value: string }) => void }) {
  const [name, setName] = useState(''); const [value, setValue] = useState(''); const [unit, setUnit] = useState('kgCO₂e/kg'); const [basis, setBasis] = useState('');
  const mark = <span style={{ color: '#d64545' }} aria-hidden="true">*</span>;
  const submit = (event: FormEvent) => { event.preventDefault(); onSave({ name, value: `${value} ${unit}` }); };
  return <div className={styles.overlay} onMouseDown={onClose}>
    <form className={styles.modal} role="dialog" aria-modal="true" aria-label="新增自定义因子" style={{ width: 'min(720px, 92vw)' }} onMouseDown={(event) => event.stopPropagation()} onSubmit={submit}>
      <header><div><b>新增自定义因子</b><span className={styles.modalSubTitle}>{activity.name || '当前活动数据'} · 仅适用于当前企业</span></div><button type="button" onClick={onClose}>×</button></header>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px 20px' }}>
        <p style={{ gridColumn: '1 / -1', margin: 0, padding: '12px 14px', borderRadius: 8, background: '#f2fbf6', color: '#3d6556' }}>请填写可核验的实测或供应商因子，保存后将直接应用到当前活动数据。</p>
        <label className={inventoryStyles.form}><span className={inventoryStyles.label}>因子名称 {mark}</span><input className={inventoryStyles.field} required value={name} onChange={(event) => setName(event.target.value)} placeholder="例如：供应商热轧钢材因子" /></label>
        <label className={inventoryStyles.form}><span className={inventoryStyles.label}>因子值 {mark}</span><input className={inventoryStyles.field} required type="number" min="0" step="any" value={value} onChange={(event) => setValue(event.target.value)} placeholder="例如：1.820" /></label>
        <label className={inventoryStyles.form}><span className={inventoryStyles.label}>因子单位 {mark}</span><input className={inventoryStyles.field} required value={unit} onChange={(event) => setUnit(event.target.value)} placeholder="例如：kgCO₂e/kg" /></label>
        <label className={inventoryStyles.form}><span className={inventoryStyles.label}>有效期 {mark}</span><input className={inventoryStyles.field} required defaultValue="2026年度" /></label>
        <label style={{ gridColumn: '1 / -1' }} className={inventoryStyles.form}><span className={inventoryStyles.label}>来源及依据 {mark}</span><input className={inventoryStyles.field} required value={basis} onChange={(event) => setBasis(event.target.value)} placeholder="例如：供应商检测报告编号或第三方检测依据" /></label>
      </div>
      <footer><button type="button" className={inventoryStyles.btn} onClick={onClose}>返回因子列表</button><button className={`${inventoryStyles.btn} ${inventoryStyles.primary}`}>保存并应用自定义因子</button></footer>
    </form>
  </div>;
}

function LinkedActivityModal({ type, onClose, onSubmit }: { type: ActivityType; onClose: () => void; onSubmit: (activity: ActivityDataRow) => void }) {
  const settings: Record<ActivityType, { label: string; stage: string; name: string; unit: string; factor: string; factorValue: string }> = { '原辅材料': { label: '原辅材料', stage: '原材料获取', name: '主要原材料', unit: 'kg', factor: '通用原材料因子（示例）', factorValue: '2.15 kgCO₂e/kg' }, 能源: { label: '能源', stage: '产品生产', name: '外购电力', unit: 'kWh', factor: '全国电力因子（示例）', factorValue: '0.5306 kgCO₂e/kWh' }, 运输: { label: '运输', stage: '运输', name: '公路运输', unit: 't·km', factor: '重型柴油货车运输', factorValue: '0.0978 kgCO₂e/(t·km)' }, 工艺排放: { label: '工艺排放', stage: '产品生产', name: '工艺过程排放', unit: '功能单位', factor: '企业工艺过程因子', factorValue: '0.85 kgCO₂e/功能单位' }, 废弃物: { label: '废弃物', stage: '产品生产', name: '生产废弃物处理', unit: 'kg', factor: '一般工业固废处理', factorValue: '0.12 kgCO₂e/kg' } };
  const current = settings[type]; const [name, setName] = useState(current.name); const [amount, setAmount] = useState('1'); const [unit, setUnit] = useState(current.unit); const [process, setProcess] = useState(''); const [source, setSource] = useState(''); const [remark, setRemark] = useState(''); const [factor, setFactor] = useState(current.factor); const result = (Number(amount || 0) * Number.parseFloat(current.factorValue)).toFixed(2);
  const submit = (event: FormEvent) => { event.preventDefault(); onSubmit({ id: Date.now(), category: type === '能源' ? '能源与动力' : type === '工艺排放' ? '直接排放' : type === '废弃物' ? '废弃物及其他' : type, name, amount, unit, stage: current.stage, process: process || '—', factor, factorValue: factor ? current.factorValue : '', source: source || '页面录入', evidence: 0, remark }); };
  return <div className={styles.overlay} onMouseDown={onClose}><form className={styles.modal} onMouseDown={(event) => event.stopPropagation()} onSubmit={submit}><header><div><b>新增活动数据</b><span className={styles.modalSubTitle}>已从生命周期树进入：{current.label}</span></div><button type="button" onClick={onClose}>×</button></header><div><p className={styles.modalHint}>当前活动类型和生命周期阶段已根据左侧生命周期树确定，无需重复选择。</p><h3>录入活动数据</h3><div className={styles.formGrid}><label>排放活动名称<input required value={name} onChange={(event) => setName(event.target.value)} /></label><label>活动数据<input required type="number" min="0" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} /></label><label>单位<select value={unit} onChange={(event) => setUnit(event.target.value)}><option>{unit}</option><option>kg</option><option>t</option><option>kWh</option><option>Nm³</option><option>t·km</option></select></label><label>所属工序/环节（选填）<input value={process} onChange={(event) => setProcess(event.target.value)} placeholder="例如：表面处理" /></label>{type === '运输' && <><label>运输方式<input placeholder="例如：公路" /></label><label>运输距离<input placeholder="km" /></label><label>运输重量<input placeholder="t" /></label></>}{type === '能源' && <label>能源品种<input placeholder="例如：电力、天然气" /></label>}{type === '原辅材料' && <label>材料/产品名称<input value={name} onChange={(event) => setName(event.target.value)} /></label>}<label className={styles.fullField}>数据来源<input value={source} onChange={(event) => setSource(event.target.value)} placeholder="例如：发票、抄表记录、检测报告" /></label><label className={styles.fullField}>备注<textarea value={remark} onChange={(event) => setRemark(event.target.value)} placeholder="补充数据口径或说明" /></label></div><h3>确认排放因子</h3><label className={styles.fullField}>排放因子<select value={factor} onChange={(event) => setFactor(event.target.value)}><option>{current.factor}｜{current.factorValue}｜公共因子库</option><option value="">暂不选择</option></select></label></div><footer><button type="button" className={styles.button} onClick={onClose}>取消</button><button className={styles.button} type="button" onClick={() => { setName(current.name); setAmount('1'); }}>保存并继续新增</button><button className={styles.primary}>保存</button></footer></form></div>;
}

function ActivityDataModalWithTabs({ category, onClose, onSubmit }: { category: ActivityDataCategory; onClose: () => void; onSubmit: (row: ActivityDataRow) => void }) {
  const [activeCategory, setActiveCategory] = useState<ActivityDataCategory>(category);
  const fields: Record<ActivityDataCategory, { name: string; unit: string; stage: string }> = { '原辅材料': { name: '主要原材料', unit: 'kg', stage: '原材料获取' }, '能源与动力': { name: '外购电力', unit: 'kWh', stage: '产品生产' }, 运输: { name: '公路运输', unit: 't·km', stage: '运输' }, 直接排放: { name: '直接排放活动', unit: 'kg', stage: '产品生产' }, '废弃物及其他': { name: '一般工业固废', unit: 'kg', stage: '产品生产' } };
  const [name, setName] = useState(fields[category].name); const [amount, setAmount] = useState('1'); const [unit, setUnit] = useState(fields[category].unit); const [stage, setStage] = useState(fields[category].stage); const [process, setProcess] = useState(''); const [source, setSource] = useState(''); const [factor, setFactor] = useState(''); const [remark, setRemark] = useState('');
  const changeCategory = (next: ActivityDataCategory) => { setActiveCategory(next); setName(fields[next].name); setUnit(fields[next].unit); setStage(fields[next].stage); setFactor(''); };
  const submit = (event: FormEvent) => { event.preventDefault(); onSubmit({ id: Date.now(), category: activeCategory, name: name || '待补充数据', amount: amount || '0', unit, stage, process: process || '—', factor, factorValue: factor ? '0.5306 kgCO₂e/kWh' : '', source: source || '页面录入', evidence: 0, remark }); };
  return <div className={styles.overlay} onMouseDown={onClose}><form className={styles.modal} onMouseDown={(event) => event.stopPropagation()} onSubmit={submit}><header><div><b>新增活动数据</b><span className={styles.modalSubTitle}>当前类型：{activeCategory}</span></div><button type="button" onClick={onClose}>×</button></header><div><div className={styles.activityModalTabs}>{activityDataCategories.map((item) => <button type="button" key={item.key} className={activeCategory === item.key ? styles.activityModalTabActive : ''} onClick={() => changeCategory(item.key)}>{item.key}</button>)}</div><p className={styles.modalHint}>基础字段统一维护；所属工序/环节为选填，不影响简单项目直接录入。</p><div className={styles.formGrid}><label>数据名称<input required value={name} onChange={(event) => setName(event.target.value)} /></label><label>活动数据量<input required type="number" min="0" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} /></label><label>单位<select value={unit} onChange={(event) => setUnit(event.target.value)}><option>{unit}</option><option>kg</option><option>t</option><option>kWh</option><option>Nm³</option><option>t·km</option></select></label><label>生命周期阶段<select value={stage} onChange={(event) => setStage(event.target.value)}><option>原材料获取</option><option>产品生产</option><option>运输</option></select></label><label>所属工序/环节（选填）<input value={process} onChange={(event) => setProcess(event.target.value)} placeholder="例如：表面处理" /></label><label>数据来源<input value={source} onChange={(event) => setSource(event.target.value)} placeholder="例如：发票、抄表记录" /></label>{activeCategory === '运输' && <><label>运输方式<input placeholder="例如：公路" /></label><label>运输距离<input placeholder="km" /></label><label>运输重量<input placeholder="t" /></label></>}{activeCategory === '能源与动力' && <label>能源品种<input placeholder="例如：电力、天然气" /></label>}{activeCategory === '原辅材料' && <label>材料/产品名称<input value={name} onChange={(event) => setName(event.target.value)} /></label>}<label className={styles.fullField}>排放因子<select value={factor} onChange={(event) => setFactor(event.target.value)}><option value="">暂不选择</option><option>中国区域电网平均电力</option><option>通用原材料因子</option><option>重型柴油货车运输</option><option>一般工业固废处理</option></select></label><label className={styles.fullField}>备注<textarea value={remark} onChange={(event) => setRemark(event.target.value)} placeholder="补充数据口径或说明" /></label></div></div><footer><button type="button" className={styles.button} onClick={onClose}>取消</button><button className={styles.primary}>保存数据</button></footer></form></div>;
}

function ActivityDataModal({ category, onClose, onSubmit }: { category: ActivityDataCategory; onClose: () => void; onSubmit: (row: ActivityDataRow) => void }) {
  const defaults: Record<ActivityDataCategory, { name: string; unit: string; stage: string }> = { '原辅材料': { name: '主要原材料', unit: 'kg', stage: '原材料获取' }, '能源与动力': { name: '外购电力', unit: 'kWh', stage: '产品生产' }, 运输: { name: '公路运输', unit: 't·km', stage: '运输' }, 直接排放: { name: '直接排放活动', unit: 'kg', stage: '产品生产' }, '废弃物及其他': { name: '一般工业固废', unit: 'kg', stage: '产品生产' } };
  const preset = defaults[category]; const [name, setName] = useState(preset.name); const [amount, setAmount] = useState('1'); const [unit, setUnit] = useState(preset.unit); const [stage, setStage] = useState(preset.stage); const [process, setProcess] = useState(''); const [source, setSource] = useState(''); const [remark, setRemark] = useState(''); const [factor, setFactor] = useState('');
  const submit = (event: FormEvent) => { event.preventDefault(); onSubmit({ id: Date.now(), category, name: name || '待补充数据', amount: amount || '0', unit, stage, process: process || '—', factor, factorValue: factor ? (category === '能源与动力' ? '0.5306 kgCO₂e/kWh' : '2.150 kgCO₂e/kg') : '', source: source || '页面录入', evidence: 0, remark }); };
  return <div className={styles.overlay} onMouseDown={onClose}><form className={styles.modal} onMouseDown={(event) => event.stopPropagation()} onSubmit={submit}><header><div><b>新增活动数据</b><span className={styles.modalSubTitle}>当前类型：{category}</span></div><button type="button" onClick={onClose}>×</button></header><div><p className={styles.modalHint}>基础字段统一维护；所属工序/环节为选填，不影响简单项目直接录入。</p><div className={styles.formGrid}><label>数据名称<input required value={name} onChange={(event) => setName(event.target.value)} /></label><label>活动数据量<input required type="number" min="0" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} /></label><label>单位<select value={unit} onChange={(event) => setUnit(event.target.value)}><option>{unit}</option><option>kg</option><option>t</option><option>kWh</option><option>Nm³</option><option>t·km</option></select></label><label>生命周期阶段<select value={stage} onChange={(event) => setStage(event.target.value)}><option>原材料获取</option><option>产品生产</option><option>运输</option><option>使用</option><option>生命周期末端</option></select></label><label>所属工序/环节（选填）<input value={process} onChange={(event) => setProcess(event.target.value)} placeholder="例如：表面处理" /></label><label>数据来源<input value={source} onChange={(event) => setSource(event.target.value)} placeholder="例如：发票、抄表记录" /></label>{category === '运输' && <><label>运输方式<input placeholder="例如：公路" /></label><label>运输距离<input placeholder="km" /></label><label>运输重量<input placeholder="t" /></label></>}{category === '能源与动力' && <label>能源品种<input placeholder="例如：电力、天然气" /></label>}{category === '原辅材料' && <label>材料/产品名称<input value={name} onChange={(event) => setName(event.target.value)} /></label>}<label className={styles.fullField}>排放因子<select value={factor} onChange={(event) => setFactor(event.target.value)}><option value="">暂不选择</option><option>中国区域电网平均电力</option><option>通用原材料因子</option><option>重型柴油货车运输</option><option>一般工业固废处理</option></select></label><label className={styles.fullField}>备注<textarea value={remark} onChange={(event) => setRemark(event.target.value)} placeholder="补充数据口径或说明" /></label></div></div><footer><button type="button" className={styles.button} onClick={onClose}>取消</button><button className={styles.primary}>保存数据</button></footer></form></div>;
}

function DataPage() {
  const [product, setProduct] = useState(initialProjects[0].name);
  const [group, setGroup] = useState<ActivityGroupKey>('materials');
  const [keyword, setKeyword] = useState('');
  const selectedProject = initialProjects.find((item) => item.name === product) ?? initialProjects[0];
  const selectedGroup = activityGroups.find((item) => item.key === group) ?? activityGroups[0];
  const rows = inventoryItems[group].filter((item) => !keyword || `${item.name}${item.factor}`.includes(keyword));
  const subtotal = rows.reduce((total, item) => total + (Number.parseFloat(item.result) || 0), 0);
  return <div className={styles.page}>
    <div className={styles.notice}><b>核算说明：</b>本页活动数据来自“活动数据准备”的已确认结果；在此逐项选择背景因子或核算方式，并计算单位产品排放。</div>
    <div className={styles.filters}><label>产品项目<select value={product} onChange={(event) => setProduct(event.target.value)}>{initialProjects.map((item) => <option key={item.id}>{item.name}</option>)}</select></label><button className={styles.button}>导出全量清单</button><button className={styles.primary}>执行核算</button></div>
    <section className={`${styles.card} ${styles.productSummary}`}><div className={styles.productSummaryTop}><div><span className={styles.summaryEyebrow}>当前核算产品</span><h2>{selectedProject.name}</h2></div><span className={styles.summaryStatus}>{selectedProject.status}</span></div><div className={styles.productSummaryMeta}><InfoItem label="功能单位" value={selectedProject.unit} /><InfoItem label="产品规格" value={selectedProject.spec} /><InfoItem label="系统边界" value={selectedProject.boundary} /><InfoItem label="核算期间" value={selectedProject.period} /><InfoItem label="数据状态" value="活动数据已确认" /></div></section>
    <section className={`${styles.card} ${styles.inventoryLayout}`}><aside className={styles.inventoryTree}><h3>生命周期过程树</h3>{activityGroups.map((item, index) => <div key={item.key}><b>{index === 0 || activityGroups[index - 1].stage !== item.stage ? item.stage : ''}</b><button className={group === item.key ? styles.inventoryTreeActive : ''} onClick={() => setGroup(item.key)}><span>{item.label}</span><small>{inventoryItems[item.key].filter((row) => row.status === '已完成').length}/{inventoryItems[item.key].length}</small></button></div>)}</aside><div className={styles.inventoryMain}><div className={styles.inventoryHead}><div><b>{selectedGroup.label}</b><span>来自活动数据准备的功能单位数据；因子由用户主动选择</span></div><input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索清单项" /></div><div className={styles.tableWrap}><table className={styles.inventoryTable}><thead><tr>{['生命周期清单项', '活动数据', '背景因子 / 核算方式', '排放量', '状态', '操作'].map((head) => <th key={head}>{head}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.name}><td><b>{row.name}</b></td><td><strong>{row.activity}</strong></td><td><strong className={row.status === '待选择因子' ? styles.factorMissing : ''}>{row.factor}{row.factorMeta ? ` · ${row.factorMeta}` : ''}</strong></td><td><strong className={styles.footprint}>{row.result}</strong></td><td><span className={row.status === '已完成' ? styles.success : styles.warning}>{row.status}</span></td><td><button className={styles.text}>查看来源</button><button className={styles.text}>{row.status === '已完成' ? '更换因子' : '选择因子'}</button></td></tr>)}</tbody></table></div><div className={styles.inventorySubtotal}>本分组小计 <strong>{subtotal.toFixed(2)} kgCO₂e/台</strong></div></div></section>
  </div>;
}
function InfoItem({ label, value }: { label: string; value: string }) { return <div className={styles.infoItem}><span>{label}</span><b>{value}</b></div>; }
function ActivityTable({ activities = initialActivities }: { activities?: Activity[] }) { return <div className={styles.tableWrap}><table><thead><tr>{['生命周期阶段', '排放活动', '活动数据', '排放因子', '排放结果', '数据来源', '操作'].map((head) => <th key={head}>{head}</th>)}</tr></thead><tbody>{activities.map((row) => <tr key={row.id}><td>{row.stage}</td><td><b>{row.name}</b></td><td>{row.amount} {row.unit}</td><td>{row.factor}</td><td><strong className={styles.footprint}>{row.result} kgCO₂e</strong></td><td>{row.dataSource}</td><td><button className={styles.text}>编辑数据</button></td></tr>)}</tbody></table></div>; }
function ResultsPage() {
  const total = 246.39;
  const topRows = resultActivities.slice().sort((a, b) => Number(b[5]) - Number(a[5])).slice(0, 5);
  return <div className={`${styles.page} ${styles.resultPage}`}>
    <div className={`${styles.filters} ${styles.resultFilters}`}><label>产品名称<select><option>工业产品 A-100（2026年度）</option><option>铝合金型材 6063（2026年度）</option></select></label><label>产品类别<select><option>全部类别</option><option>机械设备</option><option>金属制品</option></select></label><label>核算年度<select><option>2026年度</option><option>2025年度</option></select></label><button className={styles.primary}>查询</button><button className={styles.button}>重置</button></div>
    <div className={styles.resultSummary}><section className={`${styles.card} ${styles.bigNumber}`}><b>产品碳足迹</b><strong>{total.toFixed(2)}</strong><span>kgCO₂e/功能单位</span></section><section className={`${styles.card} ${styles.resultInfo}`}>{[['产品名称', '工业产品 A-100'], ['功能单位', '1 台产品'], ['产品规格', 'A-100 标准型'], ['系统边界', '原材料获取—生产制造—分销与运输'], ['核算期间', '2026年度'], ['核算依据', 'ISO 14067 / 适用PCR（如有）']].map(([label, value]) => <div key={label}><span>{label}</span><b>{value}</b></div>)}</section></div>
    <div className={styles.resultCharts}><section className={`${styles.card} ${styles.chartCard}`}><h3>生命周期阶段贡献</h3><div className={styles.donutLayout}><div className={styles.donutWrap}><div className={styles.donut} /><div className={styles.donutCenter}><strong>{total.toFixed(2)}</strong><span>已核算 kgCO₂e</span></div></div><div className={styles.resultLegend}><div><i /><b>阶段</b><b>排放量</b><b>占比</b></div>{resultStages.map((item) => <div key={item.label}><i style={{ background: item.color }} /><span>{item.label}</span><span>{item.value.toFixed(2)}</span><span>{(item.value / total * 100).toFixed(2)}%</span></div>)}</div></div></section><section className={`${styles.card} ${styles.chartCard}`}><h3>主要排放来源（TOP5）</h3><div className={styles.resultBars}>{topRows.map((row) => <div key={row[1]}><span>{row[1]}</span><i><b style={{ width: `${Number(row[5]) / Number(topRows[0][5]) * 100}%` }} /></i><span>{Number(row[5]).toFixed(2)}</span><span>{(Number(row[5]) / total * 100).toFixed(2)}%</span></div>)}</div></section></div>
    <section className={`${styles.card} ${styles.resultTable}`}><h3>排放活动明细</h3><div className={styles.tableWrap}><table><thead><tr>{['生命周期阶段', '排放活动', '活动数据', '排放因子', '因子来源', '排放量(kgCO₂e/功能单位)', '占比'].map((head) => <th key={head}>{head}</th>)}</tr></thead><tbody>{resultActivities.map((row) => <tr key={row[1]}>{row.map((cell) => <td key={cell}>{cell}</td>)}<td>{(Number(row[5]) / total * 100).toFixed(2)}%</td></tr>)}<tr className={styles.totalRow}><td>已核算合计</td><td>—</td><td>—</td><td>—</td><td>—</td><td>{total.toFixed(2)}</td><td>100.00%</td></tr></tbody></table></div></section>
  </div>;
}
function ReportsPage() { return <div className={`${styles.page} ${styles.reportLayout}`}><section className={styles.card}><div className={styles.cardHead}><b>报告列表</b><button className={styles.primary}>＋ 生成报告</button></div>{['工业变频器 VFD-75 产品碳足迹报告', '铝合金型材 6063 产品碳足迹报告', '电子控制器 EC-20 产品碳足迹报告'].map((name, i) => <button className={`${styles.reportItem} ${i === 0 ? styles.selected : ''}`} key={name}><b>{name}</b><span>2026-09-{14 - i * 2} 已生成</span></button>)}</section><section className={styles.card}><div className={styles.cardHead}><b>报告预览</b><div><button className={styles.button}>重新生成</button> <button className={styles.primary}>⇩ 下载报告</button></div></div><article className={styles.paper}><div>ISO 14067 / 适用 PCR</div><h2>产品碳足迹报告</h2><p>报告编号：CFP-2026-VFD75-001</p><dl><dt>产品名称</dt><dd>工业变频器 VFD-75</dd><dt>功能单位</dt><dd>1 台产品</dd><dt>系统边界</dt><dd>摇篮到大门</dd><dt>核算期间</dt><dd>2026 年度</dd></dl><strong>86.4 <small>kgCO₂e/功能单位</small></strong></article></section></div>; }
function LinkedResultsPage({ projects, activeProjectId, confirmedRows, onProjectChange }: { projects: Project[]; activeProjectId: number; confirmedRows?: ActivityDataRow[]; onProjectChange: (projectId: number) => void }) {
  const project = projects.find((item) => item.id === activeProjectId) ?? projects[0];
  const rows = (confirmedRows ?? []).filter((row) => emissionOf(row) > 0);
  const total = inventoryTotal(rows);
  const emissionUnit = `kgCO₂e/${project.unit}`;
  const stageRows = ['原材料获取', '生产制造', '分销与运输'].map((stage) => ({ label: stage, value: rows.filter((row) => stageLabel(row.stage) === stage).reduce((sum, row) => sum + emissionOf(row), 0) }));
  const stageColors = ['#4d87da', '#24a8b5', '#68bd69'];
  const donutBackground = total ? `conic-gradient(${stageRows.reduce<string[]>((stops, item, index) => {
    const start = stageRows.slice(0, index).reduce((sum, row) => sum + row.value, 0) / total * 100;
    const end = start + item.value / total * 100;
    stops.push(`${stageColors[index]} ${start.toFixed(2)}% ${end.toFixed(2)}%`);
    return stops;
  }, []).join(', ')})` : '#edf2f0';
  const topRows = rows.slice().sort((a, b) => emissionOf(b) - emissionOf(a)).slice(0, 5);
  return <div className={`${styles.page} ${styles.resultPage}`}>
    <div className={`${styles.filters} ${styles.resultFilters}`}>
      <label>产品项目<select value={String(project.id)} onChange={(event) => onProjectChange(Number(event.target.value))}>{projects.map((item) => <option value={item.id} key={item.id}>{item.name}（{item.year}）</option>)}</select></label>
      <div className={styles.resultSnapshot}><span>结果依据</span><b>已确认的核算清单快照</b></div>
    </div>
    {!confirmedRows ? <section className={styles.card}><div className={styles.empty}><div><strong>尚无正式核算结果</strong><p>请先在“碳足迹核算清单”补齐数据并确认清单。</p></div></div></section> : <><div className={styles.resultSummary}><section className={`${styles.card} ${styles.bigNumber}`}><b>产品碳足迹</b><strong>{total.toFixed(2)}</strong><span>{emissionUnit}</span></section><section className={`${styles.card} ${styles.resultInfo}`}>{[['产品名称', project.name], ['功能单位', project.unit], ['产品规格', project.spec], ['系统边界', project.boundary], ['核算期间', project.period], ['核算状态', '已确认清单快照']].map(([label, value]) => <div key={label}><span>{label}</span><b>{value}</b></div>)}</section></div><div className={styles.resultCharts}><section className={`${styles.card} ${styles.chartCard}`}><h3>生命周期阶段贡献</h3><div className={styles.donutLayout}><div className={styles.donutWrap}><div className={styles.donut} style={{ background: donutBackground }} /><div className={styles.donutCenter}><strong>{total.toFixed(2)}</strong><span>已核算 {emissionUnit}</span></div></div><div className={styles.resultLegend}><div><i /><b>阶段</b><b>排放量（{emissionUnit}）</b><b>占比</b></div>{stageRows.map((item, index) => <div key={item.label}><i style={{ background: stageColors[index] }} /><span>{item.label}</span><span>{item.value.toFixed(2)} {emissionUnit}</span><span>{total ? (item.value / total * 100).toFixed(2) : '0.00'}%</span></div>)}</div></div></section><section className={`${styles.card} ${styles.chartCard}`}><h3>主要排放来源（TOP5）</h3><div className={styles.resultBars}>{topRows.map((row) => <div key={row.id}><span>{row.name}</span><i><b style={{ width: `${topRows[0] ? emissionOf(row) / emissionOf(topRows[0]) * 100 : 0}%` }} /></i><span>{emissionOf(row).toFixed(2)} {emissionUnit}</span><span>{total ? (emissionOf(row) / total * 100).toFixed(2) : '0.00'}%</span></div>)}</div></section></div><section className={`${styles.card} ${styles.resultTable}`}><h3>排放活动明细</h3><div className={styles.tableWrap}><table><thead><tr>{['生命周期阶段', '排放活动', '活动数据', '排放因子', '因子来源', `排放量（${emissionUnit}）`, '占比'].map((head) => <th key={head}>{head}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td>{stageLabel(row.stage)}</td><td>{row.name}</td><td>{row.amount} {row.unit}</td><td>{row.factorValue}</td><td>{row.source}</td><td>{emissionOf(row).toFixed(2)} {emissionUnit}</td><td>{total ? (emissionOf(row) / total * 100).toFixed(2) : '0.00'}%</td></tr>)}<tr className={styles.totalRow}><td>已核算合计</td><td>—</td><td>—</td><td>—</td><td>—</td><td>{total.toFixed(2)} {emissionUnit}</td><td>100.00%</td></tr></tbody></table></div></section></>}</div>;
}
function downloadProductCarbonReport(project: Project, rows: ActivityDataRow[]) {
  const total = inventoryTotal(rows);
  const stageRows = ['原材料获取', '生产制造', '分销与运输'].map((stage) => ({ label: stage, value: rows.filter((row) => stageLabel(row.stage) === stage).reduce((sum, row) => sum + emissionOf(row), 0) }));
  const detailRows = rows.filter((row) => emissionOf(row) > 0).map((row) => `<tr><td>${stageLabel(row.stage)}</td><td>${row.name}</td><td>${row.amount} ${row.unit}</td><td>${emissionOf(row).toFixed(2)}</td></tr>`).join('');
  downloadHtmlReport({
    filename: `${project.name}-产品碳足迹报告.html`,
    title: `${project.name} 产品碳足迹报告`,
    content: `<p>报告编号：CFP-${project.year.slice(0, 4)}-${project.id}-001</p><h2>01 报告摘要</h2><p><strong>单位产品碳足迹：${total.toFixed(2)} kgCO₂e/${project.unit}</strong></p><table><tbody><tr><th>产品名称</th><td>${project.name}</td></tr><tr><th>功能单位</th><td>${project.unit}</td></tr><tr><th>系统边界</th><td>${project.boundary}</td></tr><tr><th>核算期间</th><td>${project.period}</td></tr><tr><th>核算依据</th><td>ISO 14067:2018</td></tr></tbody></table><h2>生命周期阶段贡献</h2><table><thead><tr><th>生命周期阶段</th><th>排放量（kgCO₂e）</th><th>占比</th></tr></thead><tbody>${stageRows.map((row) => `<tr><td>${row.label}</td><td>${row.value.toFixed(2)}</td><td>${total ? (row.value / total * 100).toFixed(2) : '0.00'}%</td></tr>`).join('')}<tr><th>合计</th><th>${total.toFixed(2)}</th><th>100.00%</th></tr></tbody></table><h2>02 目标与范围定义</h2><p>本报告以${project.unit}为功能单位，依据已确认核算清单，对${project.boundary}边界内的温室气体排放进行量化。</p><h2>03 数据收集与核算方法</h2><p>各排放活动按“活动数据 × 排放因子”计算，并汇总为二氧化碳当量。</p><h2>04 产品碳足迹核算结果</h2><table><thead><tr><th>生命周期阶段</th><th>排放活动</th><th>活动数据</th><th>排放量（kgCO₂e）</th></tr></thead><tbody>${detailRows}</tbody></table><h2>05 数据质量与不确定性</h2><p>报告数据来自已确认核算清单快照；未取得供应商特定数据的活动使用适配因子并应持续完善。</p><h2>06 排放热点与减排建议</h2><p>优先针对高贡献排放活动推进低碳材料替代、供应商碳数据协同及制造环节节能优化。</p>`,
  });
}

function ProductCarbonReportPreview({ project, rows }: { project: Project; rows: ActivityDataRow[] }) {
  const total = inventoryTotal(rows);
  const reportNo = `CFP-${project.year.slice(0, 4)}-${project.id}-001`;
  const stageRows = ['原材料获取', '生产制造', '分销与运输'].map((stage) => ({ label: stage, value: rows.filter((row) => stageLabel(row.stage) === stage).reduce((sum, row) => sum + emissionOf(row), 0) }));
  const topRows = rows.filter((row) => emissionOf(row) > 0).sort((left, right) => emissionOf(right) - emissionOf(left)).slice(0, 3);
  const evidenceRate = rows.length ? Math.round(rows.filter((row) => row.evidence > 0).length / rows.length * 100) : 0;
  return <article className={styles.productReportPaper}>
    <section className={styles.reportCover}>
      <div className={styles.reportCoverHead}><div><b>工业企业能碳管理平台</b><span>PRODUCT CARBON FOOTPRINT</span></div><div>ISO 14067:2018<br />产品碳足迹核算报告</div></div>
      <div className={styles.reportCoverTitle}><span>PRODUCT CARBON FOOTPRINT REPORT</span><h2>产品碳足迹核算报告</h2><strong>{project.name}</strong></div>
      <div className={styles.reportMeta}><span>报告编号</span><b>{reportNo}</b><span>功能单位</span><b>{project.unit}</b><span>系统边界</span><b>{project.boundary}</b><span>核算周期</span><b>{project.period}</b><span>数据依据</span><b>已确认核算清单快照</b><span>报告版本</span><b>V1.0</b></div>
      <p>本报告基于已确认核算清单快照生成，用于产品碳足迹量化、热点识别与减排管理。</p>
    </section>
    <section className={styles.reportPageSection}>
      <div className={styles.reportPageHead}><span>产品碳足迹核算报告</span><span>{reportNo}</span></div><h2>01 报告摘要</h2><p>本报告基于既定系统边界与功能单位，对目标产品相关生命周期阶段的温室气体排放进行量化。</p>
      <div className={styles.reportSummaryGrid}><div className={styles.reportResultCard}><span>单位产品碳足迹</span><strong>{total.toFixed(2)}</strong><b>kgCO₂e / {project.unit}</b></div><div className={styles.reportInfoCard}>{[['目标产品', project.name], ['功能单位', project.unit], ['系统边界', project.boundary], ['核算依据', 'ISO 14067:2018'], ['数据质量等级', evidenceRate >= 90 ? '良好' : '待完善']].map(([label, value]) => <div key={label}><span>{label}</span><b>{value}</b></div>)}</div></div>
      <h3>生命周期阶段贡献</h3><table><thead><tr><th>生命周期阶段</th><th>排放量（kgCO₂e）</th><th>占比</th></tr></thead><tbody>{stageRows.map((row) => <tr key={row.label}><td>{row.label}</td><td>{row.value.toFixed(2)}</td><td>{total ? (row.value / total * 100).toFixed(2) : '0.00'}%</td></tr>)}<tr className={styles.reportTotalRow}><td>合计</td><td>{total.toFixed(2)}</td><td>100.00%</td></tr></tbody></table>
    </section>
    <section className={styles.reportPageSection}><div className={styles.reportPageHead}><span>产品碳足迹核算报告</span><span>目标与范围</span></div><h2>02 目标与范围定义</h2><h3>核算目标</h3><p>量化目标产品在既定系统边界内的温室气体排放，识别主要排放贡献环节，为低碳设计、供应链协同和减排管理提供依据。</p><h3>产品与功能单位</h3><table><tbody><tr><th>产品名称</th><td>{project.name}</td></tr><tr><th>产品规格</th><td>{project.spec}</td></tr><tr><th>功能单位</th><td>{project.unit}</td></tr><tr><th>核算周期</th><td>{project.period}</td></tr></tbody></table><h3>系统边界</h3><div className={styles.reportScopeFlow}>{stageRows.map((row) => <span key={row.label}>{row.label}</span>)}</div><p className={styles.reportCallout}>纳入核算的阶段依据已确认核算清单确定；未纳入的生命周期阶段不计入本次结果。</p></section>
    <section className={styles.reportPageSection}><div className={styles.reportPageHead}><span>产品碳足迹核算报告</span><span>数据收集与方法</span></div><h2>03 数据收集与核算方法</h2><h3>数据来源</h3><table><thead><tr><th>数据对象</th><th>活动数据</th><th>数据来源</th><th>因子来源</th></tr></thead><tbody>{rows.filter((row) => emissionOf(row) > 0).map((row) => <tr key={row.id}><td>{row.name}</td><td>{row.amount} {row.unit}</td><td>{row.source}</td><td>{row.factor}</td></tr>)}</tbody></table><h3>计算方法</h3><p>各排放活动按照“活动数据 × 对应排放因子”计算，并按功能单位归集为二氧化碳当量。</p><p className={styles.reportCallout}>产品碳足迹 = Σ（活动数据 × 排放因子 × 必要的换算或分配系数）</p></section>
    <section className={styles.reportPageSection}><div className={styles.reportPageHead}><span>产品碳足迹核算报告</span><span>核算结果</span></div><h2>04 产品碳足迹核算结果</h2><table><thead><tr><th>阶段</th><th>排放活动</th><th>活动数据</th><th>因子来源</th><th>排放量（kgCO₂e）</th><th>占比</th></tr></thead><tbody>{rows.filter((row) => emissionOf(row) > 0).map((row) => <tr key={row.id}><td>{stageLabel(row.stage)}</td><td>{row.name}</td><td>{row.amount} {row.unit}</td><td>{row.source}</td><td>{emissionOf(row).toFixed(2)}</td><td>{total ? (emissionOf(row) / total * 100).toFixed(2) : '0.00'}%</td></tr>)}<tr className={styles.reportTotalRow}><td colSpan={4}>合计</td><td>{total.toFixed(2)}</td><td>100.00%</td></tr></tbody></table><p>单位产品碳足迹为 <b>{total.toFixed(2)} kgCO₂e/{project.unit}</b>，应优先关注高贡献排放活动。</p></section>
    <section className={styles.reportPageSection}><div className={styles.reportPageHead}><span>产品碳足迹核算报告</span><span>数据质量与不确定性</span></div><h2>05 数据质量与不确定性</h2><div className={styles.reportQualityGrid}><div><span>数据完整性</span><b>{evidenceRate}%</b></div><div><span>初级数据覆盖</span><b>{evidenceRate}%</b></div><div><span>因子适配度</span><b>良好</b></div><div><span>综合质量等级</span><b>{evidenceRate >= 90 ? 'B' : '待完善'}</b></div></div><p className={styles.reportCallout}>结果基于已确认清单快照。采用行业或通用因子的活动，建议后续以供应商特定数据持续替换和完善。</p></section>
    <section className={styles.reportPageSection}><div className={styles.reportPageHead}><span>产品碳足迹核算报告</span><span>热点分析与减排建议</span></div><h2>06 排放热点与减排建议</h2><div className={styles.reportHotspots}>{topRows.map((row, index) => <div key={row.id}><b>{index + 1}</b><strong>{row.name}</strong><p>贡献 {total ? (emissionOf(row) / total * 100).toFixed(2) : '0.00'}%，建议优先结合工艺、供应链或能源管理措施降低该环节影响。</p></div>)}</div><div className={styles.reportRecommendations}><div><b>推进高贡献活动减排</b><p>优先开展低碳材料替代、设备节能和低碳能源采购。</p></div><div><b>完善供应商碳数据协同</b><p>逐步以供应商特定数据替换行业平均排放因子。</p></div><div><b>提升产品级数据颗粒度</b><p>持续完善 BOM、计量、运输和废弃物台账，为年度复算提供依据。</p></div></div></section>
  </article>;
}

function LinkedReportsPage({ projects, activeProjectId, confirmedRows, generatedReportIds, onProjectChange, onGenerate }: { projects: Project[]; activeProjectId: number; confirmedRows?: ActivityDataRow[]; generatedReportIds: number[]; onProjectChange: (projectId: number) => void; onGenerate: () => void }) {
  const project = projects.find((item) => item.id === activeProjectId) ?? projects[0];
  const total = inventoryTotal(confirmedRows ?? []);
  const generated = generatedReportIds.includes(project.id);
  return <div className={`${styles.page} ${styles.reportLayout}`}>
    <section className={styles.card}>
      <div className={styles.cardHead}><b>报告列表</b><button className={styles.primary} disabled={!confirmedRows} onClick={onGenerate}>＋ 生成报告</button></div>
      {generatedReportIds.map((id) => {
        const item = projects.find((candidate) => candidate.id === id);
        return item ? <button className={`${styles.reportItem} ${id === project.id ? styles.selected : ''}`} key={id} onClick={() => onProjectChange(id)}><b>{item.name} 产品碳足迹报告</b><span>基于已确认清单快照</span></button> : null;
      })}
    </section>
    <section className={`${styles.card} ${styles.reportPreviewCard}`}>
      <div className={styles.cardHead}><b>报告预览</b><div><button className={styles.button} disabled={!confirmedRows} onClick={onGenerate}>重新生成</button> <button className={styles.primary} disabled={!generated} onClick={() => downloadProductCarbonReport(project, confirmedRows ?? [])}>⇩ 下载报告</button></div></div>
      <div className={styles.reportPreviewViewport}>{!confirmedRows ? <div className={styles.empty}><div><strong>暂无可生成报告的正式结果</strong><p>报告仅能读取已确认的核算清单快照。</p></div></div> : !generated ? <div className={styles.empty}><div><strong>结果已确认，可生成报告</strong><p>点击“生成报告”后创建该项目的报告版本。</p></div></div> : <ProductCarbonReportPreview project={project} rows={confirmedRows} />}</div>
    </section>
  </div>;
}
function FactorsPage({ addModal, onCloseAddModal }: { addModal: boolean; onCloseAddModal: () => void }) {
  const [keyword, setKeyword] = useState(''); const [category, setCategory] = useState('全部因子'); const [view, setView] = useState<'category' | 'source'>('category'); const [selected, setSelected] = useState<FactorRow | null>(null); const [factors, setFactors] = useState<FactorRow[]>(factorRows);
  const categories = view === 'category' ? ['全部因子', '原辅材料', '能源与燃料', '运输', '工艺过程排放', '废弃物处理'] : ['全部因子', 'CPCD', '国家因子库', '供应商/数据库'];
  const rows = factors.filter((item) => (category === '全部因子' || (view === 'category' ? item.category === category : item.source === category)) && item.name.includes(keyword));
  return <div className={`${styles.page} ${styles.factorLayout}`}>
    <aside className={`${styles.card} ${styles.factorSide}`}><div className={styles.factorTabs}><button className={view === 'category' ? styles.factorTabActive : ''} onClick={() => { setView('category'); setCategory('全部因子'); }}>按业务类别</button><button className={view === 'source' ? styles.factorTabActive : ''} onClick={() => { setView('source'); setCategory('全部因子'); }}>按来源</button></div><input placeholder="搜索分类" /><nav>{categories.map((item) => <button key={item} className={category === item ? styles.treeActive : ''} onClick={() => setCategory(item)}>▰ {item}</button>)}</nav></aside>
    <div><div className={`${styles.filters} ${styles.factorFilters}`}><label>因子名称<input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="输入因子名称" /></label><label>适用区域<select><option>全部区域</option><option>中国</option></select></label><label>数据年份<select><option>全部年份</option><option>2024</option><option>2022</option></select></label><label>数据来源<select><option>全部来源</option><option>CPCD</option><option>国家因子库</option></select></label><button className={styles.primary}>查询</button><button className={styles.button} onClick={() => setKeyword('')}>重置</button></div><section className={styles.card}><div className={styles.tableWrap}><table className={styles.factorTable}><thead><tr>{['因子名称', '分类', '因子值', '因子单位', '区域', '年份', '来源', '操作'].map((head) => <th key={head}>{head}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td><b>{row.name}</b></td><td>{row.category}</td><td><strong className={styles.footprint}>{row.value}</strong></td><td>{row.unit}</td><td>{row.region}</td><td>{row.year}</td><td>{row.source}</td><td><button className={styles.factorDetailLink} onClick={() => setSelected(row)}>查看详情</button></td></tr>)}</tbody></table></div></section></div>
    {selected && <FactorDetailModal factor={selected} onClose={() => setSelected(null)} />}
    {addModal && <FactorFormModal onClose={onCloseAddModal} onSubmit={(factor) => { setFactors((items) => [{ ...factor, id: `factor-${Date.now()}` }, ...items]); onCloseAddModal(); }} />}
  </div>;
}

function FactorDetailModal({ factor, onClose }: { factor: FactorRow; onClose: () => void }) {
  const stageFootprints = [{ label: '原材料获取', value: 58 }, { label: '生产制造', value: 31 }, { label: '包装与运输', value: 11 }];
  return <div className={styles.overlay} onMouseDown={onClose}><section className={styles.modal} role="dialog" aria-modal="true" aria-label="因子详情" style={{ width: 'min(900px, 94vw)' }} onMouseDown={(event) => event.stopPropagation()}><header><div><b>因子详情</b><span className={styles.modalSubTitle}>{factor.name} · 中国产品全生命周期库参考结构</span></div><button type="button" onClick={onClose}>×</button></header><div><div style={{ display: 'flex', alignItems: 'flex-end', gap: 24, marginBottom: 18, padding: '16px 18px', borderRadius: 8, background: '#f2fbf6' }}><div><span style={{ color: '#71808f', fontSize: 13 }}>产品碳足迹因子</span><strong style={{ display: 'block', marginTop: 6, color: '#087e59', fontSize: 26 }}>{factor.value} <small style={{ fontSize: 14, fontWeight: 400 }}>{factor.unit}</small></strong></div><span style={{ color: '#71808f', fontSize: 13 }}>数据质量：★★★★☆ · 数据年份：{factor.year}</span></div><FactorDetail title="基本信息" rows={[["因子名称", factor.name], ["分类", factor.category], ["功能单位", factor.unit], ["核算边界", "摇篮到大门"], ["适用区域", factor.region], ["数据年份", factor.year], ["数据来源", factor.source], ["技术代表性", "行业平均"]]} /><section className={styles.detailCard}><b>生命周期阶段足迹</b><div style={{ display: 'grid', gap: 10, marginTop: 14 }}>{stageFootprints.map((stage) => <div key={stage.label} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 40px', alignItems: 'center', gap: 10 }}><span>{stage.label}</span><i style={{ height: 10, overflow: 'hidden', borderRadius: 8, background: '#e8f0ed' }}><b style={{ display: 'block', width: `${stage.value}%`, height: '100%', borderRadius: 8, background: '#18a66d' }} /></i><small>{stage.value}%</small></div>)}</div></section><p className={styles.modalHint}>该因子适用于当前分类的产品碳足迹核算；实际使用前请结合功能单位、核算边界和数据年份确认适用性。</p></div><footer><button type="button" className={styles.button} onClick={onClose}>关闭</button></footer></section></div>;
}

function FactorDetail({ title, rows }: { title: string; rows: string[][] }) { return <section className={styles.detailCard}><b>{title}</b><div className={styles.detailGrid}>{rows.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div></section>; }

function FactorFormModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (factor: Omit<FactorRow, 'id'>) => void }) {
  const [name, setName] = useState(''); const [category, setCategory] = useState('原辅材料'); const [value, setValue] = useState(''); const [unit, setUnit] = useState('kgCO₂e/kg'); const [region, setRegion] = useState('中国'); const [year, setYear] = useState('2026'); const [source, setSource] = useState('企业实测数据');
  const mark = <span style={{ color: '#d64545' }} aria-hidden="true">*</span>;
  return <div className={styles.overlay} onMouseDown={onClose}><form className={styles.modal} role="dialog" aria-modal="true" aria-label="新增因子" style={{ width: 'min(780px, 94vw)' }} onMouseDown={(event) => event.stopPropagation()} onSubmit={(event) => { event.preventDefault(); onSubmit({ name, category, value, unit, region, year, source }); }}><header><div><b>新增碳足迹因子</b><span className={styles.modalSubTitle}>录入企业特定或经核验的产品碳足迹因子</span></div><button type="button" onClick={onClose}>×</button></header><div><div className={styles.formGrid}><label>因子名称 {mark}<input required value={name} onChange={(event) => setName(event.target.value)} placeholder="例如：供应商热轧钢材因子" /></label><label>因子分类 {mark}<select value={category} onChange={(event) => setCategory(event.target.value)}><option>原辅材料</option><option>能源与燃料</option><option>运输</option><option>工艺过程排放</option><option>废弃物处理</option></select></label><label>因子值 {mark}<input required type="number" min="0" step="any" value={value} onChange={(event) => setValue(event.target.value)} placeholder="例如：1.820" /></label><label>因子单位 {mark}<input required value={unit} onChange={(event) => setUnit(event.target.value)} placeholder="例如：kgCO₂e/kg" /></label><label>适用区域 {mark}<input required value={region} onChange={(event) => setRegion(event.target.value)} placeholder="例如：中国" /></label><label>数据年份 {mark}<input required value={year} onChange={(event) => setYear(event.target.value)} placeholder="例如：2026" /></label><label className={styles.fullField}>数据来源及依据 {mark}<input required value={source} onChange={(event) => setSource(event.target.value)} placeholder="例如：供应商检测报告或企业实测数据" /></label></div></div><footer><button type="button" className={styles.button} onClick={onClose}>取消</button><button className={styles.primary}>保存因子</button></footer></form></div>;
}
function ActivityModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (activity: Activity) => void }) { const [activityType, setActivityType] = useState<ActivityType>('原辅材料'); const [stage, setStage] = useState('原材料获取阶段'); const [name, setName] = useState('主要原材料'); const [amount, setAmount] = useState('1'); const [unit, setUnit] = useState('kg'); const [extra, setExtra] = useState(''); const factors: Record<ActivityType, { name: string; value: number; unit: string; source: string }> = { '原辅材料': { name: '通用原材料因子（示例）', value: 2.15, unit: 'kgCO₂e/kg', source: '公共因子库' }, 能源: { name: '全国电力因子（示例）', value: 0.5306, unit: 'kgCO₂e/kWh', source: '国家电力因子' }, 运输: { name: '重型柴油货车运输（示例）', value: 0.0978, unit: 'kgCO₂e/(t·km)', source: 'CPCD' }, 工艺排放: { name: '企业工艺过程因子（示例）', value: 0.85, unit: 'kgCO₂e/功能单位', source: '企业特定数据' }, 废弃物: { name: '一般工业固废处理（示例）', value: 0.12, unit: 'kgCO₂e/kg', source: 'CPCD' } }; const defaults: Record<ActivityType, { name: string; unit: string; stage: string }> = { 原辅材料: { name: '主要原材料', unit: 'kg', stage: '原材料获取阶段' }, 能源: { name: '外购电力', unit: 'kWh', stage: '产品制造阶段' }, 运输: { name: '公路运输', unit: 't·km', stage: '产品配送阶段' }, 工艺排放: { name: '工艺过程排放', unit: '功能单位', stage: '产品制造阶段' }, 废弃物: { name: '生产废弃物处理', unit: 'kg', stage: '产品制造阶段' } }; const factor = factors[activityType]; const numericAmount = Number(amount) || 0; const normalizedAmount = activityType === '运输' ? numericAmount * (Number(extra) || 0) : numericAmount; const result = (normalizedAmount * factor.value).toFixed(2); const changeType = (type: ActivityType) => { setActivityType(type); setName(defaults[type].name); setUnit(defaults[type].unit); setStage(defaults[type].stage); setAmount('1'); setExtra(''); }; return <div className={styles.overlay} onMouseDown={onClose}><form className={styles.modal} onMouseDown={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); onSubmit({ id: Date.now(), stage, name: name || '待补充活动', amount: activityType === '运输' ? normalizedAmount.toFixed(2) : amount || '0', unit, factor: `${factor.value}`, source: factor.source, result, dataSource: '页面录入' }); }}><header><b>新增活动数据</b><button type="button" onClick={onClose}>×</button></header><div><h3>1. 选择活动类型</h3><div className={styles.activityTypeGrid}>{(Object.keys(factors) as ActivityType[]).map((type) => <button type="button" key={type} className={`${styles.activityType} ${activityType === type ? styles.activityTypeActive : ''}`} onClick={() => changeType(type)}>{type}</button>)}</div><h3>2. 录入活动数据</h3><div className={styles.formGrid}><label>生命周期阶段<select value={stage} onChange={(e) => setStage(e.target.value)}>{lifecycleStages.slice(0, 3).map(([, title]) => <option key={title}>{title}</option>)}</select></label><label>排放活动名称<input value={name} onChange={(e) => setName(e.target.value)} placeholder="请输入活动名称" /></label><label>活动数据<input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="请输入数值" /></label><label>单位<select value={unit} onChange={(e) => setUnit(e.target.value)}>{(activityType === '能源' ? ['kWh', 'Nm³', 'kg', 't', 'GJ'] : activityType === '运输' ? ['t·km'] : activityType === '工艺排放' ? ['功能单位', 'kg', 't'] : ['kg', 't', '件']).map((item) => <option key={item}>{item}</option>)}</select></label>{activityType === '运输' && <><label>运输距离<input type="number" min="0" step="0.01" value={extra} onChange={(e) => setExtra(e.target.value)} placeholder="km" /></label><p className={styles.fieldHelp}>系统按运输重量 × 运输距离计算运输周转量（t·km）。</p></>}{activityType === '原辅材料' && <label className={styles.fullField}>供应商（可选）<input value={extra} onChange={(e) => setExtra(e.target.value)} placeholder="用于记录供应商特定数据来源" /></label>}{activityType === '废弃物' && <label className={styles.fullField}>处理方式（可选）<select value={extra} onChange={(e) => setExtra(e.target.value)}><option value="">请选择</option><option>委外处置</option><option>回收利用</option><option>填埋</option><option>焚烧</option></select></label>}</div><h3>3. 确认排放因子</h3><label className={styles.fullField}>排放因子<select><option>{factor.name}｜{factor.value} {factor.unit}｜{factor.source}</option></select></label><div className={styles.factorPreview}><div><span>当前因子</span><b>{factor.name} · {factor.value} {factor.unit}</b></div><div><span>预计排放结果</span><b>{result} kgCO₂e/功能单位</b></div></div></div><footer><button type="button" className={styles.button} onClick={onClose}>取消</button><button className={styles.button}>保存并继续新增</button><button className={styles.primary}>保存</button></footer></form></div>; }
function ProjectModal({ project, onClose, onSubmit }: { project?: Project; onClose: () => void; onSubmit: (project: Pick<Project, 'name' | 'spec' | 'category' | 'unit' | 'boundary' | 'period' | 'processFile'>) => void }) {
  const categoryOptions = ['机械设备', '金属制品', '电子电器', '包装制品'];
  const initialCategory = project?.category ?? '机械设备';
  const [name, setName] = useState(project?.name ?? '');
  const [spec, setSpec] = useState(project?.spec ?? '');
  const [category, setCategory] = useState(categoryOptions.includes(initialCategory) ? initialCategory : '其他（自定义）');
  const [customCategory, setCustomCategory] = useState(categoryOptions.includes(initialCategory) ? '' : initialCategory);
  const [unit, setUnit] = useState(project?.unit ?? '1 件产品');
  const [periodMode, setPeriodMode] = useState<'annual' | 'custom'>('annual');
  const [annualYear, setAnnualYear] = useState(project?.year.match(/\d{4}/)?.[0] ?? '2026');
  const [startDate, setStartDate] = useState(project?.period.match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? '2026-01-01');
  const [endDate, setEndDate] = useState(project?.period.match(/\d{4}-\d{2}-\d{2}/g)?.[1] ?? '2026-12-31');
  const [boundary, setBoundary] = useState(project ? `${project.boundary}（${project.boundary === '摇篮到大门' ? 'Cradle to Gate' : 'Cradle to Grave'}）` : '摇篮到大门（Cradle to Gate）');
  const [processFile, setProcessFile] = useState(project?.processFile ?? '');
  const period = periodMode === 'annual' ? `${annualYear}年度（${annualYear}-01-01 至 ${annualYear}-12-31）` : `${startDate} 至 ${endDate}`;
  return <div className={styles.overlay} onMouseDown={onClose}><form className={styles.modal} onMouseDown={(event) => event.stopPropagation()} onSubmit={(event) => { event.preventDefault(); if (startDate > endDate) return; onSubmit({ name, spec, category: category === '其他（自定义）' ? customCategory.trim() : category, unit, boundary: boundary.split('（')[0], period, processFile }); }}><header><b>{project ? '编辑产品碳足迹项目' : '新建产品碳足迹项目'}</b><button type="button" onClick={onClose}>×</button></header><div>
    <h3>产品信息</h3><div className={styles.formGrid}><label>产品名称<input required value={name} onChange={(e) => setName(e.target.value)} placeholder="请输入产品名称" /></label><label>规格型号<input required value={spec} onChange={(e) => setSpec(e.target.value)} placeholder="请输入产品规格型号" /></label><label>产品类别<select value={category} onChange={(e) => setCategory(e.target.value)}>{categoryOptions.map((item) => <option key={item}>{item}</option>)}<option>其他（自定义）</option></select></label>{category === '其他（自定义）' && <label>自定义产品类别<input required value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} placeholder="请输入产品类别" /></label>}<label>功能单位<input value={unit} onChange={(e) => setUnit(e.target.value)} /></label></div>
    <h3>核算范围</h3><div className={styles.formGrid}><label>核算周期<div className={styles.periodModes}><button type="button" className={periodMode === 'annual' ? styles.periodModeActive : ''} onClick={() => setPeriodMode('annual')}>自然年度</button><button type="button" className={periodMode === 'custom' ? styles.periodModeActive : ''} onClick={() => setPeriodMode('custom')}>自定义周期</button></div>{periodMode === 'annual' ? <><select aria-label="自然年度" value={annualYear} onChange={(e) => { setAnnualYear(e.target.value); setStartDate(`${e.target.value}-01-01`); setEndDate(`${e.target.value}-12-31`); }}><option>2026</option><option>2025</option><option>2024</option></select><span className={styles.periodSummary}>{annualYear} 年 1 月 1 日至 {annualYear} 年 12 月 31 日（自然年）</span></> : <><span className={styles.modalHint}>支持非自然年，请选择数据统计的起止日期</span><div className={styles.dateRange}><input aria-label="核算开始日期" type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} /><span>至</span><input aria-label="核算结束日期" type="date" required value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>{startDate > endDate && <small className={styles.errorText}>结束日期不能早于开始日期</small>}</>}</label><label>系统边界<select value={boundary} onChange={(e) => setBoundary(e.target.value)}><option>摇篮到大门（Cradle to Gate）</option><option>摇篮到坟墓（Cradle to Grave）</option></select></label></div>
    <h3>生产工艺</h3><label className={styles.uploadField}><span className={styles.uploadTitle}>☁</span><strong>点击上传工艺图</strong><input type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" onChange={(e) => setProcessFile(Array.from(e.target.files ?? []).map((file) => file.name).join('、'))} /><span className={styles.uploadHint}>{processFile || '支持 PDF、XLSX、DOCX、JPG、PNG，可多选'}</span></label>
    <h3>取舍规则</h3><ol className={styles.selectionRules}><li>普通物料重量＜1%产品重量时，以及含稀贵或高纯成分的物料重量＜0.1%产品重量时，可忽略该物料的上游生产数据；总共忽略的物料重量不超过 5%。</li><li>低价值废物作为原料，如粉煤灰、矿渣、秸秆、生活垃圾等，可忽略其上游生产数据。</li><li>大多数情况下，生产设备、厂房、生活设施等可以忽略。</li><li>在选定环境影响类型范围内的已知排放数据不应忽略。</li></ol>
  </div><footer><button type="button" className={styles.button} onClick={onClose}>取消</button><button className={styles.primary} disabled={startDate > endDate}>{project ? '保存修改' : '创建项目'}</button></footer></form></div>; }

function DeleteConfirm({ project, onClose, onConfirm }: { project: Project; onClose: () => void; onConfirm: () => void }) {
  return <div className={styles.overlay} onMouseDown={onClose}><section className={`${styles.modal} ${styles.confirmModal}`} role="dialog" aria-modal="true" aria-labelledby="delete-project-title" onMouseDown={(event) => event.stopPropagation()}><header><b id="delete-project-title">删除项目</b><button type="button" onClick={onClose}>×</button></header><div className={styles.confirmBody}><p>确认删除项目“<strong>{project.name}</strong>”吗？</p><span>删除后将无法恢复，请谨慎操作。</span></div><footer><button type="button" className={styles.button} onClick={onClose}>取消</button><button type="button" className={styles.deleteConfirmButton} onClick={onConfirm}>确定删除</button></footer></section></div>;
}
