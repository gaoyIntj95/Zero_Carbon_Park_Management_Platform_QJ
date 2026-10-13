import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../components/Modal.jsx';

const PRODUCT_ROWS = [
  { id: 'p1', enterprise: '企业A', industry: '光伏制造', product: '单晶硅片', indicator: '单位产品综合能耗', actual: .014, limit: .018, unit: 'tce/万片', status: '已达标', standard: 'GB 30251-2024 光伏制造行业能耗限额', condition: '单晶硅片，统计期产品产量及综合能耗数据完整', caliber: '统计期综合能耗 ÷ 合格单晶硅片产量', source: '企业边界能源统计、产品产量月报', evidence: '能源计量汇总表、产量证明' },
  { id: 'p2', enterprise: '企业B', industry: '光伏制造', product: '单晶硅片', indicator: '单位产品综合能耗', actual: .019, limit: .018, unit: 'tce/万片', status: '未达标', standard: 'GB 30251-2024 光伏制造行业能耗限额', condition: '单晶硅片，统计期产品产量及综合能耗数据完整', caliber: '统计期综合能耗 ÷ 合格单晶硅片产量', source: '企业边界能源统计、产品产量月报', evidence: '能源计量汇总表、产量证明' },
  { id: 'p3', enterprise: '企业C', industry: '光伏制造', product: '单晶硅片', indicator: '单位产品综合能耗', actual: null, limit: .018, unit: 'tce/万片', status: '待判定', standard: 'GB 30251-2024 光伏制造行业能耗限额', condition: '单晶硅片，需具备同期产量与能耗数据', caliber: '统计期综合能耗 ÷ 合格单晶硅片产量', source: '企业边界能源统计', evidence: '缺少同期产品产量证明', pendingReason: '同期产量数据待补充' },
  { id: 'p4', enterprise: '企业D', industry: '光伏制造', product: '太阳能电池片', indicator: '单位产品综合能耗', actual: .072, limit: .078, unit: 'tce/万片', status: '已达标', standard: 'GB 30251-2024 光伏制造行业能耗限额', condition: '晶硅太阳能电池片', caliber: '统计期综合能耗 ÷ 合格电池片产量', source: '企业边界能源统计、产品产量月报', evidence: '能源计量汇总表、产量证明' },
  { id: 'p5', enterprise: '企业E', industry: '新材料', product: '工业硅', indicator: '单位产品综合能耗', actual: 1.12, limit: 1.20, unit: 'tce/t', status: '已达标', standard: 'GB 21346-2022 电解铝和工业硅单位产品能源消耗限额', condition: '工业硅产品，执行现有生产规模限额', caliber: '统计期综合能耗 ÷ 合格工业硅产量', source: '企业边界能源统计、产品产量月报', evidence: '能源计量汇总表、产量证明' },
  { id: 'p6', enterprise: '企业F', industry: '装备制造', product: '光伏组件', indicator: '单位产品电耗', actual: 350, limit: null, unit: 'kWh/MW', status: '待判定', standard: '适用标准待核实', condition: '产品规格及适用标准关系尚未确认', caliber: '统计期用电量 ÷ 合格组件产能', source: '企业边界电力统计、产品产量月报', evidence: '标准适用关系证明待补充', pendingReason: '适用限额不明确' },
  { id: 'p7', enterprise: '企业A', industry: '光伏制造', product: '多晶硅', indicator: '单位产品综合能耗', actual: null, limit: 1.40, unit: 'tce/t', status: '待判定', standard: 'GB 29447-2022 多晶硅企业单位产品能源消耗限额', condition: '电子级或太阳能级多晶硅，产品类别需确认', caliber: '统计期综合能耗 ÷ 合格多晶硅产量', source: '企业边界能源统计', evidence: '产品类别和同期产量材料待补充', pendingReason: '产品类别及产量数据待补充' },
];

const DIAGNOSIS_BLUEPRINT = [
  ['光伏制造', 8, 1, 1],
  ['新材料', 4, 1, 1],
  ['装备制造', 4, 1, 0],
  ['其他行业', 2, 1, 0],
];

