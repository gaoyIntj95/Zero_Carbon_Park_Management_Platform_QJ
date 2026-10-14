import { useSyncExternalStore } from 'react'
import { enterprises } from './masterData.js'
import { archiveAction, archiveSnapshot, effectiveProfile } from './enterpriseArchiveStore.js'

export const taskStates = ['已完成', '待企业提交', '待园区确认', '退回补充']
export const taskTypes = ['数据填报', '资料补充', '差异核实', '变更确认']
export const sourceNames = ['自动采集', '系统接口', '园区维护', '企业填报']
export const categories = ['能源数据', '运营数据', '专项数据']
export const enterpriseName = id => effectiveProfile(archiveSnapshot(), id)?.name || enterprises.find(e => e.id === id)?.name || id
export const actionable = task => ['待企业提交', '退回补充'].includes(task.status)
export const overdue = (task, now = Date.now()) => task.status !== '已完成' && new Date(task.deadline).getTime() < now
const timestamp = () => new Date().toLocaleString('sv-SE').replace('T', ' ')
const log = (action, actor, opinion, time = timestamp()) => ({ action, actor, opinion, time })

export function createCollaborationSeed() {
  const records = []
  for (const period of ['2026-09', '2026-08', '2026-07']) {
    let confirmed = 0
    sourceNames.forEach((source, s) => {
      const count = [80, 60, 40, 60][s], acquired = [78, 56, 32, 46][s] - (period === '2026-09' ? 0 : 2)
      for (let i = 0; i < count; i++) {
        const category = categories[i % 3], hasValue = i < acquired
        records.push({ id: `${period}-${s}-${i}`, enterpriseId: enterprises[i % 6].id, period, category, source,
          business: category === '专项数据' ? '零碳专项' : '能碳数据', name: ['天然气消费量', '产品产量', '绿色建筑面积'][i % 3], unit: ['Nm³', '吨', 'm²'][i % 3],
          value: hasValue ? String(12800 + i * 10) : '', confirmed: hasValue && confirmed++ < 196, materials: [], issue: '', description: '', updatedAt: '2026-10-14 09:00:00' })
      }
    })
  }
  const own = records.filter(r => r.period === '2026-09' && r.enterpriseId === 'ent-002')
  const specs = [
    ['补充天然气结算凭证', '资料补充', '退回补充', '2026-10-13T18:00', '天然气消费量', 'Nm³', '12800', '能碳数据'],
    ['核实电力消费差异', '差异核实', '待企业提交', '2026-10-16T18:00', '电力消费量', 'kWh', '86200', '能碳数据'],
    ['确认能源统计边界', '变更确认', '待企业提交', '2026-10-18T18:00', '能源统计边界', '', '一期厂区', '基础档案'],
    ['提交月度产品产量', '数据填报', '待园区确认', '2026-10-15T18:00', '产品产量', '吨', '2560', '能碳数据'],
    ['补充绿色工厂证书', '资料补充', '待园区确认', '2026-10-12T18:00', '绿色工厂认证', '项', '1', '零碳专项'],
    ['核实热力消费记录', '差异核实', '已完成', '2026-10-10T18:00', '热力消费量', 'GJ', '3680', '能碳数据'],
  ]
  const tasks = specs.map(([name, type, status, deadline, recordName, unit, value, business], i) => {
    const record = own[i]
    Object.assign(record, { name: recordName, unit, value, business, category: business === '零碳专项' ? '专项数据' : '能源数据', issue: i === 0 ? '资料缺失' : i === 1 ? '异常' : i === 2 ? '变更待确认' : i < 5 ? '待确认' : '', description: i === 0 ? '结算凭证缺少计量单位' : i === 1 ? '电力用量与结算单存在差异' : i === 2 ? '新增二期厂区，需确认统计边界' : '企业已提交，待园区确认' })
    record.materials = [{ id: `material-${i}`, name: `${recordName}现有凭证.txt`, content: `示例材料\n企业：${enterpriseName(record.enterpriseId)}\n期间：2026-09\n${recordName}：${value} ${unit}\n用于原型演示。` }]
    const history = [log('园区下发', '园区管理员', '请按要求完成本期数据协同。', '2026-10-08 09:00:00')]
    if (['退回补充', '待园区确认', '已完成'].includes(status)) history.push(log('企业提交', enterpriseName(record.enterpriseId), '已核对并提交材料。', '2026-10-09 15:00:00'))
    if (status === '退回补充') history.push(log('园区反馈', '园区管理员', '结算单缺少计量单位，请补充完整凭证。', '2026-10-13 10:20:00'))
    if (status === '已完成') history.push(log('园区确认', '园区管理员', '核实说明及记录一致。', '2026-10-10 10:00:00'))
    return { id: `collab-${i + 1}`, name, type, status, enterpriseId: record.enterpriseId, recordId: record.id, period: record.period, deadline, scope: '按企业统计边界及当月结算口径提供数据。', requirement: type === '资料补充' ? '提供完整凭证，须包含期间、数值及计量单位。' : '按需提供结算单、核实依据或变更证明。', change: i === 2 ? '统计边界由一期厂区调整为一期及二期厂区。' : '', feedback: status === '退回补充' ? history.at(-1) : null,
      submission: { value, explanation: status === '已完成' ? '经核实，记录与结算单一致，无需修正。' : '', note: status === '待园区确认' ? '已补充，请确认。' : '', materials: ['待园区确认', '已完成'].includes(status) ? record.materials : [], revise: false }, history }
  })
  const otherRecords = records.filter(r => r.period === '2026-09' && r.enterpriseId !== 'ent-002' && r.value)
  for (let i = 0; i < 12; i++) {
    const record = otherRecords[i], status = i === 11 ? '待企业提交' : '已完成'
    tasks.push({ id: `collab-${i + 7}`, name: `核实${record.name}`, type: '差异核实', status, enterpriseId: record.enterpriseId, recordId: record.id, period: record.period, deadline: '2026-10-18T18:00', scope: '核对本期数据与企业台账。', requirement: '提供核实说明。', submission: { explanation: status === '已完成' ? '与台账一致。' : '', materials: [], note: '', value: record.value }, history: [log('园区下发', '园区管理员', '核对本期数据。', '2026-10-08 09:00:00'), ...(status === '已完成' ? [log('企业提交', enterpriseName(record.enterpriseId), '与台账一致。', '2026-10-09 09:00:00'), log('园区确认', '园区管理员', '核实完成。', '2026-10-10 09:00:00')] : [])] })
  }
  const used = new Set(own.slice(0, 6).map(r => r.id))
  const missing = records.filter(r => r.period === '2026-09' && !r.value && !used.has(r.id)).slice(0, 8)
  missing.forEach(r => Object.assign(r, { issue: '缺失', description: '缺少本期数据' }))
  records.filter(r => r.period === '2026-09' && r.value && !used.has(r.id)).slice(0, 15).forEach((r, i) => Object.assign(r, { issue: i < 6 ? '待确认' : ['更新滞后', '异常', '重复'][i % 3], description: i < 6 ? '数据已取得，待确认' : '需根据源记录核对本期数据' }))
  const pendingIds = new Set(records.filter(r => r.period === '2026-09' && ['待确认', '资料缺失', '异常', '变更待确认'].includes(r.issue)).map(r => r.id))
  for (const record of records.filter(r => r.period === '2026-09' && r.value)) {
    if (pendingIds.size < 16) pendingIds.add(record.id)
    record.confirmed = !pendingIds.has(record.id)
  }
  return { version: 1, tasks, records, updatedAt: '2026-10-14 09:00:00' }
}

