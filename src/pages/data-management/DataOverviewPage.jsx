import { useMemo, useState } from 'react'
import { PageHeader } from '../../components/PageHeader.jsx'
import { DataPanel } from '../../components/DataPanel.jsx'
import { StatusTag } from '../../components/StatusTag.jsx'
import { Tabs } from '../../components/Tabs.jsx'
import { useSharedData } from '../../mock/sharedStore.js'
import { useDataManagement } from '../../mock/DataManagementContext.jsx'
import { dataItemDefinitions, buildDataOverview } from '../../mock/dataManagementStore.js'
import { Table } from './shared.jsx'

const domains = [['archive', '企业档案'], ['energy', '能源与设施'], ['operation', '能碳与运营数据'], ['special', '零碳专项数据']]
const domainOf = issue => issue.objectType === 'ENERGY_FLOW' ? 'energy' : dataItemDefinitions.find(item => item.dataItemCode === issue.dataItemCode)?.dataDomain || 'energy'
const problemStatus = issue => issue.status === '已转任务' ? '处理中' : issue.status
const periodLabel = period => String(period || '').replace('-', '年') + (String(period || '').includes('-') ? '月' : '')

export function DataOverviewPage({ enterpriseRows, navigate }) {
  const { issues, records } = useDataManagement()
  const { tasks } = useSharedData()
  const [year, setYear] = useState('2026'), [month, setMonth] = useState('08'), [scope, setScope] = useState('key'), [preparationView, setPreparationView] = useState('module')
  const managed = useMemo(() => enterpriseRows.filter(item => item.managedStatus === '已纳管' && (scope === 'all' || item.isKeyEnterprise)), [enterpriseRows, scope])
  const scopedIssues = useMemo(() => issues.filter(issue => issue.status !== '已解决' && (!issue.enterpriseId || managed.some(item => item.enterpriseId === issue.enterpriseId))), [issues, managed])
  const overview = useMemo(() => buildDataOverview(records, issues, enterpriseRows, year, month, scope), [records, issues, enterpriseRows, year, month, scope])
  const taskForIssue = issue => tasks.find(task => (task.sourceIssueIds || []).includes(issue.issueId))
  const go = (path, enterprise) => navigate(`${path}?${enterprise ? `enterpriseId=${enterprise.enterpriseId}&` : ''}year=${year}&month=${month}`)
  const actionFor = issue => {
    const task = taskForIssue(issue)
    if (issue.responsibleParty === 'ENTERPRISE') return task ? { label: '查看任务', run: () => navigate(`/reporting-task-monitoring?taskId=${task.taskId}`) } : { label: '发起填报任务', run: () => navigate(`/reporting-task-monitoring?issueId=${issue.issueId}`) }
    return { label: '去处理', run: () => go(issue.objectType === 'ENERGY_FLOW' ? '/energy-facilities' : '/business-data', managed.find(item => item.enterpriseId === issue.enterpriseId)) }
  }
  const moduleRows = domains.map(([domain, name]) => {
    const domainIssues = scopedIssues.filter(issue => domainOf(issue) === domain)
    const domainRecords = records.filter(record => record.dataDomain === domain && managed.some(item => item.enterpriseId === record.enterpriseId))
    const companies = new Set(domainRecords.map(record => record.enterpriseId)).size
    const indicators = new Set(domainIssues.flatMap(issue => issue.relatedIndicator || []))
    return { key: domain, cells: [name, <StatusTag tone={domainIssues.length ? 'warn' : 'ok'}>{domainIssues.length ? '待完善' : '已具备'}</StatusTag>, `${companies}/${managed.length}家`, domainIssues.length, domainIssues.filter(issue => ['待确认', '异常', '来源冲突'].includes(issue.issueType)).length, `${indicators.size}项`, <button className="op-btn" onClick={() => go(domain === 'energy' ? '/energy-facilities' : domain === 'special' ? '/zero-carbon-data' : '/business-data')}>查看</button>] }
  })
  const enterpriseRowsView = managed.map(enterprise => {
    const own = scopedIssues.filter(issue => issue.enterpriseId === enterprise.enterpriseId)
    const cell = domain => own.some(issue => domainOf(issue) === domain) ? '待处理' : '已具备'
    const affected = new Set(own.flatMap(issue => issue.relatedIndicator || []))
    return { key: enterprise.enterpriseId, cells: [enterprise.name, <StatusTag tone={cell('archive') === '已具备' ? 'ok' : 'warn'}>{cell('archive')}</StatusTag>, <StatusTag tone={cell('energy') === '已具备' ? 'ok' : 'warn'}>{cell('energy')}</StatusTag>, <StatusTag tone={cell('operation') === '已具备' ? 'ok' : 'warn'}>{cell('operation')}</StatusTag>, <StatusTag tone={cell('special') === '已具备' ? 'ok' : 'warn'}>{cell('special')}</StatusTag>, own.length ? '待完善' : '已就绪', own.length, `${affected.size}项`, <button className="op-btn" onClick={() => go('/enterprise-archive', enterprise)}>查看数据</button>] }
  })
  const readyCount = managed.filter(enterprise => !scopedIssues.some(issue => issue.enterpriseId === enterprise.enterpriseId)).length
  const indicators = [...new Set(scopedIssues.flatMap(issue => issue.relatedIndicator || []))]
  const iocs = [...new Set(scopedIssues.flatMap(issue => issue.relatedIOC || []))]
  return <div className="content dm-page"><PageHeader title="数据总览" subtitle="按当前年度、截止月份和企业范围汇总基础数据准备情况，定位问题并发起处理。" />
    <div className="filters"><span className="label">年度</span><select value={year} onChange={event => setYear(event.target.value)}><option>2026</option><option>2025</option></select><span className="label">截至月份</span><select value={month} onChange={event => setMonth(event.target.value)}>{['01','02','03','04','05','06','07','08','09','10','11','12'].map(item => <option key={item}>{item}</option>)}</select><span className="label">企业范围</span><select value={scope} onChange={event => setScope(event.target.value)}><option value="key">重点企业</option><option value="all">全部企业</option></select></div>
    <div className="dm-summary-grid"><div><span>本期覆盖企业</span><b>{managed.length}<small>家</small></b><em>当前筛选范围内应维护数据的企业；纳管企业共 {enterpriseRows.filter(item => item.managedStatus === '已纳管').length} 家</em></div><div><span>数据已就绪企业</span><b>{readyCount}/{managed.length}<small>家</small></b><em>当前期间与范围内无未解决数据问题</em></div><div className="warn"><span>待处理事项</span><b>{overview.issueCount}<small>项</small></b><em>问题状态与填报任务状态分开统计</em></div><div><span>零碳指标可计算</span><b>{Math.max(0, 12 - overview.affectedIndicatorCount)}/12<small>项</small></b><em>按当前 Mock 问题影响关系计算</em></div></div>
    <DataPanel title="数据准备情况" description={preparationView === 'module' ? '按数据模块查看覆盖、缺失、异常和影响指标。' : '按企业查看各数据模块准备状态，定位影响数据准备的企业。'}><Tabs className="dm-data-preparation-tabs" tabs={[{ value: 'module', label: '按数据模块' }, { value: 'enterprise', label: '按企业' }]} active={preparationView} onChange={setPreparationView} />{preparationView === 'module' ? <Table headers={['数据模块','当前状态','覆盖企业','缺失数据项','异常/待确认','影响指标','操作']} rows={moduleRows} /> : <Table className="enterprise-preparation-table" headers={['企业','企业档案','能源与设施','能碳与运营数据','零碳专项数据','整体状态','待处理事项','影响指标','操作']} rows={enterpriseRowsView} />}</DataPanel>
    <DataPanel title="待处理事项" description="根据责任主体进入园区维护或企业填报任务；问题创建任务后可直接查看关联任务。" actions={<button className="btn" onClick={() => navigate(`/data-issues?year=${year}&month=${month}`)}>查看全部</button>}><Table headers={['问题类型','企业/对象','期间','影响指标','问题状态','操作']} rows={scopedIssues.slice(0, 5).map(issue => { const enterprise = managed.find(row => row.enterpriseId === issue.enterpriseId); const action = actionFor(issue); return { key: issue.issueId, cells: [issue.issueType, enterprise?.name || '系统', periodLabel(issue.period), (issue.relatedIndicator || []).join('、') || '—', <StatusTag tone={problemStatus(issue) === '已解决' ? 'ok' : 'warn'}>{problemStatus(issue)}</StatusTag>, <button className="op-btn" onClick={action.run}>{action.label}</button>] } })} /></DataPanel>
    <DataPanel title="数据应用影响" description="当前问题关联的指标影响范围来自 Mock 关系，不代表正式计算结果。"><div className="dm-application-impact"><div><b>受影响零碳指标</b><StatusTag tone={indicators.length ? 'warn' : 'ok'}>{indicators.length}项</StatusTag><span>{indicators.join('、') || '当前无关联问题'}</span></div><div><b>受影响核心视图</b><StatusTag tone={iocs.length ? 'warn' : 'ok'}>{iocs.length}个</StatusTag><span>{iocs.join('、') || '当前无关联问题'}</span></div></div></DataPanel>
  </div>
}