const DIAGNOSIS_ROWS = (() => {
  const rows = [];
  let number = 0;
  DIAGNOSIS_BLUEPRINT.forEach(([industry, covered, missing, verifying]) => {
    const statuses = [
      ...Array(covered).fill('已满足覆盖条件'),
      ...Array(missing).fill('尚无有效成果'),
      ...Array(verifying).fill('待核实'),
    ];
    statuses.forEach((status, index) => {
      const letter = String.fromCharCode(65 + number);
      const hasReport = status === '已满足覆盖条件' || status === '待核实';
      rows.push({
        id: `d${number + 1}`,
        enterprise: `企业${letter}`,
        industry,
        period: hasReport ? `2026.${String((index % 8) + 2).padStart(2, '0')}` : '—',
        report: status === '已满足覆盖条件' ? '能效诊断报告' : status === '待核实' ? '已有诊断报告' : '—',
        status,
        note: status === '已满足覆盖条件' ? '诊断范围、期间及成果有效性已核实' : status === '尚无有效成果' ? '当前未归集到有效成果，开展情况待持续归集' : '诊断对象或成果适用期间待核实',
        scope: status === '已满足覆盖条件' ? '覆盖企业主要用能系统及重点耗能环节' : status === '待核实' ? '报告范围描述需与园区评价边界复核' : '暂无可核实成果范围',
        basis: status === '已满足覆盖条件' ? '报告期间属于评价周期，范围满足覆盖口径且成果材料有效' : status === '待核实' ? '报告已归集，但范围或期间尚未满足确认条件' : '报告缺失不直接认定未开展诊断，暂归为尚无有效成果',
      });
      number += 1;
    });
  });
  return rows;
})();

const PRODUCT_EMPTY = { period: '2026', enterprise: '全部', industry: '全部', product: '全部', indicator: '全部', status: '全部' };
const DIAGNOSIS_EMPTY = { period: '2026', enterprise: '全部', industry: '全部', status: '全部' };
const STATUS_COLORS = { 已达标: '#2086ee', 未达标: '#f5a623', 待判定: '#aeb5bd', 已满足覆盖条件: '#2086ee', 尚无有效成果: '#aeb5bd', 待核实: '#f5a623' };

function formatMetric(value, unit, digits = 3) {
  return value == null ? '—' : `${Number(value).toFixed(digits)} ${unit}`;
}

function downloadCsv(filename, headers, rows) {
  const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(',')).join('\n');
  const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function DonutChart({ title, total, segments, centerLabel, linkAction }) {
  const totalValue = Math.max(total, 1);
  let cursor = 0;
  const stops = segments.map((segment) => {
    const start = cursor;
    cursor += segment.value / totalValue * 100;
    return `${segment.color} ${start}% ${cursor}%`;
  }).join(', ');
  return <section className="eff-analysis-card eff-donut-card"><div className="eff-card-head"><h2>{title}</h2><button onClick={linkAction}>查看零碳指标&nbsp; →</button></div><div className="eff-donut-content"><div className="eff-donut" style={{ background: `conic-gradient(${stops})` }}><div><strong>{total}</strong><span>{centerLabel}</span></div></div><div className="eff-donut-legend">{segments.map((segment) => <div key={segment.label}><i style={{ background: segment.color }} /><span>{segment.label}</span><b>{segment.value} {centerLabel === '产品指标' ? '项' : '家'}</b><em>{total ? (segment.value / total * 100).toFixed(1) : '0.0'}%</em></div>)}</div></div></section>;
}

