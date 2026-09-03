import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { PageHeader } from '../../components/PageHeader.jsx'
import { DataPanel } from '../../components/DataPanel.jsx'
import { Modal } from '../../components/Modal.jsx'
import { Tabs } from '../../components/Tabs.jsx'
import { dataItemDefinitions, dataItemName, domainLabels, recordMatchesPeriod, sourceTypeOptions } from '../../mock/dataManagementStore.js'
import { businessTabs, FormField, IssueModal, Table } from './shared.jsx'

const energyColumns = [
  ['ENERGY_ELECTRICITY', '电力消费（万kWh）'],
  ['ENERGY_NATURAL_GAS', '天然气消费（万Nm³）'],
  ['ENERGY_HEAT', '热力消费（万GJ）'],
  ['ENERGY_TOTAL', '综合能源消费（万tce）'],
]
const specialColumns = [
  ['SPECIAL_ROOF_AVAILABLE_AREA', '可利用屋顶面积（m²）'],
  ['SPECIAL_ROOF_PV_AREA', '光伏覆盖面积（m²）'],
  ['SPECIAL_TOTAL_VEHICLES', '交通工具总数（辆）'],
  ['SPECIAL_NEW_ENERGY_VEHICLES', '新能源交通工具数（辆）'],
  ['SPECIAL_ENERGY_DIAGNOSIS_COMPLETED', '能效诊断'],
]

const numberText = value => Number.isInteger(Number(value)) ? String(Number(value)) : Number(value).toFixed(2).replace(/\.00$/, '')
const recordValue = (items, code, tab) => {
  const matches = items.filter(item => item.dataItemCode === code)
  if (!matches.length) return null
  if (tab === 'special') return matches[matches.length - 1].value
  return matches.reduce((sum, item) => sum + Number(item.value || 0), 0)
}
const latestPeriod = items => items.reduce((latest, item) => String(item.period || '') > String(latest || '') ? item.period : latest, '')
const productSummary = items => { const products = new Map(); items.filter(item => item.dataItemCode === 'OP_PRODUCT_OUTPUT').forEach(item => products.set(item.productId || item.productName, item)); const list = [...products.values()]; return list.length === 1 ? `${list[0].value} ${list[0].unit}` : list.length > 1 ? `查看明细（${list.length}类产品）` : '—' }

function buildCompanies(records, enterpriseRows, tab, year, month, query, enterpriseId) {
  const scoped = records.filter(item => item.dataDomain === tab && recordMatchesPeriod(item, year, month) && (!enterpriseId || item.enterpriseId === enterpriseId))
  const groups = new Map()
  scoped.forEach(item => { const group = groups.get(item.enterpriseId) || { enterpriseId: item.enterpriseId, records: [] }; group.records.push(item); groups.set(item.enterpriseId, group) })
  return [...groups.values()].map(group => ({ ...group, name: enterpriseRows.find(item => item.enterpriseId === group.enterpriseId)?.name || '—', updatedTo: latestPeriod(group.records) })).filter(group => !query || `${group.name}${group.records.map(item => dataItemName(item.dataItemCode)).join('')}`.includes(query)).sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
}

function DetailModal({ company, tab, onClose }) {
  if (!company) return null
  const items = company.records
  return <Modal open title={`${company.name}业务数据详情`} onClose={onClose} className="detail-modal"><div className="modal-body"><div className="dm-detail-grid"><div><label>企业</label><b>{company.name}</b></div><div><label>数据年度</label><b>{company.updatedTo?.length === 4 ? company.updatedTo : String(company.updatedTo || '').slice(0, 4)}</b></div><div><label>更新至</label><b>{company.updatedTo || '—'}</b></div></div><div className="section"><h3>月度明细</h3><Table headers={['数据项', '期间', '数据值', '单位', '数据来源', '最近更新时间']} rows={items.sort((a, b) => String(a.period).localeCompare(String(b.period))).map(item => ({ key: item.recordId, cells: [dataItemName(item.dataItemCode), item.period, numberText(item.value), item.unit, item.sourceType || '—', item.updatedAt || '—'] }))} /></div></div><div className="modal-foot"><button className="btn" onClick={onClose}>关闭</button></div></Modal>
}

