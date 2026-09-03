import { useMemo, useState } from 'react'
import { PageHeader } from '../../components/PageHeader.jsx'
import { DataPanel } from '../../components/DataPanel.jsx'
import { StatusTag } from '../../components/StatusTag.jsx'
import { Tabs } from '../../components/Tabs.jsx'
import { Table } from './shared.jsx'

const modules = [
  { name: '企业档案', coverage: '6家重点企业', missing: 2, review: 0, status: '已具备', path: '/enterprise-archive' },
  { name: '能源与设施', coverage: '6家重点企业', missing: 4, review: 1, status: '待完善', path: '/energy-facilities' },
  { name: '能碳与运营数据', coverage: '6家重点企业', missing: 6, review: 2, status: '待完善', path: '/business-data' },
  { name: '零碳专项数据', coverage: '5家重点企业', missing: 7, review: 1, status: '待完善', path: '/zero-carbon-data' },
]
const readiness = {
  '晶澳科技': { archive: '完整', energy: '完整', business: '完整', special: '待确认', overall: '待完善', issues: 1 },
  '曲靖隆基': { archive: '完整', energy: '完整', business: '待补充', special: '待补充', overall: '待完善', issues: 2 },
  '阳光新能源': { archive: '完整', energy: '完整', business: '完整', special: '不适用', overall: '已就绪', issues: 0 },
  '亿纬锂能': { archive: '完整', energy: '完整', business: '完整', special: '完整', overall: '已就绪', issues: 0 },
  '德方纳米': { archive: '完整', energy: '完整', business: '完整', special: '待补充', overall: '待完善', issues: 1 },
  '驰宏锌锗': { archive: '完整', energy: '待确认', business: '完整', special: '完整', overall: '待完善', issues: 1 },
}
const issueSeed = [
  { enterprise: '曲靖隆基', type: '数据待确认', module: '能碳与运营数据', description: '2026年8月购电量与现有记录不一致，待企业确认。', impact: '影响能源流向及碳排放计算', status: '待确认', path: '/business-data' },
  { enterprise: '曲靖隆基', type: '数据缺失', module: '零碳专项数据', description: '产品能效相关基础数据尚未补充。', impact: '影响零碳指标计算', status: '待补充', path: '/zero-carbon-data' },
  { enterprise: '德方纳米', type: '数据缺失', module: '零碳专项数据', description: '工业固废利用相关数据尚未补充。', impact: '影响零碳指标计算', status: '待补充', path: '/zero-carbon-data' },
  { enterprise: '驰宏锌锗', type: '配置不完整', module: '能源与设施', description: '能源流向关系尚未完整配置。', impact: '影响能源流向态势', status: '待处理', path: '/energy-facilities' },
  { enterprise: '晶澳科技', type: '数据待确认', module: '零碳专项数据', description: '绿色建筑认定材料待确认。', impact: '影响绿色建筑相关指标计算', status: '待确认', path: '/zero-carbon-data' },
]
const applications = [
  { name: '零碳园区总览', status: '部分数据待完善', reason: '2项零碳专项数据待补充或确认', path: '/zero-carbon-data' },
  { name: '能源流向态势', status: '部分数据待完善', reason: '1家企业能源流向关系尚未完整配置', path: '/energy-facilities' },
  { name: '碳排放与降碳态势', status: '正常', reason: '—', path: '/business-data' },
]
const tone = status => ['完整', '已具备', '已就绪', '正常'].includes(status) ? 'ok' : ['待补充', '待确认', '待处理', '待完善', '部分数据待完善'].includes(status) ? 'warn' : 'gray'
const isReady = state => ['archive', 'energy', 'business', 'special'].every(key => ['完整', '不适用'].includes(state[key])) && state.issues === 0

