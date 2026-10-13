import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ENERGY_COLORS = {
  电力: '#19aeb6',
  天然气: '#f1ad2d',
  热力: '#4389ef',
};

const PERIODS = {
  '2026-09': { label: '2026年9月', factor: 1, coverage: 94.6, covered: 17, total: 18 },
  '2026-08': { label: '2026年8月', factor: 0.92, coverage: 93.8, covered: 15, total: 16 },
};

const nodes = [
  { id: 'grid', name: '外购电力', short: '外购电力', x: 18, y: 48, w: 126, h: 42, kind: '外部输入', energy: '电力', source: '能碳监测·园区总表', quality: '已确认' },
  { id: 'solar', name: '园区光伏', short: '园区光伏', x: 18, y: 126, w: 126, h: 42, kind: '本地产出', energy: '电力', source: '能碳监测·光伏关口表', quality: '已确认' },
  { id: 'gas', name: '外购天然气', short: '外购天然气', x: 18, y: 222, w: 126, h: 42, kind: '外部输入', energy: '天然气', source: '能碳监测·燃气总表', quality: '已确认' },
  { id: 'externalHeat', name: '外购热力', short: '外购热力', x: 18, y: 308, w: 126, h: 42, kind: '外部输入', energy: '热力', source: '公共设施档案·热力接口', quality: '已确认' },
  { id: 'recoveredHeat', name: '企业C余热回收', short: '余热回收', x: 18, y: 382, w: 126, h: 42, kind: '余能回收', energy: '热力', source: '公共设施档案·余热接收表', quality: '待复核' },
  { id: 'heatPlant', name: '公共供热设施', short: '公共供热设施', x: 354, y: 232, w: 142, h: 48, kind: '公共转换设施', energy: '天然气→热力', source: '公共设施档案·供热站', quality: '已确认' },
  { id: 'heatNetwork', name: '热力分配汇总', short: '热力分配汇总', x: 354, y: 326, w: 142, h: 48, kind: '公共供能设施', energy: '热力', source: '能碳监测·热网总表', quality: '已确认' },
  { id: 'enterpriseA', name: '企业A边界', short: '企业A', x: 686, y: 50, w: 116, h: 38, kind: '企业边界', energy: '多能源', source: '企业边界统计', quality: '已确认' },
  { id: 'enterpriseB', name: '企业B边界', short: '企业B', x: 686, y: 112, w: 116, h: 38, kind: '企业边界', energy: '多能源', source: '企业边界统计', quality: '已确认' },
  { id: 'enterpriseC', name: '企业C边界', short: '企业C', x: 686, y: 174, w: 116, h: 38, kind: '企业边界', energy: '多能源', source: '企业边界统计', quality: '部分待复核' },
  { id: 'publicUse', name: '园区公共用能', short: '公共用能', x: 856, y: 104, w: 118, h: 38, kind: '公共用能', energy: '电力', source: '能碳监测·公共区域表', quality: '已确认' },
  { id: 'unmatched', name: '未匹配差额', short: '待核实差额', x: 856, y: 168, w: 118, h: 38, kind: '待核实关系', energy: '电力', source: '边界平衡计算', quality: '待核实' },
  { id: 'confirmedLoss', name: '已确认转换损失', short: '转换损失', x: 548, y: 242, w: 114, h: 38, kind: '已确认损失', energy: '天然气→热力', source: '供热站计量与热值计算', quality: '已确认' },
  { id: 'parkExport', name: '园区外供热力', short: '外供热力', x: 856, y: 342, w: 118, h: 38, kind: '园区外供', energy: '热力', source: '园区外供结算表', quality: '已确认' },
];