export function applyTaskAction(state, { action, id, payload = {}, actor, time = timestamp() }) {
  const task = state.tasks.find(t => t.id === id)
  if (!task) throw new Error('任务不存在')
  if (actor !== 'park' && actor !== task.enterpriseId) throw new Error('只能办理当前企业的任务')
  const record = state.records.find(r => r.id === task.recordId)
  let next = { ...task }, records = state.records
  if (['save', 'submit'].includes(action)) {
    if (actor === 'park' || !actionable(task)) throw new Error('当前任务不可办理')
    const content = { ...task.submission, ...task.draft, ...payload }
    if (action === 'save') next.draft = content
    if (action === 'submit') {
      const s = content
      next.submission = content; next.draft = null
      if (task.type === '数据填报' && !String(task.needsValue ? s.value || '' : record.value || s.value || '').trim()) throw new Error('请补录缺失数据')
      if (task.type === '资料补充' && !s.materials?.length) throw new Error('请引用或上传证明材料')
      if (['差异核实', '变更确认'].includes(task.type) && !s.explanation?.trim()) throw new Error('请填写核实说明或确认意见')
      if (s.revise && !String(s.value || '').trim()) throw new Error('请填写修正后的数值')
      if ((s.revise || (task.type === '数据填报' && (task.needsValue || !record.value))) && (!Number.isFinite(Number(s.value)) || Number(s.value) < 0)) throw new Error('请填写有效的非负数值')
      next.status = '待园区确认'
      next.history = [...task.history, log(task.status === '退回补充' ? '企业补充' : '企业提交', enterpriseName(actor), s.note || s.explanation || '已提交办理内容及材料。', time)]
      const supplied = (task.type === '数据填报' && record.issue === '缺失' && String(s.value || record.value || '').trim()) || (task.type === '资料补充' && record.issue === '资料缺失' && s.materials?.length)
      if (!task.applicationId) records = state.records.map(r => r.id === record.id ? { ...r, value: (task.type === '数据填报' && (task.needsValue || !r.value)) || (task.type === '差异核实' && s.revise) ? s.value : r.value, materials: [...new Map([...r.materials, ...(s.materials || [])].map(m => [m.id, m])).values()], issue: supplied ? '待确认' : r.issue, description: supplied ? '缺失内容已补充，待园区确认' : r.description, lastSubmission: { taskId: task.id, opinion: s.explanation || s.note, time }, confirmed: false, updatedAt: time } : r)
    }
  } else {
    if (actor !== 'park' || task.status !== '待园区确认') throw new Error('任务尚未进入园区确认环节')
    if (action === 'return') {
      if (!payload.opinion?.trim()) throw new Error('退回时必须填写反馈意见')
      next.status = '退回补充'; next.feedback = log('园区反馈', '园区管理员', payload.opinion.trim(), time)
      next.history = [...task.history, next.feedback]
    } else if (action === 'confirm') {
      next.status = '已完成'; next.history = [...task.history, log('园区确认', '园区管理员', payload.opinion?.trim() || '已确认本次任务办理结果。', time)]
      const s = task.submission
      const resolved = (task.type === '数据填报' && record.issue === '缺失' && record.value) || (task.type === '资料补充' && record.issue === '资料缺失' && s.materials?.length) || (task.type === '差异核实' && ['异常', '更新滞后'].includes(record.issue) && s.explanation?.trim()) || (task.type === '变更确认' && record.issue === '变更待确认' && s.explanation?.trim()) || record.issue === '待确认'
      if (!task.applicationId) records = state.records.map(r => r.id === record.id ? { ...r, issue: resolved ? '' : r.issue, confirmed: resolved ? !!r.value : r.confirmed, updatedAt: time } : r)
    } else throw new Error('不支持的操作')
  }
  return { ...state, records, tasks: state.tasks.map(t => t.id === id ? next : t), updatedAt: time }
}

