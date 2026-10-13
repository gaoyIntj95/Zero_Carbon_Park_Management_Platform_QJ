import React, { useMemo, useState } from 'react';

const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

const BASE_DATA = {
  energy: {
    label: '综合能耗', unit: '万tce', shortUnit: '万tce', target: 100, budget: 96,
    actual: [8.2, 7.6, 8.1, 8.4, 8.0, 7.9, 8.3, 8.4, 8.3],
    forecastMonths: [8.1, 7.9, 8.2, 8.3, 8.1, 8.0, 8.3, 8.4, 8.3, 8.4, 8.4, 8.4],
    enterpriseDeviation: [['企业A', .65], ['企业B', .40], ['公共供热设施', .25], ['企业C', -.10]],
    energyDeviation: [['电力', .80], ['天然气', .35], ['热力', .15], ['光伏自发自用', -.10]],
  },
  carbon: {
    label: '碳排放', unit: '万tCO₂e', shortUnit: '万tCO₂e', target: 48, budget: 45.6,
    actual: [3.9, 3.6, 3.9, 4.0, 3.8, 3.7, 4.0, 4.1, 4.1],
    forecastMonths: [3.8, 3.7, 3.9, 4.0, 3.9, 3.8, 4.0, 4.1, 4.1, 3.9, 3.9, 3.9],
    enterpriseDeviation: [['企业A', .40], ['企业B', .30], ['公共供热设施', .25], ['企业C', -.05]],
    energyDeviation: [['外购电力', .55], ['天然气', .25], ['热力', .15], ['光伏替代', -.05]],
  },
};

const sum = (values) => values.reduce((total, value) => total + Number(value || 0), 0);
const round = (value, digits = 2) => Number(Number(value).toFixed(digits));
const cumulative = (values) => values.map((_, index) => round(sum(values.slice(0, index + 1))));

function formatValue(value) {
  return Number(value).toFixed(2);
}