const links = [
  { id: 'grid-a', source: 'grid', target: 'enterpriseA', energy: '电力', standard: 35, physical: 2848, category: '外部输入', quality: '已确认', sourceName: '园区总表、企业A边界表' },
  { id: 'grid-b', source: 'grid', target: 'enterpriseB', energy: '电力', standard: 25, physical: 2034, category: '外部输入', quality: '已确认', sourceName: '园区总表、企业B边界表' },
  { id: 'grid-c', source: 'grid', target: 'enterpriseC', energy: '电力', standard: 15, physical: 1220, category: '外部输入', quality: '已确认', sourceName: '园区总表、企业C边界表' },
  { id: 'grid-public', source: 'grid', target: 'publicUse', energy: '电力', standard: 4, physical: 326, category: '外部输入', quality: '已确认', sourceName: '园区总表、公共区域表' },
  { id: 'grid-gap', source: 'grid', target: 'unmatched', energy: '电力', standard: 1, physical: 82, category: '未匹配差额', quality: '待核实', sourceName: '边界平衡计算' },
  { id: 'solar-b', source: 'solar', target: 'enterpriseB', energy: '电力', standard: 5, physical: 407, category: '本地产出', quality: '已确认', sourceName: '光伏关口表、企业B边界表' },
  { id: 'solar-c', source: 'solar', target: 'enterpriseC', energy: '电力', standard: 5, physical: 406, category: '本地产出', quality: '已确认', sourceName: '光伏关口表、企业C边界表' },
  { id: 'gas-plant', source: 'gas', target: 'heatPlant', energy: '天然气', standard: 6, physical: 476, category: '内部转换', quality: '已确认', sourceName: '燃气总表、供热站入口表' },
  { id: 'gas-c', source: 'gas', target: 'enterpriseC', energy: '天然气', standard: 2, physical: 158, category: '外部输入', quality: '已确认', sourceName: '燃气总表、企业C边界表' },
  { id: 'plant-network', source: 'heatPlant', target: 'heatNetwork', energy: '热力', standard: 5, physical: 145000, category: '内部转换', quality: '已确认', sourceName: '供热站出口表、热网总表' },
  { id: 'plant-loss', source: 'heatPlant', target: 'confirmedLoss', energy: '热力', standard: 1, physical: 29000, category: '已确认损失', quality: '已确认', sourceName: '供热站计量与热值计算' },
  { id: 'external-heat-network', source: 'externalHeat', target: 'heatNetwork', energy: '热力', standard: 2, physical: 58000, category: '外部输入', quality: '已确认', sourceName: '热力接口表、热网总表' },
  { id: 'recovery-network', source: 'recoveredHeat', target: 'heatNetwork', energy: '热力', standard: 1, physical: 29000, category: '余能回收', quality: '待复核', sourceName: '余热接收表、热网总表' },
  { id: 'heat-a', source: 'heatNetwork', target: 'enterpriseA', energy: '热力', standard: 2, physical: 58000, category: '企业边界消费', quality: '已确认', sourceName: '热网总表、企业A边界表' },
  { id: 'heat-b', source: 'heatNetwork', target: 'enterpriseB', energy: '热力', standard: 3, physical: 87000, category: '企业边界消费', quality: '已确认', sourceName: '热网总表、企业B边界表' },
  { id: 'heat-c', source: 'heatNetwork', target: 'enterpriseC', energy: '热力', standard: 2, physical: 58000, category: '企业边界消费', quality: '已确认', sourceName: '热网总表、企业C边界表' },
  { id: 'heat-export', source: 'heatNetwork', target: 'parkExport', energy: '热力', standard: 1, physical: 29000, category: '园区外供', quality: '已确认', sourceName: '热网总表、园区外供结算表' },
];

const balanceRows = [
  { id: 'grid', object: '园区电力总接口', energy: '电力', types: ['电力'], input: [80, 6510], output: [79, 6428], export: null, storage: '待确认', loss: null, gap: [1, 82], complete: '96%', status: '待核实' },
  { id: 'solar', object: '园区光伏汇总', energy: '电力', types: ['电力'], input: null, output: [10, 813], export: null, storage: '不适用', loss: null, gap: [0, 0], complete: '100%', status: '完整' },
  { id: 'enterpriseA', object: '企业边界汇总', energy: '电力', types: ['电力'], input: [85, 6915], output: [85, 6915], export: null, storage: '不适用', loss: null, gap: [0, 0], complete: '100%', status: '完整' },
  { id: 'gas', object: '园区天然气总接口', energy: '天然气', types: ['天然气'], input: [8, 634], output: [8, 634], export: null, storage: '不适用', loss: null, gap: [0, 0], complete: '100%', status: '完整' },
  { id: 'heatPlant', object: '公共供热设施', energy: '天然气→热力', types: ['天然气', '热力'], input: [6, 476], output: [5, 145000], export: null, storage: '不适用', loss: [1, 29000], gap: [0, 0], complete: '100%', status: '完整', mixed: true },
  { id: 'externalHeat', object: '外购热力接口', energy: '热力', types: ['热力'], input: [2, 58000], output: [2, 58000], export: null, storage: '不适用', loss: null, gap: [0, 0], complete: '100%', status: '完整' },
  { id: 'recoveredHeat', object: '企业C余热回收接口', energy: '热力', types: ['热力'], input: null, output: [1, 29000], export: null, storage: '不适用', loss: null, gap: null, complete: '82%', status: '待复核' },
  { id: 'heatNetwork', object: '热力分配汇总', energy: '热力', types: ['热力'], input: [8, 232000], output: [7, 203000], export: [1, 29000], storage: '不适用', loss: null, gap: [0, 0], complete: '100%', status: '完整' },
];

