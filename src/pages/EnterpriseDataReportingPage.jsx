import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader.jsx'
import { Tabs } from '../components/Tabs.jsx'
import { MetricStrip } from '../components/MetricStrip.jsx'
import { DataPanel } from '../components/DataPanel.jsx'
import { StatusTag } from '../components/StatusTag.jsx'
import { Modal } from '../components/Modal.jsx'
import { enterprises, useSharedData } from '../mock/sharedStore.js'

const categoryOrder=['企业基础信息','能源与碳排数据','资源循环与绿色制造','零碳专项建设']
const moduleMeta={
  '企业基础信息':{desc:'企业档案与生产边界信息，系统已带入的内容无需重复填写。'},
  '能源与碳排数据':{desc:'汇集能源消费、生产经营和范围一、范围二排放数据。'},
  '资源循环与绿色制造':{desc:'归集固废、水、余热余压利用及绿色制造认证成果。'},
  '零碳专项建设':{desc:'填报光伏、绿建、新能源交通、碳足迹等特色建设成果。'},
}
const displayValue = item => item.value ? `${item.value}${item.unit ? ` ${item.unit}` : ''}` : '暂无数据'
export function EnterpriseDataReportingPage() {
  const navigate = useNavigate()
  const { items, currentTask, currentEnterpriseId, updateItem, uploadVoucher, submitTask } = useSharedData()
  const [category, setCategory] = useState('all'), [detail, setDetail] = useState(null), [message, setMessage] = useState('')
  const categories = useMemo(() => categoryOrder.filter(value => items.some(item => item.category === value)), [items])
  const current = category === 'all' ? items : items.filter(item => item.category === category)
  const pending = items.filter(item => item.source !== '系统已有' && !item.value).length, vouchers = items.filter(item => item.source !== '系统已有' && item.voucher && !item.voucherUploaded).length, taskCount = items.length, doneCount = items.filter(item => item.value && (!item.voucher || item.voucherUploaded)).length
  const enterprise = enterprises.find(item => item.id === currentEnterpriseId), returned = currentTask?.status === '已退回', locked = ['已提交', '已入库', '已关闭'].includes(currentTask?.status)
  const itemStatus = item => {
    if (item.source === '系统已有') return '已入库'
    if (returned) return '待填写'
    if (currentTask?.status === '已入库') return '已入库'
    if (currentTask?.status === '已提交') return '审核中'
    return '待填写'
  }
  const statusTone = status => ['已入库','审核通过'].includes(status) ? 'ok' : ['待填写','审核中','已提交'].includes(status) ? 'warn' : 'gray'
  const submit = () => { const result = submitTask(currentTask?.taskId); setMessage(result.ok ? '提交成功，已进入园区审核。' : result.reason) }
  const saveDraft = () => setMessage('草稿已保存。')
  const saveItem = event => { event.preventDefault(); const form = new FormData(event.currentTarget); updateItem(detail.id, form.get('value')); setDetail(null); setMessage(`${detail.name}已保存到本次任务，提交审核后将回写企业数据管理。`) }
  const renderTable = rows => <div className="table-wrap"><table className="report-action-table"><thead><tr><th>数据项</th><th>填报说明</th><th>当前情况</th><th>影响指标</th><th>状态</th><th>操作</th></tr></thead><tbody>{rows.length ? rows.map(item => { const status = itemStatus(item), needsVoucher = item.source !== '系统已有' && item.value && item.voucher && !item.voucherUploaded; return <tr key={item.id}><td className="item-name">{item.name}<small className="table-subnote">{item.source === '系统已有' ? '系统自动获取，无需重复填写' : item.voucher ? '需填写数据并上传证明材料' : '需填写年度数据'}</small></td><td>{item.purpose}</td><td>{displayValue(item)}</td><td>{item.businessLinks?.join('、') || '相关指标计算'}</td><td><StatusTag tone={statusTone(status)}>{status}</StatusTag></td><td>{item.source === '系统已有' ? <button className="op-btn" onClick={() => navigate('/data-issues')}>反馈问题</button> : needsVoucher ? <button className="op-btn" disabled={locked} onClick={() => uploadVoucher(item.id)}>上传材料</button> : <button className="op-btn" disabled={locked} onClick={() => setDetail(item)}>{item.value ? '查看 / 修改' : '填写'}</button>}</td></tr> }) : <tr><td colSpan="6" className="empty-cell">当前分类暂无数据项</td></tr>}</tbody></table></div>
  return <div className="content enterprise-content"><PageHeader title="企业数据协同填报" subtitle="按企业数据对象协同填报，经园区审核后入库并支撑零碳指标计算。" />
    <div className="report-task-summary"><div><span>任务名称</span><b>企业年度数据协同填报</b></div><div><span>统计年度</span><b>{currentTask?.period?.replace('年度','') || '2026'}</b></div><div><span>截止日期</span><b>{currentTask?.deadline || '—'}</b></div><div><span>当前状态</span><StatusTag tone={returned ? 'warn' : currentTask?.status === '已入库' ? 'ok' : 'gray'}>{returned ? '需修改' : currentTask?.status || '—'}</StatusTag></div></div>
    {message && <div className={`notice ${message.includes('成功') || message.includes('保存') ? 'success' : 'warning'}`}>{message}</div>}{returned && <div className="notice warning">本次填报有数据需要修改：{currentTask.reviewNote || '请核对填报数据和凭证。'}</div>}<div className="info-callout">系统自动获取的数据已带入；企业补充数据和材料提交后由园区审核，审核通过后进入正式数据管理，并用于零碳指标计算和 IOC 展示。</div>
    <MetricStrip metrics={[{label:'数据项总数',value:`${taskCount}项`,note:`已完成 ${doneCount} 项`},{label:'已完成',value:`${doneCount}项`,note:'数据及所需材料均已齐全'},{label:'待补充数据',value:`${pending}项`,note:'需要企业填写的数据'},{label:'待上传材料',value:`${vouchers}项`,note:'需要补充证明材料'},{label:'系统自动获取',value:`${items.filter(item => item.source === '系统已有').length}项`,note:'已带入，无需重复填写'}]} />
    <div className="report-workbench-note"><b>数据协同闭环</b><span>企业填写 → 提交 → 园区审核 → 审核通过 → 正式入库 → 指标计算与 IOC 展示</span><button className="op-btn" onClick={() => navigate('/data-issues')}>反馈数据问题 →</button></div>
    <Tabs tabs={[{value:'all',label:`全部 ${items.length}`}, ...categories.map(value => ({ value, label:`${value} ${items.filter(item => item.category === value).length}` }))]} active={category} onChange={setCategory} />
    <DataPanel title={category === 'all' ? '本次填报数据' : category} description={`${enterprise?.name || '当前企业'}需确认的数据与材料；按业务模块归类展示。`} actions={<button className="btn" onClick={saveDraft}>保存草稿</button>}>{category === 'all' ? <div className="report-module-grid">{categories.map(module => { const rows = items.filter(item => item.category === module); return <section className="report-module-card" key={module}><div className="report-module-head"><div><b>{module}</b><p>{moduleMeta[module]?.desc}</p></div><span>{rows.length} 项</span><button className="op-btn" onClick={() => setCategory(module)}>查看本模块 →</button></div>{renderTable(rows)}</section> })}</div> : renderTable(current)}</DataPanel>
    <div className="modal-foot page-actions"><button className="btn" onClick={saveDraft}>保存草稿</button><button className="btn primary" disabled={!currentTask || locked} onClick={submit}>{locked ? '已提交' : '提交填报'}</button></div>
    <Modal open={!!detail} title={detail?.name || '填报数据'} onClose={() => setDetail(null)} className="small">{detail && <form onSubmit={saveItem}><div className="modal-body"><div className="kv"><div className="kv-item"><label>填报说明</label>{detail.purpose}</div><div className="kv-item"><label>影响指标</label>{detail.businessLinks?.join('、') || '相关指标计算'}</div><div className="field"><label>填报数值{detail.unit ? `（${detail.unit}）` : ''}</label><input name="value" type={detail.inputType || 'number'} step={detail.inputType === 'text' ? undefined : 'any'} defaultValue={detail.value} required disabled={locked}/></div><div className="kv-item"><label>证明材料</label>{detail.voucher ? '保存后请在列表上传对应材料。' : '本项无需上传材料。'}</div></div></div><div className="modal-foot"><button type="button" className="btn" onClick={() => setDetail(null)}>取消</button><button className="btn primary" disabled={locked}>保存</button></div></form>}</Modal>
  </div>
}