const key = 'qujing-collaboration-v1'
let state
try { state = JSON.parse(localStorage.getItem(key)); if (state?.version !== 1) state = null } catch { /* No saved prototype data. */ }
state ||= createCollaborationSeed()
const listeners = new Set()
function commit(next) {
  try { if (typeof localStorage !== 'undefined') localStorage.setItem(key, JSON.stringify(next)) } catch { throw new Error('本地演示存储空间不足，请减少材料大小后重试。') }
  state = next; listeners.forEach(fn => fn())
}
if (typeof window !== 'undefined') window.addEventListener('storage', event => {
  if (event.key !== key) return
  try { const next = JSON.parse(event.newValue); if (next?.version === 1) { state = next; listeners.forEach(fn => fn()) } } catch { /* Ignore invalid storage. */ }
})
export function taskAction(args) {
  const next = applyTaskAction(state, args)
  const task = state.tasks.find(item => item.id === args.id)
  const applicationId = task.applicationId || (task.id === 'collab-3' ? 'archive-boundary-ent-002' : '')
  const application = archiveSnapshot().changes.find(change => change.id === applicationId)
  if (application && ['submit', 'return', 'confirm'].includes(args.action)) {
    const alreadySubmitted = args.action === 'submit' && application.status === '待园区确认'
    if (!alreadySubmitted) archiveAction({ action: args.action, id: applicationId, enterpriseId: task.enterpriseId, actor: args.actor, payload: args.action === 'return' ? { opinion: args.payload?.opinion } : {}, at: args.time })
  }
  commit(next)
}
export function createTask(values) {
  const record = state.records.find(r => r.id === values.recordId && r.enterpriseId === values.enterpriseId && r.period === values.period)
  if (!record || !values.name?.trim() || !values.scope?.trim() || !values.requirement?.trim() || !taskTypes.includes(values.type) || !Number.isFinite(new Date(values.deadline).getTime())) throw new Error('请填写完整任务要求，并选择对应企业和期间的业务记录')
  const task = { ...values, name: values.name.trim(), id: `collab-${crypto.randomUUID()}`, needsValue: !record.value, status: '待企业提交', submission: { value: record.value, materials: [], explanation: '', note: '' }, history: [log('园区下发', '园区管理员', values.scope)] }
  commit({ ...state, tasks: [task, ...state.tasks], updatedAt: timestamp() }); return task.id
}