function buildCsv(data, period, cutoff, mode) {
  const rows = [['月份', '月度预算', cutoff >= 1 ? '实际/预测' : '预测', '数据类型']];
  MONTHS.forEach((month, index) => rows.push([
    month,
    data.monthlyBudget[index].toFixed(2),
    (index < cutoff ? data.actual[index] : data.forecastMonths[index]).toFixed(2),
    index < cutoff ? '实际' : '预测',
  ]));
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n');
  const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `能耗与碳排放预算_${period}_${mode === 'energy' ? '综合能耗' : '碳排放'}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function linePath(values, x, y, start = 0) {
  return values.map((value, index) => `${index ? 'L' : 'M'} ${x(index + start)} ${y(value)}`).join(' ');
}

function TrendChart({ data, cutoff, hasForecast }) {
  const width = 1220, height = 278, left = 55, right = 1184, top = 22, bottom = 228;
  const max = Math.ceil(Math.max(data.target, data.forecastTotal || 0, data.budget) / 20) * 20;
  const x = (index) => left + index * (right - left) / 11;
  const y = (value) => bottom - value / max * (bottom - top);
  const forecastValues = hasForecast ? [data.actualCumulative[cutoff - 1], ...data.forecastCumulative.slice(cutoff)] : [];
  const predictionStart = cutoff > 0 ? Math.max(left, x(cutoff - 1) + (x(Math.min(cutoff, 11)) - x(cutoff - 1)) / 2) : left;
  const ticks = [0, max * .25, max * .5, max * .75, max];
  return <svg className="budget-trend-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="全年预算与实际趋势图">
    <rect x={predictionStart} y={top} width={right - predictionStart} height={bottom - top} className="budget-prediction-zone" />
    <text x={(predictionStart + right) / 2} y={bottom - 12} className="budget-zone-label" textAnchor="middle">预测区间</text>
    {ticks.map((tick) => <g key={tick}><line x1={left} x2={right} y1={y(tick)} y2={y(tick)} className="budget-grid-line" /><text x={left - 12} y={y(tick) + 4} textAnchor="end" className="budget-axis-text">{tick}</text></g>)}
    <line x1={left} x2={right} y1={bottom} y2={bottom} className="budget-axis-line" />
    <line x1={left} x2={right} y1={y(data.target)} y2={y(data.target)} className="budget-target-line" />
    <text x={right - 4} y={y(data.target) - 7} textAnchor="end" className="budget-target-label">{formatValue(data.target)} 年度目标</text>
    <path d={linePath(data.budgetCumulative, x, y)} className="budget-budget-line" />
    <path d={linePath(data.actualCumulative.slice(0, cutoff), x, y)} className="budget-actual-line" />
    {hasForecast && <path d={linePath(forecastValues, x, y, cutoff - 1)} className="budget-forecast-line" />}
    {data.budgetCumulative.map((value, index) => <circle key={`b-${index}`} cx={x(index)} cy={y(value)} r="3.5" className="budget-budget-dot"><title>{MONTHS[index]}累计预算：{formatValue(value)} {data.unit}</title></circle>)}
    {data.actualCumulative.slice(0, cutoff).map((value, index) => <circle key={`a-${index}`} cx={x(index)} cy={y(value)} r="4" className="budget-actual-dot"><title>{MONTHS[index]}累计实际：{formatValue(value)} {data.unit}</title></circle>)}
    {hasForecast && data.forecastCumulative.slice(cutoff).map((value, index) => <circle key={`f-${index}`} cx={x(index + cutoff)} cy={y(value)} r="4" className="budget-forecast-dot"><title>{MONTHS[index + cutoff]}累计预测：{formatValue(value)} {data.unit}</title></circle>)}
    {MONTHS.map((month, index) => <text key={month} x={x(index)} y={252} textAnchor="middle" className="budget-axis-text">{month}</text>)}
    <g className="budget-key-label"><text x={x(cutoff - 1) - 7} y={y(data.actualTotal) - 12} textAnchor="end">{formatValue(data.actualTotal)}</text></g>
    <g className="budget-key-label budget-blue"><text x={right - 3} y={y(data.budget) + 19} textAnchor="end">{formatValue(data.budget)}</text></g>
    {hasForecast && <g className="budget-key-label budget-orange"><text x={right - 5} y={y(data.forecastTotal) - 12} textAnchor="end">{formatValue(data.forecastTotal)}</text></g>}
  </svg>;
}

function DeviationChart({ items, total, unit }) {
  const width = 650, height = 212, left = 170, right = 620, top = 16, rowGap = 43;
  const maxAbs = Math.max(.4, ...items.map(([, value]) => Math.abs(value))) * 1.18;
  const zero = left + (right - left) * .28;
  const positiveWidth = right - zero;
  const negativeWidth = zero - left;
  return <svg className="budget-deviation-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="预算偏差来源横向条形图">
    <line x1={zero} x2={zero} y1={top - 5} y2={height - 22} className="budget-zero-line" />
    {items.map(([name, value], index) => {
      const y = top + index * rowGap;
      const barWidth = Math.abs(value) / maxAbs * (value >= 0 ? positiveWidth : negativeWidth);
      const barX = value >= 0 ? zero : zero - barWidth;
      return <g key={name}><text x={left - 16} y={y + 17} textAnchor="end" className="budget-bar-label">{name}</text><rect x={barX} y={y} width={barWidth} height="23" rx="2" className={value >= 0 ? 'budget-positive-bar' : 'budget-negative-bar'}><title>{name}：{value >= 0 ? '+' : ''}{value.toFixed(2)} {unit}</title></rect><text x={value >= 0 ? barX + barWidth + 8 : barX - 8} y={y + 17} textAnchor={value >= 0 ? 'start' : 'end'} className={value >= 0 ? 'budget-positive-text' : 'budget-negative-text'}>{value >= 0 ? '+' : ''}{value.toFixed(2)}</text></g>;
    })}
    <text x={zero} y={height - 3} textAnchor="middle" className="budget-axis-text">0</text>
    <title>合计偏差：{total >= 0 ? '+' : ''}{total.toFixed(2)} {unit}</title>
  </svg>;
}

function MonthlyChart({ data, cutoff }) {
  const indexes = [6, 7, 8, 9, 10, 11];
  const width = 650, height = 218, left = 48, right = 630, top = 20, bottom = 176;
  const max = Math.ceil(Math.max(...data.monthlyBudget, ...data.actual, ...data.forecastMonths) / 2) * 2 + 2;
  const groupWidth = (right - left) / indexes.length;
  const y = (value) => bottom - value / max * (bottom - top);
  const futureIndex = indexes.findIndex((index) => index >= cutoff);
  const predictionStart = futureIndex >= 0 ? left + futureIndex * groupWidth : right;
  return <svg className="budget-monthly-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="月度预算与实际对比柱状图">
    {futureIndex >= 0 && <><rect x={predictionStart} y={top} width={right - predictionStart} height={bottom - top} className={data.hasForecast ? 'budget-prediction-zone' : 'budget-pending-zone'} /><text x={(predictionStart + right) / 2} y={top + 14} textAnchor="middle" className={data.hasForecast ? 'budget-zone-label' : 'budget-pending-label'}>{data.hasForecast ? '预测区间' : '预测待补充'}</text></>}
    {[0, max / 2, max].map((tick) => <g key={tick}><line x1={left} x2={right} y1={y(tick)} y2={y(tick)} className="budget-grid-line" /><text x={left - 10} y={y(tick) + 4} textAnchor="end" className="budget-axis-text">{tick}</text></g>)}
    {indexes.map((monthIndex, index) => {
      const groupX = left + index * groupWidth + groupWidth / 2;
      const budget = data.monthlyBudget[monthIndex];
      const occurred = monthIndex < cutoff;
      const comparison = occurred ? data.actual[monthIndex] : data.hasForecast ? data.forecastMonths[monthIndex] : null;
      return <g key={monthIndex}><rect x={groupX - 26} y={y(budget)} width="21" height={bottom - y(budget)} rx="2" className="budget-month-budget"><title>{MONTHS[monthIndex]}预算：{budget.toFixed(2)} {data.unit}</title></rect>{comparison != null && <rect x={groupX + 5} y={y(comparison)} width="21" height={bottom - y(comparison)} rx="2" className={occurred ? 'budget-month-actual' : 'budget-month-forecast'}><title>{MONTHS[monthIndex]}{occurred ? '实际' : '预测'}：{comparison.toFixed(2)} {data.unit}</title></rect>}<text x={groupX} y={199} textAnchor="middle" className="budget-axis-text">{MONTHS[monthIndex]}</text></g>;
    })}
    <line x1={left} x2={right} y1={bottom} y2={bottom} className="budget-axis-line" />
  </svg>;
}

function BudgetSettingDialog({ data, mode, onClose, onSave }) {
  const [target, setTarget] = useState(data.target);
  const [budget, setBudget] = useState(data.budget);
  const [allocation, setAllocation] = useState('even');
  const submit = () => {
    const targetValue = Number(target), budgetValue = Number(budget);
    if (!(targetValue > 0) || !(budgetValue > 0)) return;
    onSave({ target: targetValue, budget: budgetValue, allocation });
  };
  return <div className="budget-dialog-mask" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className="budget-dialog" role="dialog" aria-modal="true" aria-label="设置年度预算"><div className="budget-dialog-head"><div><h3>设置预算</h3><p>仅维护园区年度参考值及必要的周期分配参数</p></div><button onClick={onClose}>×</button></div><label>指标对象<input value={mode === 'energy' ? '综合能耗' : '碳排放'} disabled /></label><div className="budget-dialog-row"><label>年度目标（{data.unit}）<input type="number" min="0" step="0.1" value={target} onChange={(event) => setTarget(event.target.value)} /></label><label>年度预算（{data.unit}）<input type="number" min="0" step="0.1" value={budget} onChange={(event) => setBudget(event.target.value)} /></label></div><label>周期分配<select value={allocation} onChange={(event) => setAllocation(event.target.value)}><option value="even">按月均匀分配</option><option value="current">沿用当前月度分配比例</option></select></label><div className="budget-dialog-note">预算用于园区运行研判和协调参考，不作为企业用能额度或考核要求。</div><div className="budget-dialog-actions"><button onClick={onClose}>取消</button><button className="primary" onClick={submit}>保存预算</button></div></div></div>;
}

export function ParkEnergyBudgetPage() {
  const [draft, setDraft] = useState({ year: '2026', cutoff: 9, scope: '园区整体' });
  const [filters, setFilters] = useState(draft);
  const [mode, setMode] = useState('energy');
  const [dimension, setDimension] = useState('enterprise');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [overrides, setOverrides] = useState({});

  const data = useMemo(() => {
    const base = BASE_DATA[mode];
    const yearFactor = filters.year === '2026' ? 1 : .95;
    const override = overrides[`${filters.year}-${mode}`] || {};
    const budget = override.budget ?? round(base.budget * yearFactor);
    const target = override.target ?? round(base.target * yearFactor);
    const originalBudget = Array(12).fill(round(base.budget * yearFactor / 12));
    const monthlyBudget = override.budget && override.allocation === 'current'
      ? originalBudget.map((value) => round(value / sum(originalBudget) * budget))
      : Array(12).fill(round(budget / 12));
    monthlyBudget[11] = round(budget - sum(monthlyBudget.slice(0, 11)));
    const actual = base.actual.map((value) => round(value * yearFactor));
    const forecastMonths = base.forecastMonths.map((value) => round(value * yearFactor));
    const cutoff = filters.cutoff;
    const actualCumulative = cumulative(actual);
    const budgetCumulative = cumulative(monthlyBudget);
    const actualTotal = round(sum(actual.slice(0, cutoff)));
    const periodBudget = round(sum(monthlyBudget.slice(0, cutoff)));
    const deviation = round(actualTotal - periodBudget);
    const hasForecast = cutoff >= 3;
    const forecastSeries = [...actual.slice(0, cutoff), ...forecastMonths.slice(cutoff)];
    const forecastCumulative = cumulative(forecastSeries);
    const forecastTotal = hasForecast ? round(sum(forecastSeries)) : null;
    const baseDeviation = sum(base.enterpriseDeviation.map(([, value]) => value));
    const scaleDeviation = (items) => {
      const scaled = items.map(([name, value]) => [name, round(value / baseDeviation * deviation)]);
      const subtotal = sum(scaled.slice(0, -1).map(([, value]) => value));
      scaled[scaled.length - 1][1] = round(deviation - subtotal);
      return scaled;
    };
    return { ...base, target, budget, monthlyBudget, actual, forecastMonths, actualCumulative, budgetCumulative, forecastCumulative, actualTotal, periodBudget, deviation, hasForecast, forecastTotal, enterpriseDeviation: scaleDeviation(base.enterpriseDeviation), energyDeviation: scaleDeviation(base.energyDeviation) };
  }, [filters, mode, overrides]);

  const forecastDifference = data.hasForecast ? round(data.forecastTotal - data.budget) : null;
  const targetDifference = data.hasForecast ? round(data.target - data.forecastTotal) : null;
  const deviationItems = dimension === 'enterprise' ? data.enterpriseDeviation : data.energyDeviation;

  const saveBudget = (values) => {
    setOverrides((current) => ({ ...current, [`${filters.year}-${mode}`]: values }));
    setSettingsOpen(false);
  };

  return <div className="park-budget-page">
    <header className="park-budget-head"><div><div className="park-budget-title-row"><h1>能耗与碳排放预算</h1><span>示例数据</span></div><p>聚焦年度预算、累计实际、全年预测及偏差来源</p></div><button className="park-budget-setting" onClick={() => setSettingsOpen(true)}>设置预算</button></header>

    <section className="park-budget-filters" aria-label="预算分析筛选">
      <label>年度<select value={draft.year} onChange={(event) => setDraft({ ...draft, year: event.target.value })}><option value="2026">2026年</option><option value="2025">2025年</option></select></label>
      <label>截至月份<select value={draft.cutoff} onChange={(event) => setDraft({ ...draft, cutoff: Number(event.target.value) })}>{MONTHS.slice(0, 9).map((month, index) => <option value={index + 1} key={month}>截至{month}</option>)}</select></label>
      <label>统计范围<select value={draft.scope} onChange={(event) => setDraft({ ...draft, scope: event.target.value })}><option>园区整体</option></select></label>
      <div className="park-budget-mode"><button className={mode === 'energy' ? 'active' : ''} onClick={() => setMode('energy')}>综合能耗</button><button className={mode === 'carbon' ? 'active' : ''} onClick={() => setMode('carbon')}>碳排放</button></div>
      <div className="park-budget-filter-actions"><button className="primary" onClick={() => setFilters(draft)}>查询</button><button onClick={() => buildCsv(data, filters.year, filters.cutoff, mode)}>⇩&nbsp; 导出</button></div>
    </section>

    <section className="park-budget-metrics">
      <article className="target"><div className="park-budget-metric-icon">◎</div><div><span>年度目标</span><strong>≤ {formatValue(data.target)} <small>{data.unit}</small></strong><p>园区年度控制参考目标</p></div></article>
      <article className="budget"><div className="park-budget-metric-icon">▤</div><div><span>年度预算</span><strong>{formatValue(data.budget)} <small>{data.unit}</small></strong><p>园区预算参考值</p></div></article>
      <article className="actual"><div className="park-budget-metric-icon">▥</div><div><span>累计实际</span><strong>{formatValue(data.actualTotal)} <small>{data.unit}</small></strong><p>同期预算 {formatValue(data.periodBudget)} {data.unit}</p></div></article>
      <article className="forecast"><div className="park-budget-metric-icon">⌁</div><div><span>全年预测</span>{data.hasForecast ? <><strong>{formatValue(data.forecastTotal)} <small>{data.unit}</small></strong><p className={forecastDifference > 0 ? 'over' : 'under'}>预计{forecastDifference > 0 ? '超出' : '低于'}预算 {formatValue(Math.abs(forecastDifference))} {data.unit}；{targetDifference >= 0 ? '低于' : '超出'}目标 {formatValue(Math.abs(targetDifference))}</p></> : <><strong className="pending">待补充</strong><p>累计数据不足3个月，不生成预测</p></>}</div></article>
    </section>

    <section className="park-budget-card park-budget-trend-card">
      <div className="park-budget-card-head"><div><h2>全年预算与实际趋势</h2><p>截至{filters.cutoff}月实际较同期预算{data.deviation >= 0 ? '增加' : '减少'} {formatValue(Math.abs(data.deviation))} {data.unit}；{data.hasForecast ? `全年预测${targetDifference >= 0 ? '低于' : '超出'}年度目标` : '预测待补充'}。</p></div><div className="park-budget-legend"><span><i className="blue" />预算</span><span><i className="teal" />实际</span><span><i className="orange dashed" />预测</span><span><i className="gray dashed" />年度目标</span></div></div>
      <div className="park-budget-trend-chart"><span className="park-budget-y-unit">{data.unit}</span><TrendChart data={data} cutoff={filters.cutoff} hasForecast={data.hasForecast} /></div>
      <div className="park-budget-chart-foot">预测依据：累计实际 + 剩余月份月度预算与季节系数；累计数据不足3个月时显示“待补充”。</div>
    </section>

    <section className="park-budget-bottom-grid">
      <article className="park-budget-card park-budget-deviation-card"><div className="park-budget-card-head"><div><h2>偏差来自哪里</h2><p>正值表示实际高于同期预算，负值表示低于同期预算</p></div><div className="park-budget-deviation-total"><span>累计偏差</span><strong className={data.deviation >= 0 ? 'positive' : 'negative'}>{data.deviation >= 0 ? '+' : ''}{formatValue(data.deviation)} <small>{data.unit}</small></strong></div></div><div className="park-budget-tabs"><button className={dimension === 'enterprise' ? 'active' : ''} onClick={() => setDimension('enterprise')}>企业</button><button className={dimension === 'energy' ? 'active' : ''} onClick={() => setDimension('energy')}>能源品种</button></div><DeviationChart items={deviationItems} total={data.deviation} unit={data.unit} /></article>
      <article className="park-budget-card park-budget-month-card"><div className="park-budget-card-head"><div><h2>月度预算与实际</h2><p>已发生月份展示实际，未来月份仅展示预测</p></div><div className="park-budget-legend"><span><i className="blue block" />预算</span><span><i className="teal block" />实际</span><span><i className="orange block" />预测</span></div></div><MonthlyChart data={data} cutoff={filters.cutoff} /></article>
    </section>

    <footer className="park-budget-foot">园区预算用于运行研判和协调参考，不表达企业用能额度分配、强制整改或考核要求。</footer>
    {settingsOpen && <BudgetSettingDialog data={data} mode={mode} onClose={() => setSettingsOpen(false)} onSave={saveBudget} />}
  </div>;
}

export default ParkEnergyBudgetPage;