function ComparisonChart({ rows }) {
  const seed = rows.find((row) => row.limit != null) || rows[0];
  const comparable = seed ? rows.filter((row) => row.product === seed.product && row.indicator === seed.indicator && row.unit === seed.unit) : [];
  if (!seed || !comparable.length) return <section className="eff-analysis-card"><div className="eff-card-head"><div><h2>同类产品能耗对比</h2><p>仅比较产品、指标及统计口径一致的数据</p></div></div><div className="eff-chart-empty">当前筛选范围内暂无可比数据</div></section>;
  const width = 710, height = 250, left = 105, right = 674, top = 42, bottom = 210;
  const max = Math.max(seed.limit || 0, ...comparable.map((row) => row.actual || 0)) * 1.14 || 1;
  const x = (value) => left + value / max * (right - left);
  const rowGap = Math.min(48, 145 / Math.max(comparable.length, 1));
  const limitX = x(seed.limit || 0);
  return <section className="eff-analysis-card eff-comparison-card"><div className="eff-card-head"><div><h2>同类产品能耗横向对比</h2><p>{seed.product}｜{seed.indicator}｜单位：{seed.unit}</p></div><span className="eff-limit-badge">适用限额</span></div><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="同类产品能耗横向对比图">
    {[0, .25, .5, .75, 1].map((ratio) => <g key={ratio}><line x1={x(max * ratio)} x2={x(max * ratio)} y1={top} y2={bottom} className="eff-grid-line" /><text x={x(max * ratio)} y={231} textAnchor="middle" className="eff-axis-text">{(max * ratio).toFixed(max < .1 ? 3 : 1)}</text></g>)}
    {seed.limit != null && <><line x1={limitX} x2={limitX} y1={top - 8} y2={bottom} className="eff-limit-line" /><text x={limitX} y={26} textAnchor="middle" className="eff-limit-text">限额 {seed.limit}</text></>}
    {comparable.map((row, index) => { const y = top + 13 + index * rowGap; const value = row.actual; return <g key={row.id}><text x={left - 13} y={y + 7} textAnchor="end" className="eff-bar-label">{row.enterprise}</text>{value == null ? <><rect x={left} y={y - 8} width={Math.max(105, (right - left) * .22)} height="24" rx="2" className="eff-missing-bar" /><text x={left + 116} y={y + 7} className="eff-missing-text">待补充</text></> : <><rect x={left} y={y - 8} width={Math.max(2, x(value) - left)} height="24" rx="2" className={row.status === '未达标' ? 'eff-bar-warn' : 'eff-bar-ok'}><title>{`${row.enterprise}：${value} ${row.unit}`}</title></rect><text x={x(value) + 8} y={y + 7} className="eff-bar-value">{value}</text></>}</g>; })}
  </svg><div className="eff-chart-note">仅对同类产品且统计口径一致的数据进行比较。</div></section>;
}

function IndustryCoverageChart({ rows }) {
  const industries = [...new Set(rows.map((row) => row.industry))];
  const statuses = ['已满足覆盖条件', '尚无有效成果', '待核实'];
  const width = 710, height = 250, left = 112, right = 670, top = 38, bottom = 210;
  const groups = industries.map((industry) => ({ industry, values: statuses.map((status) => rows.filter((row) => row.industry === industry && row.status === status).length) }));
  const max = Math.max(1, ...groups.map((group) => group.values.reduce((sum, value) => sum + value, 0)));
  const scale = (value) => value / Math.max(12, max) * (right - left);
  return <section className="eff-analysis-card eff-industry-card"><div className="eff-card-head"><h2>分行业诊断覆盖情况</h2><div className="eff-mini-legend">{statuses.map((status) => <span key={status}><i style={{ background: STATUS_COLORS[status] }} />{status}</span>)}</div></div><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="分行业诊断覆盖堆叠条形图">
    {[0, 2, 4, 6, 8, 10, 12].map((tick) => <g key={tick}><line x1={left + scale(tick)} x2={left + scale(tick)} y1={top} y2={bottom} className="eff-grid-line" /><text x={left + scale(tick)} y={232} textAnchor="middle" className="eff-axis-text">{tick}</text></g>)}
    {groups.map((group, groupIndex) => { let offset = left; const y = top + 14 + groupIndex * 43; return <g key={group.industry}><text x={left - 14} y={y + 9} textAnchor="end" className="eff-bar-label">{group.industry}</text>{group.values.map((value, index) => { const x = offset; const w = scale(value); offset += w; return value ? <g key={statuses[index]}><rect x={x} y={y - 9} width={w} height="26" fill={STATUS_COLORS[statuses[index]]}><title>{`${group.industry} · ${statuses[index]}：${value}家`}</title></rect><text x={x + w / 2} y={y + 8} textAnchor="middle" className="eff-stack-value">{value}</text></g> : null; })}<text x={offset + 10} y={y + 8} className="eff-total-value">{group.values.reduce((sum, value) => sum + value, 0)}</text></g>; })}
    <text x={(left + right) / 2} y="248" textAnchor="middle" className="eff-axis-text">企业数量（家）</text>
  </svg></section>;
}