const nodeById = Object.fromEntries(nodes.map((node) => [node.id, node]));
const enterpriseIds = new Set(['enterpriseA', 'enterpriseB', 'enterpriseC']);

function unitFor(basis, energy) {
  if (basis === 'standard') return '万tce';
  if (energy === '电力') return '万kWh';
  if (energy === '天然气') return '万Nm³';
  return 'GJ';
}

function formatNumber(value) {
  if (value == null) return '—';
  if (Math.abs(value) >= 1000) return Math.round(value).toLocaleString('zh-CN');
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(1);
}

function getPath(source, target) {
  const x1 = source.x + source.w;
  const y1 = source.y + source.h / 2;
  const x2 = target.x;
  const y2 = target.y + target.h / 2;
  const bend = Math.max(48, (x2 - x1) * 0.48);
  return `M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}`;
}

function downloadCsv(rows, periodLabel, basis) {
  const headers = ['统计期间', '统计对象', '能源品种', '输入量', '产出或消费量', '外供量', '储存变化', '已确认损失', '未匹配差额', '数据完整性'];
  const body = rows.map((row) => [periodLabel, row.object, row.energy, row.inputText, row.outputText, row.exportText, row.storage, row.lossText, row.gapText, `${row.complete} ${row.status}`]);
  const csv = [headers, ...body].map((line) => line.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(',')).join('\n');
  const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `园区能源流向分析_${periodLabel}_${basis === 'standard' ? '折标量' : '实物量'}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ParkEnergyFlowPage() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState({ period: '2026-09', energy: '全部', basis: 'standard' });
  const [filters, setFilters] = useState(draft);
  const [selection, setSelection] = useState({ kind: 'node', id: 'grid' });

  const period = PERIODS[filters.period];
  const basisKey = filters.basis === 'standard' ? 'standard' : 'physical';

  const visibleLinks = useMemo(() => links
    .filter((link) => filters.energy === '全部' || link.energy === filters.energy)
    .map((link) => ({ ...link, value: Number((link[basisKey] * period.factor).toFixed(filters.basis === 'standard' ? 2 : 0)) })), [basisKey, filters.energy, period.factor, filters.basis]);

  const visibleNodeIds = useMemo(() => new Set(visibleLinks.flatMap((link) => [link.source, link.target])), [visibleLinks]);

  const displayRows = useMemo(() => balanceRows
    .filter((row) => filters.energy === '全部' || row.types.includes(filters.energy))
    .map((row) => {
      const valueText = (pair, overrideEnergy = row.energy) => {
        if (!pair) return '—';
        const raw = pair[filters.basis === 'standard' ? 0 : 1];
        const value = Number((raw * period.factor).toFixed(filters.basis === 'standard' ? 2 : 0));
        return `${formatNumber(value)} ${unitFor(filters.basis, overrideEnergy)}`;
      };
      const physicalGasView = row.mixed && filters.basis === 'physical' && filters.energy === '天然气';
      const physicalHeatView = row.mixed && filters.basis === 'physical' && filters.energy === '热力';
      return {
        ...row,
        inputText: physicalHeatView ? '—' : valueText(row.input, row.mixed ? '天然气' : row.energy),
        outputText: physicalGasView ? '—' : valueText(row.output, row.mixed ? '热力' : row.energy),
        exportText: valueText(row.export),
        lossText: physicalGasView ? '—' : valueText(row.loss, row.mixed ? '热力' : row.energy),
        gapText: valueText(row.gap),
      };
    }), [filters.basis, filters.energy, period.factor]);

  const metricValues = useMemo(() => {
    const energy = filters.energy;
    const sum = (predicate) => visibleLinks.filter(predicate).reduce((total, link) => total + link.value, 0);
    const external = sum((link) => ['grid', 'gas', 'externalHeat'].includes(link.source));
    const consumption = sum((link) => enterpriseIds.has(link.target));
    const exported = sum((link) => link.target === 'parkExport');
    return [
      { label: '外部能源输入', value: external, unit: unitFor(filters.basis, energy === '全部' ? '电力' : energy), icon: '⇥', scope: energy === '全部' ? '园区边界 · 跨能源折标汇总' : `${energy} · 园区外部输入边界`, tone: 'cyan' },
      { label: '企业边界消费', value: consumption, unit: unitFor(filters.basis, energy === '全部' ? '电力' : energy), icon: '⌂', scope: '仅统计企业边界接收，不含公共用能', tone: 'blue' },
      { label: '园区能源外供', value: exported, unit: unitFor(filters.basis, energy === '全部' ? '热力' : energy), icon: '↗', scope: '园区边界对外输出 · 不含企业间流转', tone: 'green' },
      { label: '数据覆盖情况', value: period.coverage, unit: '%', icon: '✓', scope: `${period.covered}/${period.total} 条关键关系已覆盖`, tone: 'violet' },
    ];
  }, [filters.basis, filters.energy, period, visibleLinks]);

  const detail = useMemo(() => {
    if (selection.kind === 'link') {
      const link = visibleLinks.find((item) => item.id === selection.id) || links.find((item) => item.id === selection.id);
      if (!link) return null;
      const value = link.value ?? Number((link[basisKey] * period.factor).toFixed(filters.basis === 'standard' ? 2 : 0));
      return {
        type: '流向详情', name: `${nodeById[link.source].name} → ${nodeById[link.target].name}`,
        energy: link.energy, input: `${formatNumber(value)} ${unitFor(filters.basis, link.energy)}`, output: '同流向量',
        related: `${nodeById[link.source].short}、${nodeById[link.target].short}`, source: link.sourceName,
        updated: filters.period === '2026-09' ? '2026-10-10 08:30' : '2026-09-10 08:30', quality: link.quality,
      };
    }
    const node = nodeById[selection.id] || nodeById.grid;
    const incoming = visibleLinks.filter((link) => link.target === node.id).reduce((sum, link) => sum + link.value, 0);
    const outgoing = visibleLinks.filter((link) => link.source === node.id).reduce((sum, link) => sum + link.value, 0);
    const related = [...new Set(visibleLinks.filter((link) => link.source === node.id || link.target === node.id)
      .map((link) => nodeById[link.source === node.id ? link.target : link.source]?.short))].filter(Boolean);
    const detailEnergy = filters.energy === '全部' ? node.energy : filters.energy;
    return {
      type: node.kind, name: node.name, energy: detailEnergy,
      input: incoming ? `${formatNumber(incoming)} ${unitFor(filters.basis, filters.energy === '全部' ? '电力' : filters.energy)}` : '—',
      output: outgoing ? `${formatNumber(outgoing)} ${unitFor(filters.basis, filters.energy === '全部' ? '电力' : filters.energy)}` : '—',
      related: related.length ? related.join('、') : '当前筛选范围内无关联对象', source: node.source,
      updated: filters.period === '2026-09' ? '2026-10-10 08:30' : '2026-09-10 08:30', quality: node.quality,
    };
  }, [basisKey, filters.basis, filters.energy, filters.period, period.factor, selection, visibleLinks]);

  const selectedRelated = useMemo(() => {
    if (selection.kind === 'link') {
      const link = links.find((item) => item.id === selection.id);
      return link ? new Set([link.source, link.target]) : new Set();
    }
    return new Set([selection.id]);
  }, [selection]);

  const changeBasis = (basis) => {
    setDraft((current) => ({ ...current, basis, energy: basis === 'physical' && current.energy === '全部' ? '电力' : current.energy }));
  };

  const changeEnergy = (energy) => {
    setDraft((current) => ({ ...current, energy, basis: energy === '全部' ? 'standard' : current.basis }));
  };

  const applyFilters = () => {
    setFilters(draft);
    const nextLinks = links.filter((link) => draft.energy === '全部' || link.energy === draft.energy);
    const nextNodeIds = new Set(nextLinks.flatMap((link) => [link.source, link.target]));
    const selectedVisible = selection.kind === 'node' ? nextNodeIds.has(selection.id) : nextLinks.some((link) => link.id === selection.id);
    if (!selectedVisible) setSelection({ kind: 'node', id: draft.energy === '天然气' ? 'gas' : draft.energy === '热力' ? 'heatNetwork' : 'grid' });
  };

  const viewRow = (id) => {
    setSelection({ kind: 'node', id });
    document.getElementById('energy-flow-map')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="park-flow-page">
      <header className="park-flow-head">
        <div>
          <h1>园区能源流向分析</h1>
          <p>查看能源从哪里来、到哪里去，以及园区边界数据是否平衡</p>
        </div>
        <span className="park-flow-sample">示例数据</span>
      </header>

      <section className="park-flow-filter-card" aria-label="能源流向筛选">
        <label><span>统计期间</span><select value={draft.period} onChange={(event) => setDraft({ ...draft, period: event.target.value })}><option value="2026-09">2026年9月</option><option value="2026-08">2026年8月</option></select></label>
        <label><span>能源品种</span><select value={draft.energy} onChange={(event) => changeEnergy(event.target.value)}><option value="全部">全部能源</option><option value="电力">电力</option><option value="天然气">天然气</option><option value="热力">热力</option></select></label>
        <div className="park-flow-basis"><span>展示口径</span><div className="park-flow-segment"><button className={draft.basis === 'physical' ? 'active' : ''} onClick={() => changeBasis('physical')}>实物量</button><button className={draft.basis === 'standard' ? 'active' : ''} onClick={() => changeBasis('standard')}>折标量</button></div></div>
        <div className="park-flow-filter-hint">{draft.basis === 'physical' ? `实物量仅展示${draft.energy}` : '跨能源汇总采用统一折标口径'}</div>
        <div className="park-flow-filter-actions"><button className="primary" onClick={applyFilters}>⌕&nbsp; 查询</button><button onClick={() => downloadCsv(displayRows, period.label, filters.basis)}>⇩&nbsp; 导出</button></div>
      </section>

      <section className="park-flow-metrics">
        {metricValues.map((metric) => <article className={`park-flow-metric ${metric.tone}`} key={metric.label}><div className="park-flow-metric-icon">{metric.icon}</div><div><span>{metric.label}</span><strong>{formatNumber(metric.value)} <small>{metric.unit}</small></strong><p>{metric.scope}</p></div></article>)}
      </section>

      <section className="park-flow-card park-flow-map-card" id="energy-flow-map">
        <div className="park-flow-card-head">
          <div><h2>园区能源流向</h2><p>流线宽度与数值对应；点击节点或流向查看统计口径</p></div>
          <div className="park-flow-head-actions"><div className="park-flow-legend">{Object.entries(ENERGY_COLORS).map(([name, color]) => <span key={name}><i style={{ background: color }} />{name}</span>)}</div><button onClick={() => navigate('/energy-carbon-monitoring/balance')}>关联园区能源优化&nbsp; →</button></div>
        </div>
        <div className="park-flow-visual-grid">
          <div className="park-flow-chart-wrap">
            <div className="park-flow-column-heads"><span>外部输入 / 本地产出</span><span>公共转换与供能</span><span>企业边界消费 / 外供</span></div>
            <svg className="park-flow-svg" viewBox="0 0 1000 450" role="img" aria-label="园区能源桑基图">
              <defs>
                {Object.entries(ENERGY_COLORS).map(([name, color]) => <linearGradient id={`flow-${name}`} key={name}><stop offset="0" stopColor={color} stopOpacity=".8" /><stop offset="1" stopColor={color} stopOpacity=".34" /></linearGradient>)}
                <filter id="node-shadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#173c67" floodOpacity=".12" /></filter>
              </defs>
              {visibleLinks.map((link) => {
                const isSelected = selection.kind === 'link' && selection.id === link.id;
                const isRelated = isSelected || selectedRelated.has(link.source) || selectedRelated.has(link.target);
                const width = filters.basis === 'standard' ? Math.max(4, Math.min(34, link.value * 0.78)) : Math.max(4, Math.min(34, link.value / (link.energy === '热力' ? 5500 : link.energy === '电力' ? 125 : 22)));
                return <path key={link.id} d={getPath(nodeById[link.source], nodeById[link.target])} className={`park-flow-link ${isSelected ? 'selected' : ''} ${isRelated ? '' : 'dimmed'}`} stroke={`url(#flow-${link.energy})`} strokeWidth={width} onClick={() => setSelection({ kind: 'link', id: link.id })} tabIndex="0" onKeyDown={(event) => { if (event.key === 'Enter') setSelection({ kind: 'link', id: link.id }); }}><title>{`${nodeById[link.source].name} → ${nodeById[link.target].name}：${formatNumber(link.value)} ${unitFor(filters.basis, link.energy)}；${link.quality}`}</title></path>;
              })}
              {nodes.filter((node) => visibleNodeIds.has(node.id)).map((node) => {
                const isSelected = selection.kind === 'node' && selection.id === node.id;
                const isRelated = selectedRelated.has(node.id);
                const color = node.energy === '天然气' ? ENERGY_COLORS.天然气 : node.energy.includes('热力') ? ENERGY_COLORS.热力 : node.kind.includes('损失') || node.kind.includes('核实') ? '#97a6b8' : ENERGY_COLORS.电力;
                return <g key={node.id} className={`park-flow-node ${isSelected ? 'selected' : ''} ${isRelated ? '' : 'muted'}`} transform={`translate(${node.x},${node.y})`} onClick={() => setSelection({ kind: 'node', id: node.id })} tabIndex="0" onKeyDown={(event) => { if (event.key === 'Enter') setSelection({ kind: 'node', id: node.id }); }} role="button"><rect width={node.w} height={node.h} rx="8" fill="#fff" stroke={color} filter="url(#node-shadow)" /><rect width="7" height={node.h} rx="5" fill={color} /><text x="18" y={node.h / 2 - 2} className="park-flow-node-title">{node.short}</text><text x="18" y={node.h / 2 + 14} className="park-flow-node-kind">{node.kind}</text></g>;
              })}
            </svg>
            <div className="park-flow-chart-note"><span>● 直连流向按实际边界展示</span><span>◇ 虚构闭合关系不纳入</span><span>! 未匹配差额不等同能源损失</span></div>
          </div>

          <aside className="park-flow-detail" aria-live="polite">
            <div className="park-flow-detail-head"><span>节点详情</span><em>{detail?.type}</em></div>
            <h3>{detail?.name}</h3>
            <dl>
              <div><dt>能源品种</dt><dd>{detail?.energy}</dd></div>
              <div><dt>输入量</dt><dd>{detail?.input}</dd></div>
              <div><dt>输出量</dt><dd>{detail?.output}</dd></div>
              <div className="wide"><dt>关联对象</dt><dd>{detail?.related}</dd></div>
              <div className="wide"><dt>数据来源</dt><dd>{detail?.source}</dd></div>
              <div className="wide"><dt>更新时间</dt><dd>{detail?.updated}</dd></div>
            </dl>
            <div className="park-flow-quality"><span>质量状态</span><b className={detail?.quality.includes('已确认') ? 'ok' : 'warn'}>{detail?.quality}</b></div>
            <p>企业节点仅展示边界接收或输出，不下钻内部工序和设备。</p>
          </aside>
        </div>
      </section>

      <section className="park-flow-card park-flow-table-card">
        <div className="park-flow-card-head"><div><h2>能源平衡明细</h2><p>按统计对象核对输入、消费、外供与已知差额，园区汇总避免重复统计</p></div><span className="park-flow-count">共 {displayRows.length} 条</span></div>
        <div className="park-flow-data-alert"><b>数据提示</b><span>电力支路存在 1 条待核实差额；余热回收仅展示已接入公共设施的数据。</span><span>未匹配差额不直接认定为能源损失。</span></div>
        <div className="park-flow-table-scroll">
          <table>
            <thead><tr><th>统计对象</th><th>能源品种</th><th>输入量</th><th>产出或消费量</th><th>外供量</th><th>储存变化</th><th>已确认损失</th><th>未匹配差额</th><th>数据完整性</th><th>操作</th></tr></thead>
            <tbody>{displayRows.map((row) => <tr key={row.id}><td><strong>{row.object}</strong></td><td>{row.energy}</td><td>{row.inputText}</td><td>{row.outputText}</td><td>{row.exportText}</td><td>{row.storage}</td><td>{row.lossText}</td><td className={row.gapText !== '—' && !row.gapText.startsWith('0 ') ? 'gap' : ''}>{row.gapText}</td><td><span className={`park-flow-status ${row.status === '完整' ? 'ok' : 'warn'}`}>{row.complete} · {row.status}</span></td><td><button className="park-flow-link-button" onClick={() => viewRow(row.id)}>查看明细</button></td></tr>)}</tbody>
          </table>
        </div>
        <footer className="park-flow-table-foot"><span>口径说明：产出与下游消费不在园区总量中重复累计；仅有计量和计算依据的差额列入已确认损失。</span><span>数据优先复用能碳监测、公共设施档案和企业边界统计。</span></footer>
      </section>
    </div>
  );
}

export default ParkEnergyFlowPage;