export function BusinessDataPage({ enterpriseRows, records, setRecords, issues, navigate, enterpriseMode = false, currentEnterpriseId }) {
  const location = useLocation(), params = new URLSearchParams(location.search)
  const [tab, setTab] = useState(params.get('tab') || 'energy'), [year, setYear] = useState(params.get('year') || '2026'), [month, setMonth] = useState(params.get('month') || '08'), [enterpriseId, setEnterpriseId] = useState(enterpriseMode ? currentEnterpriseId : (params.get('enterpriseId') || '')), [query, setQuery] = useState(''), [detail, setDetail] = useState(null), [issueDetail, setIssueDetail] = useState(null), [editing, setEditing] = useState(null), [importOpen, setImportOpen] = useState(false), [notice, setNotice] = useState('')
  useEffect(() => { if (params.get('tab')) setTab(params.get('tab')); if (params.get('year')) setYear(params.get('year')); if (params.get('month')) setMonth(params.get('month')); if (params.get('enterpriseId')) setEnterpriseId(params.get('enterpriseId')); const issueId = params.get('issueId'); if (issueId) setIssueDetail(issues.find(item => item.issueId === issueId) || null) }, [location.search, issues])
  const companies = buildCompanies(records, enterpriseRows, tab, year, month, query, enterpriseId)
  const saveRecord = event => { event.preventDefault(); const form = new FormData(event.currentTarget), definition = dataItemDefinitions.find(item => item.dataItemCode === form.get('dataItemCode')), stamp = Date.now(); const next = { recordId: `bdr-${stamp}`, objectType: 'ENTERPRISE', objectId: form.get('enterpriseId'), enterpriseId: form.get('enterpriseId'), dataDomain: tab, dataItemCode: form.get('dataItemCode'), period: form.get('period'), value: Number(form.get('value')), unit: definition?.unit || '', sourceType: form.get('sourceType'), sourceRecordId: `manual-${stamp}`, sourceRecordIds: [], evidence: form.get('evidence') || '园区维护记录', dataStatus: '草稿', qualityStatus: '待确认', createdAt: '刚刚', updatedAt: '刚刚', version: 1, history: [] }; setRecords(previous => [next, ...previous]); setEditing(null); setNotice('业务数据已保存。') }
  const baseHeaders = tab === 'energy' ? ['企业', ...energyColumns.map(([, label]) => label)] : tab === 'operation' ? ['企业', '工业增加值（万元）', '主要产品', '产品产量'] : tab === 'carbon' ? ['企业', '范围一排放（万tCO₂e）', '范围二排放（万tCO₂e）', '碳排放总量（万tCO₂e）'] : ['企业', ...specialColumns.map(([, label]) => label)]
  const headers = enterpriseMode ? [...baseHeaders, '数据来源', '更新时间', '操作'] : [...baseHeaders, '更新至', '操作']
  const sourceSummary = items => [...new Set(items.map(item => item.sourceType).filter(Boolean))].join('、') || '—'
  const updateSummary = items => items.map(item => item.updatedAt).filter(Boolean).sort().at(-1) || '—'
  const rowCells = company => { const items = company.records, periodText = tab === 'energy' ? company.updatedTo : (company.updatedTo?.length === 4 ? company.updatedTo : String(company.updatedTo || '').slice(0, 4)), tail = [enterpriseMode ? sourceSummary(items) : periodText, ...(enterpriseMode ? [updateSummary(items)] : []), <button className="op-btn" onClick={() => setDetail(company)}>查看</button>]; if (tab === 'energy') return [company.name, ...energyColumns.map(([code]) => { const value = recordValue(items, code, tab); return value == null ? '—' : numberText(value) }), ...tail]; if (tab === 'operation') { const value = recordValue(items, 'OP_INDUSTRIAL_VALUE', tab), products = [...new Map(items.filter(item => item.dataItemCode === 'OP_PRODUCT_OUTPUT').map(item => [item.productId || item.productName, item])).values()]; return [company.name, value == null ? '—' : numberText(value), products.length ? products.length === 1 ? products[0].productName : `${products[0].productName}等${products.length}类产品` : '—', productSummary(items), ...tail] } if (tab === 'carbon') { const scope1 = recordValue(items, 'CARBON_SCOPE1', tab), scope2 = recordValue(items, 'CARBON_SCOPE2', tab); return [company.name, scope1 == null ? '—' : numberText(scope1), scope2 == null ? '—' : numberText(scope2), scope1 == null && scope2 == null ? '—' : numberText((scope1 || 0) + (scope2 || 0)), ...tail] } return [company.name, ...specialColumns.map(([code]) => { const value = recordValue(items, code, tab); if (code === 'SPECIAL_ENERGY_DIAGNOSIS_COMPLETED') return value == null ? '—' : Number(value) > 0 ? '已完成' : '未完成'; return value == null ? '—' : numberText(value) }), ...tail] }
  return <div className="content dm-page"><PageHeader title={enterpriseMode ? '数据明细' : '能碳与运营数据'} subtitle={enterpriseMode ? '查看本企业年度业务数据汇总及月度明细。' : '按企业汇总展示当前年度截至所选月份的主要能源、运营及碳排放数据。'} actions={!enterpriseMode && <><button className="btn" onClick={() => setImportOpen(true)}>批量导入</button><button className="btn primary" onClick={() => setEditing({ kind: 'new' })}>新增数据</button></>}/>{notice && <div className="notice success">{notice}</div>}<Tabs tabs={businessTabs} active={tab} onChange={setTab}/><div className="filters dm-tab-filters"><span className="label">年度</span><select value={year} onChange={e => setYear(e.target.value)}><option>2026</option><option>2025</option></select><span className="label">截至月份</span><select value={month} onChange={e => setMonth(e.target.value)}>{['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map(item => <option key={item}>{item}</option>)}</select>{!enterpriseMode && <><span className="label">企业</span><select value={enterpriseId} onChange={e => setEnterpriseId(e.target.value)}><option value="">全部企业</option>{enterpriseRows.map(item => <option key={item.enterpriseId} value={item.enterpriseId}>{item.name}</option>)}</select></>}<span className="filter-spacer"/><input className="search-input" value={query} onChange={e => setQuery(e.target.value)} placeholder="搜索企业或数据项" /></div><DataPanel title={domainLabels[tab]} description="主列表按企业汇总展示，月度明细、数据来源和更新时间请点击查看。"><Table headers={headers} rows={companies.map(company => ({ key: company.enterpriseId, cells: rowCells(company) }))} /></DataPanel><DetailModal company={detail} tab={tab} onClose={() => setDetail(null)} /><IssueModal issue={issueDetail} onClose={() => setIssueDetail(null)} navigate={navigate} taskPath={enterpriseMode ? '/enterprise-data-reporting' : '/reporting-task-monitoring'} taskLabel={enterpriseMode ? '去处理填报任务' : '创建填报任务'} /><Modal open={!!editing} title="新增能碳与运营数据" onClose={() => setEditing(null)} className="detail-modal"><form onSubmit={saveRecord}><div className="modal-body"><div className="dm-form-grid"><FormField label="企业"><select name="enterpriseId" defaultValue={enterpriseId || enterpriseRows[0]?.enterpriseId}>{enterpriseRows.map(item => <option key={item.enterpriseId} value={item.enterpriseId}>{item.name}</option>)}</select></FormField><FormField label="数据项"><select name="dataItemCode" defaultValue={dataItemDefinitions.find(item => item.dataDomain === tab)?.dataItemCode}>{dataItemDefinitions.filter(item => item.dataDomain === tab).map(item => <option key={item.dataItemCode} value={item.dataItemCode}>{item.name}</option>)}</select></FormField><FormField label="期间"><input name="period" defaultValue={`${year}-${month}`} required /></FormField><FormField label="数值"><input name="value" type="number" step="any" required /></FormField><FormField label="数据来源"><select name="sourceType" defaultValue="园区维护">{sourceTypeOptions.filter(item => item !== '系统计算').map(item => <option key={item}>{item}</option>)}</select></FormField><FormField label="凭证/来源说明" wide><input name="evidence" placeholder="文件、台账或来源记录" /></FormField></div></div><div className="modal-foot"><button type="button" className="btn" onClick={() => setEditing(null)}>取消</button><button className="btn primary">保存</button></div></form></Modal><Modal open={importOpen} title="批量导入能碳与运营数据" onClose={() => setImportOpen(false)}><div className="modal-body"><div className="import-drop">选择标准模板文件<br /><small>系统将校验企业、数据项、单位、重复记录和基础格式。</small></div></div><div className="modal-foot"><button className="btn" onClick={() => setImportOpen(false)}>取消</button><button className="btn primary" onClick={() => { setImportOpen(false); setNotice('导入校验完成：演示数据未实际写入。') }}>执行校验</button></div></Modal></div>
}