function MetricCards({ tab, rows }) {
  if (tab === 'products') {
    const enterprises = new Set(rows.map((row) => row.enterprise)).size;
    const pass = rows.filter((row) => row.status === '已达标').length;
    const fail = rows.filter((row) => row.status === '未达标').length;
    const pending = rows.filter((row) => row.status === '待判定').length;
    return <section className="eff-metrics"><article><i className="building">▥</i><div><span>纳入统计企业</span><strong>{enterprises} <small>家</small></strong></div></article><article><i className="record">▤</i><div><span>产品指标记录</span><strong>{rows.length} <small>项</small></strong></div></article><article><i className="checked">✓</i><div><span>已达标 / 未达标</span><strong><b>{pass}</b> <small>项</small> / <em>{fail}</em> <small>项</small></strong></div></article><article><i className="pending">?</i><div><span>待判定</span><strong>{pending} <small>项</small></strong></div></article></section>;
  }
  const covered = rows.filter((row) => row.status === '已满足覆盖条件').length;
  const missing = rows.filter((row) => row.status === '尚无有效成果').length;
  const verifying = rows.filter((row) => row.status === '待核实').length;
  const rate = rows.length ? covered / rows.length * 100 : 0;
  return <section className="eff-metrics"><article><i className="building">▥</i><div><span>纳入评价企业</span><strong>{rows.length} <small>家</small></strong></div></article><article><i className="record">▤</i><div><span>已满足覆盖条件</span><strong>{covered} <small>家</small></strong></div></article><article><i className="checked">◔</i><div><span>诊断覆盖率</span><strong><b>{rate.toFixed(1)}%</b> <small>（{covered} / {rows.length || 0} 家）</small></strong></div></article><article><i className="pending">?</i><div><span>尚无有效成果 / 待核实</span><strong>{missing} <small>家</small> / <em>{verifying}</em> <small>家</small></strong></div></article></section>;
}

export function EnterpriseEfficiencyPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('products');
  const [productDraft, setProductDraft] = useState(PRODUCT_EMPTY);
  const [productFilters, setProductFilters] = useState(PRODUCT_EMPTY);
  const [diagnosisDraft, setDiagnosisDraft] = useState(DIAGNOSIS_EMPTY);
  const [diagnosisFilters, setDiagnosisFilters] = useState(DIAGNOSIS_EMPTY);
  const [diagnosisPage, setDiagnosisPage] = useState(1);
  const [detail, setDetail] = useState(null);

  const productIndustries = [...new Set(PRODUCT_ROWS.map((row) => row.industry))];
  const productNames = [...new Set(PRODUCT_ROWS.map((row) => row.product))];
  const indicators = [...new Set(PRODUCT_ROWS.map((row) => row.indicator))];
  const diagnosisIndustries = [...new Set(DIAGNOSIS_ROWS.map((row) => row.industry))];

  const shownProducts = useMemo(() => PRODUCT_ROWS.filter((row) =>
    productFilters.period === '2026' &&
    (productFilters.enterprise === '全部' || row.enterprise === productFilters.enterprise) &&
    (productFilters.industry === '全部' || row.industry === productFilters.industry) &&
    (productFilters.product === '全部' || row.product === productFilters.product) &&
    (productFilters.indicator === '全部' || row.indicator === productFilters.indicator) &&
    (productFilters.status === '全部' || row.status === productFilters.status)
  ), [productFilters]);

  const shownDiagnoses = useMemo(() => DIAGNOSIS_ROWS.filter((row) =>
    diagnosisFilters.period === '2026' &&
    (diagnosisFilters.enterprise === '全部' || row.enterprise === diagnosisFilters.enterprise) &&
    (diagnosisFilters.industry === '全部' || row.industry === diagnosisFilters.industry) &&
    (diagnosisFilters.status === '全部' || row.status === diagnosisFilters.status)
  ), [diagnosisFilters]);

  const productSegments = ['已达标', '未达标', '待判定'].map((status) => ({ label: status, value: shownProducts.filter((row) => row.status === status).length, color: STATUS_COLORS[status] }));
  const diagnosisSegments = ['已满足覆盖条件', '尚无有效成果', '待核实'].map((status) => ({ label: status, value: shownDiagnoses.filter((row) => row.status === status).length, color: STATUS_COLORS[status] }));
  const diagnosisPageCount = Math.max(1, Math.ceil(shownDiagnoses.length / 8));
  const pagedDiagnoses = shownDiagnoses.slice((diagnosisPage - 1) * 8, diagnosisPage * 8);
  const switchTab = (value) => { setTab(value); setDetail(null); setDiagnosisPage(1); };

  const exportCurrent = () => {
    if (tab === 'products') downloadCsv('产品能耗达标_示例数据.csv', ['企业', '行业', '产品及指标', '实际值', '适用限额', '差距', '判定情况'], shownProducts.map((row) => [row.enterprise, row.industry, `${row.product}·${row.indicator}`, formatMetric(row.actual, row.unit), formatMetric(row.limit, row.unit), row.actual == null || row.limit == null ? '—' : (row.actual - row.limit).toFixed(3), row.status]));
    else downloadCsv('能效诊断覆盖_示例数据.csv', ['企业', '行业', '诊断期间', '成果依据', '覆盖状态', '核实说明'], shownDiagnoses.map((row) => [row.enterprise, row.industry, row.period, row.report, row.status, row.note]));
  };

  return <div className="enterprise-efficiency-page">
    <header className="eff-page-head"><div><div className="eff-title-row"><h1>园区企业能效分析</h1><span>示例数据</span></div><p>产品能耗达标与诊断覆盖情况，为零碳建设提供依据</p></div></header>
    <nav className="efficiency-tabs" role="tablist" aria-label="园区企业能效分析"><button role="tab" aria-selected={tab === 'products'} className={tab === 'products' ? 'active' : ''} onClick={() => switchTab('products')}>产品能耗达标</button><button role="tab" aria-selected={tab === 'diagnoses'} className={tab === 'diagnoses' ? 'active' : ''} onClick={() => switchTab('diagnoses')}>能效诊断覆盖</button></nav>

    {tab === 'products' ? <>
      <section className="efficiency-filters product"><label>评价期间<select value={productDraft.period} onChange={(event) => setProductDraft({ ...productDraft, period: event.target.value })}><option value="2026">2026年度</option><option value="2025">2025年度</option></select></label><label>企业<select value={productDraft.enterprise} onChange={(event) => setProductDraft({ ...productDraft, enterprise: event.target.value })}><option>全部</option>{[...new Set(PRODUCT_ROWS.map((row) => row.enterprise))].map((item) => <option key={item}>{item}</option>)}</select></label><label>行业<select value={productDraft.industry} onChange={(event) => setProductDraft({ ...productDraft, industry: event.target.value })}><option>全部</option>{productIndustries.map((item) => <option key={item}>{item}</option>)}</select></label><label>产品<select value={productDraft.product} onChange={(event) => setProductDraft({ ...productDraft, product: event.target.value })}><option>全部</option>{productNames.map((item) => <option key={item}>{item}</option>)}</select></label><label>指标<select value={productDraft.indicator} onChange={(event) => setProductDraft({ ...productDraft, indicator: event.target.value })}><option>全部</option>{indicators.map((item) => <option key={item}>{item}</option>)}</select></label><label>判定状态<select value={productDraft.status} onChange={(event) => setProductDraft({ ...productDraft, status: event.target.value })}><option>全部</option><option>已达标</option><option>未达标</option><option>待判定</option></select></label><div className="eff-filter-actions"><button className="primary" onClick={() => setProductFilters(productDraft)}>⌕&nbsp; 查询</button><button onClick={exportCurrent}>⇩&nbsp; 导出</button></div></section>
      <MetricCards tab="products" rows={shownProducts} />
      <div className="eff-summary-note">达标分布按当前评价期间汇总；同类对比按产品、指标、单位及统计口径一致的数据筛选。</div>
      <section className="eff-chart-grid"><DonutChart title="产品指标达标分布" total={shownProducts.length} centerLabel="产品指标" segments={productSegments} linkAction={() => navigate('/zero-carbon-indicators')} /><ComparisonChart rows={shownProducts} /></section>
      <section className="eff-analysis-card eff-table-card"><div className="eff-card-head"><div><h2>企业产品能耗明细</h2><p>实际值、限额值及差距均保留产品对应单位</p></div><span>共 {shownProducts.length} 项</span></div><div className="eff-table-wrap"><table><thead><tr><th>企业</th><th>产品及指标</th><th>实际值</th><th>适用限额</th><th>差距</th><th>判定情况</th><th>操作</th></tr></thead><tbody>{shownProducts.map((row) => { const gap = row.actual == null || row.limit == null ? null : row.actual - row.limit; return <tr key={row.id}><td><strong>{row.enterprise}</strong><small>{row.industry}</small></td><td>{row.product}<small>{row.indicator}</small></td><td>{formatMetric(row.actual, row.unit)}</td><td>{formatMetric(row.limit, row.unit)}</td><td className={gap == null ? '' : gap > 0 ? 'warn' : 'good'}>{gap == null ? '—' : `${gap > 0 ? '+' : ''}${gap.toFixed(3)} ${row.unit}`}</td><td><span className={`eff-status ${row.status === '已达标' ? 'ok' : row.status === '未达标' ? 'warn' : 'pending'}`}>{row.status}</span></td><td><button className="eff-link-btn" onClick={() => setDetail({ type: 'product', row })}>查看依据</button></td></tr>; })}</tbody></table>{!shownProducts.length && <div className="eff-empty">当前筛选条件下暂无数据</div>}</div><div className="eff-table-note">ⓘ 标准来源、适用条件及数据来源在依据详情中查看；缺失值显示“—”，数据不足时不计算差距。</div></section>
      <footer className="eff-page-foot">单项产品达标不代表企业整体达标；企业内部能效改进由企业自行开展。</footer>
    </> : <>
      <section className="efficiency-filters diagnosis"><label>评价期间<select value={diagnosisDraft.period} onChange={(event) => setDiagnosisDraft({ ...diagnosisDraft, period: event.target.value })}><option value="2026">2026年度</option><option value="2025">2025年度</option></select></label><label>企业<select value={diagnosisDraft.enterprise} onChange={(event) => setDiagnosisDraft({ ...diagnosisDraft, enterprise: event.target.value })}><option>全部</option>{DIAGNOSIS_ROWS.map((row) => <option key={row.id}>{row.enterprise}</option>)}</select></label><label>行业<select value={diagnosisDraft.industry} onChange={(event) => setDiagnosisDraft({ ...diagnosisDraft, industry: event.target.value })}><option>全部</option>{diagnosisIndustries.map((item) => <option key={item}>{item}</option>)}</select></label><label>覆盖状态<select value={diagnosisDraft.status} onChange={(event) => setDiagnosisDraft({ ...diagnosisDraft, status: event.target.value })}><option>全部</option><option>已满足覆盖条件</option><option>尚无有效成果</option><option>待核实</option></select></label><div className="eff-filter-actions"><button className="primary" onClick={() => { setDiagnosisFilters(diagnosisDraft); setDiagnosisPage(1); }}>⌕&nbsp; 查询</button><button onClick={exportCurrent}>⇩&nbsp; 导出</button></div></section>
      <MetricCards tab="diagnoses" rows={shownDiagnoses} />
      <div className="eff-summary-note info">ⓘ 覆盖率按“已满足覆盖条件企业数 ÷ 纳入评价企业数”计算；待核实企业计入分母，暂不计入分子。</div>
      <section className="eff-chart-grid diagnosis"><DonutChart title="能效诊断覆盖分布" total={shownDiagnoses.length} centerLabel="纳入企业" segments={diagnosisSegments} linkAction={() => navigate('/zero-carbon-indicators')} /><IndustryCoverageChart rows={shownDiagnoses} /></section>
      <section className="eff-analysis-card eff-table-card"><div className="eff-card-head"><div><h2>企业能效诊断明细</h2><p>依据有效诊断成果及适用条件核实覆盖情况</p></div><span>共 {shownDiagnoses.length} 家</span></div><div className="eff-table-wrap"><table><thead><tr><th>企业</th><th>行业</th><th>诊断期间</th><th>成果依据</th><th>覆盖状态</th><th>核实说明</th><th>操作</th></tr></thead><tbody>{pagedDiagnoses.map((row) => <tr key={row.id}><td><strong>{row.enterprise}</strong></td><td>{row.industry}</td><td>{row.period}</td><td>{row.report}</td><td><span className={`eff-status ${row.status === '已满足覆盖条件' ? 'ok' : row.status === '待核实' ? 'warn' : 'pending'}`}>{row.status}</span></td><td>{row.note}</td><td><button className="eff-link-btn" onClick={() => setDetail({ type: 'diagnosis', row })}>查看依据</button></td></tr>)}</tbody></table>{!shownDiagnoses.length && <div className="eff-empty">当前筛选条件下暂无数据</div>}</div>{shownDiagnoses.length > 0 && <div className="eff-pagination"><span>每页 8 条</span><button disabled={diagnosisPage === 1} onClick={() => setDiagnosisPage((page) => page - 1)}>‹</button>{Array.from({ length: diagnosisPageCount }, (_, index) => <button key={index + 1} className={diagnosisPage === index + 1 ? 'active' : ''} onClick={() => setDiagnosisPage(index + 1)}>{index + 1}</button>)}<button disabled={diagnosisPage === diagnosisPageCount} onClick={() => setDiagnosisPage((page) => page + 1)}>›</button></div>}</section>
      <footer className="eff-page-foot">报告缺失不直接认定未开展诊断，报告上传不直接认定满足覆盖要求。园区侧仅用于成果归集、建设进度跟踪和资料核实。</footer>
    </>}

    <Modal open={!!detail} title={detail?.type === 'product' ? '产品能耗判定依据' : '能效诊断覆盖依据'} onClose={() => setDetail(null)} className="small"><div className="modal-body eff-detail-modal">{detail?.type === 'product' ? <><div className="eff-detail-title">{detail.row.enterprise} · {detail.row.product}</div><dl><div><dt>标准来源</dt><dd>{detail.row.standard}</dd></div><div><dt>适用条件</dt><dd>{detail.row.condition}</dd></div><div><dt>计算口径</dt><dd>{detail.row.caliber}</dd></div><div><dt>数据来源</dt><dd>{detail.row.source}</dd></div><div><dt>证明材料</dt><dd>{detail.row.evidence}</dd></div><div><dt>判定结果</dt><dd>{detail.row.status}{detail.row.pendingReason ? ` · ${detail.row.pendingReason}` : ''}</dd></div></dl></> : detail?.row && <><div className="eff-detail-title">{detail.row.enterprise} · {detail.row.industry}</div><dl><div><dt>诊断报告</dt><dd>{detail.row.report}</dd></div><div><dt>诊断范围</dt><dd>{detail.row.scope}</dd></div><div><dt>诊断期间</dt><dd>{detail.row.period}</dd></div><div><dt>覆盖状态</dt><dd>{detail.row.status}</dd></div><div><dt>判定依据</dt><dd>{detail.row.basis}</dd></div><div><dt>核实说明</dt><dd>{detail.row.note}</dd></div></dl></>}</div><div className="modal-foot"><button className="btn" onClick={() => setDetail(null)}>关闭</button></div></Modal>
  </div>;
}

export default EnterpriseEfficiencyPage;