export function DataOverviewPage({ enterpriseRows, navigate }) {
  const [year, setYear] = useState('2026'), [month, setMonth] = useState('08'), [scope, setScope] = useState('key'), [preparationView, setPreparationView] = useState('module')
  const focusEnterprises = useMemo(() => enterpriseRows.filter(item => item.managedStatus === '已纳管'), [enterpriseRows])
  const untrackedEnterprises = useMemo(() => Array.from({ length: Math.max(0, 24 - focusEnterprises.length) }, (_, index) => ({ enterpriseId: `untracked-${index + 1}`, name: `暂未建立数据档案企业 ${String(index + 1).padStart(2, '0')}`, untracked: true })), [focusEnterprises.length])
  const managed = scope === 'key' ? focusEnterprises : [...focusEnterprises, ...untrackedEnterprises]
  const activeIssues = issueSeed.filter(item => managed.some(enterprise => enterprise.name === item.enterprise))
  const normalEnterprises = managed.filter(enterprise => readiness[enterprise.name] && isReady(readiness[enterprise.name])).length
  const go = (path, enterprise) => navigate(`${path}?${enterprise ? `enterpriseId=${enterprise.enterpriseId}&` : ''}year=${year}&month=${month}`)
  const moduleRows = modules.map(item => ({ key: item.name, cells: [item.name, <StatusTag tone={tone(scope === 'key' ? item.status : '待完善')}>{scope === 'key' ? item.status : '待完善'}</StatusTag>, scope === 'key' ? item.coverage : '6家已维护，18家待纳入', scope === 'key' ? item.missing : '待统计', scope === 'key' ? item.review : '待统计', <button className="op-btn" onClick={() => go(item.path)}>查看</button>] }))
  const enterpriseRowsView = managed.map(enterprise => {
    const state = readiness[enterprise.name] || { archive: '暂无数据', energy: '暂无数据', business: '暂无数据', special: '暂无数据', overall: '待完善', issues: 0 }
    return { key: enterprise.enterpriseId, cells: [enterprise.name, <StatusTag tone={tone(state.archive)}>{state.archive}</StatusTag>, <StatusTag tone={tone(state.energy)}>{state.energy}</StatusTag>, <StatusTag tone={tone(state.business)}>{state.business}</StatusTag>, <StatusTag tone={tone(state.special)}>{state.special}</StatusTag>, <StatusTag tone={tone(state.overall)}>{state.overall}</StatusTag>, state.issues, enterprise.untracked ? '—' : <button className="op-btn" onClick={() => go('/enterprise-archive', enterprise)}>查看数据</button>] }
  })
  return <div className="content dm-page"><PageHeader title="数据总览" subtitle="汇总展示四类数据准备情况，快速定位需要补充、确认和处理的数据。" />
    <div className="filters"><span className="label">年度</span><select value={year} onChange={event => setYear(event.target.value)}><option>2026</option><option>2025</option></select><span className="label">截至月份</span><select value={month} onChange={event => setMonth(event.target.value)}>{['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map(item => <option key={item}>{item}</option>)}</select><span className="label">企业范围</span><select value={scope} onChange={event => setScope(event.target.value)}><option value="key">重点企业</option><option value="all">全部企业</option></select></div>
    <div className="dm-summary-grid"><div><span>入驻企业</span><b>24<small>家</small></b><em>一期范围企业总数</em></div><div><span>本期重点企业</span><b>{focusEnterprises.length}<small>家</small></b><em>当前数据维护范围</em></div><div><span>数据已就绪企业</span><b>{normalEnterprises}/{managed.length}<small>家</small></b><em>当前适用数据均已具备</em></div><div className="warn"><span>待处理事项</span><b>{activeIssues.length}<small>项</small></b></div><div><span>零碳指标可计算</span><b>10/12<small>项</small></b><em>10项指标已具备计算所需基础数据</em></div></div>
    <DataPanel title="数据准备情况" description={preparationView === 'module' ? '按四类数据管理模块查看当前数据准备状态和待处理情况。' : '一期优先展示本期重点企业，便于查看各类数据的处理情况。'}><Tabs className="dm-data-preparation-tabs" tabs={[{ value: 'module', label: '按数据模块' }, { value: 'enterprise', label: '按企业' }]} active={preparationView} onChange={setPreparationView} />{preparationView === 'module' ? <Table headers={['数据模块', '当前状态', '已维护对象', '缺失数据项', '待确认/异常事项', '操作']} rows={moduleRows} /> : <Table className="enterprise-preparation-table" headers={['企业', '企业档案', '能源与设施', '能碳与运营数据', '零碳专项数据', '整体状态', '待处理事项', '操作']} rows={enterpriseRowsView} />}</DataPanel>
    <DataPanel title="待处理事项" description="问题直接下钻至对应的数据维护页面处理。" actions={<button className="btn" onClick={() => navigate(`/data-issues?year=${year}&month=${month}`)}>查看全部</button>}><Table headers={['问题类型', '企业/对象', '所属数据模块', '问题说明', '影响', '状态', '操作']} rows={activeIssues.slice(0, 5).map(item => { const enterprise = managed.find(row => row.name === item.enterprise); const action = item.status === '待补充' ? '去补充' : item.status === '待确认' ? '去确认' : '去处理'; return { key: `${item.enterprise}-${item.module}`, cells: [item.type, item.enterprise, item.module, item.description, item.impact, <StatusTag tone={tone(item.status)}>{item.status}</StatusTag>, <button className="op-btn" onClick={() => go(item.path, enterprise)}>{action}</button>] } })} /></DataPanel>
    <DataPanel title="数据应用影响" description="数据问题对园区业务应用的影响情况。"><div className="dm-application-impact">{applications.map(item => <div key={item.name}><b>{item.name}</b><StatusTag tone={tone(item.status)}>{item.status}</StatusTag><span>{item.reason}</span></div>)}</div></DataPanel>
  </div>
}