export function registerEnergyCarbonRecord(row) {
  const id = `park-energy-carbon-${row.id}`
  if (state.records.some(record => record.id === id)) return state.records.find(record => record.id === id)
  const record = { id, enterpriseId:row.enterpriseId, period:row.period, category:row.category, business:'能碳数据', name:row.item, unit:row.unit, value:row.value == null ? '' : String(row.value), source:row.source || row.sources?.[0]?.name || '企业填报', confirmed:row.confirmStatus === '已确认', materials:[], issue:row.qualityStatus === '数据缺失' ? '缺失' : row.qualityStatus === '来源差异' ? '异常' : '待确认', description:`${row.boundary} · ${row.item} · ${row.stage || '统计数据'}`, updatedAt:timestamp(), parkDataId:row.id }
  commit({ ...state, records:[record, ...state.records], updatedAt:timestamp() })
  return record
}
export function registerSpecialRecord(row) {
  const id = `park-special-${row.id}`
  const existing = state.records.find(record => record.id === id)
  if (existing) return existing
  const record = { id, enterpriseId:row.enterpriseId, period:row.period, category:'专项数据', business:'零碳专项', name:row.name, unit:row.unit, value:row.value || '', source:row.source, confirmed:row.status === '已确认', materials:[], issue:row.status === '待补充' || row.status === '已退回' ? '资料缺失' : '待确认', description:row.scope, updatedAt:timestamp(), specialMaterialId:row.id }
  commit({ ...state, records:[record,...state.records], updatedAt:timestamp() })
  return record
}
export function registerCarbonAssetRecord(row) {
  const id = `park-carbon-asset-${row.id}`
  const existing = state.records.find(record => record.id === id)
  if (existing) return existing
  const record = { id, enterpriseId:row.enterpriseId, period:row.period, category:'运营数据', business:'碳资产履约', name:'企业履约资料', unit:'', value:'', source:row.source, confirmed:false, materials:[], issue:'资料缺失', description:row.missing || '请补充履约资料', updatedAt:timestamp(), carbonAssetId:row.id }
  commit({ ...state, records:[record,...state.records], updatedAt:timestamp() })
  return record
}
export function useCollaboration() { return useSyncExternalStore(fn => { listeners.add(fn); return () => listeners.delete(fn) }, () => state) }
