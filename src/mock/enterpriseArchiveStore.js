import { useSyncExternalStore } from 'react'
import { enterprises as seedEnterprises } from './masterData.js'

export const changeFields = [
  { key: 'name', label: '企业名称', type: 'subject' },
  { key: 'creditCode', label: '统一社会信用代码', type: 'subject' },
  { key: 'industry', label: '所属行业', type: 'subject' },
  { key: 'enterpriseType', label: '企业类型', type: 'subject' },
  { key: 'mainProducts', label: '主要产品', type: 'subject' },
  { key: 'productionScale', label: '生产规模', type: 'subject' },
  { key: 'address', label: '企业地址', type: 'subject' },
  { key: 'statisticsBoundary', label: '能源统计边界', type: 'boundary' },
  { key: 'managementScope', label: '纳入范围', type: 'management' },
]
export const fieldLabel = key => changeFields.find(field => field.key === key)?.label || key
const dateTime = () => new Date().toLocaleString('sv-SE').replace('T', ' ')
const event = (action, actor, note, at = dateTime()) => ({ action, actor, note, at })
const initialBoundary = '一期生产厂区'
export const archiveEnterpriseName = (profiles, id) => profiles.find(p => p.enterpriseId === id)?.name || id

export function createArchiveSeed() {
  const profiles = seedEnterprises.map((enterprise, index) => ({
    ...enterprise, enterpriseType: '工业企业', productionScale: index === 1 ? '单晶硅片年产 980 万片' : '以企业填报资料为准',
    statisticsBoundary: initialBoundary, managementScope: '企业本部生产经营范围',
    includedAt: '2026-01-01', exitedAt: '', updatedAt: '2026-10-13 09:00:00',
  }))
  const sample = {
    id: 'archive-boundary-ent-002', enterpriseId: 'ent-002', field: 'statisticsBoundary', currentValue: initialBoundary,
    proposedValue: '一期生产厂区、二期新增生产线', reason: '新增生产线投产，申请纳入统计范围。',
    effectiveDate: '2026-11-01', materials: [{ id: 'archive-boundary-proof', name: '统计边界调整说明.txt', content: '示例材料：二期新增生产线投产，申请纳入园区能源统计边界。' }],
    status: '待提交', taskId: 'collab-3', submittedAt: '', feedback: null, confirmedAt: '',
    history: [event('申请草稿', '企业', '与协同任务“确认能源统计边界”关联。', '2026-10-13 15:20:00')],
  }
  return { version: 1, profiles, changes: [sample] }
}

export function effectiveProfile(state, enterpriseId, today = new Date().toLocaleDateString('sv-SE')) {
  const original = state.profiles.find(p => p.enterpriseId === enterpriseId)
  if (!original) return null
  const approved = state.changes.filter(c => c.enterpriseId === enterpriseId && c.status === '已确认' && c.effectiveDate <= today).sort((a, b) => a.effectiveDate.localeCompare(b.effectiveDate) || a.confirmedAt.localeCompare(b.confirmedAt))
  return approved.reduce((profile, change) => ({ ...profile, [change.field]: change.proposedValue, updatedAt: change.effectiveDate > profile.updatedAt.slice(0, 10) ? `${change.effectiveDate} 00:00:00` : profile.updatedAt }), original)
}

const validValue = (field, value) => {
  const clean = String(value || '').trim()
  if (!clean) throw new Error('请输入拟变更内容')
  if (field === 'creditCode' && !/^[0-9A-Z]{18}$/.test(clean)) throw new Error('统一社会信用代码须为 18 位大写字母或数字')
  return clean
}
export function applyArchiveAction(state, { action, enterpriseId, id, actor, payload = {}, at = dateTime(), today = at.slice(0, 10) }) {
  const profile = effectiveProfile(state, enterpriseId, today)
  if (!profile) throw new Error('企业档案不存在')
  const existing = state.changes.find(c => c.id === id)
  if (existing && existing.enterpriseId !== enterpriseId) throw new Error('无权处理其他企业的变更')
  const finish = change => ({ ...state, changes: existing ? state.changes.map(c => c.id === id ? change : c) : [change, ...state.changes] })
  if (action === 'contact') {
    if (actor !== enterpriseId) throw new Error('只能维护本企业联系人')
    const contact = String(payload.contact || '').trim(), phone = String(payload.phone || '').trim()
    if (!contact || !/^[+\d\s()-]{7,25}$/.test(phone)) throw new Error('请填写联系人和有效联系电话')
    return { ...state, profiles: state.profiles.map(p => p.enterpriseId === enterpriseId ? { ...p, contact, phone, updatedAt: at } : p), changes: [{ id: `contact-${at}-${enterpriseId}`, enterpriseId, field: 'contact', currentValue: `${profile.contact} / ${profile.phone}`, proposedValue: `${contact} / ${phone}`, reason: '日常联系信息更新', effectiveDate: today, status: '已生效', submittedAt: at, confirmedAt: at, materials: [], taskId: '', history: [event('直接更新', '企业', '联系人及联系电话已更新。', at)] }, ...state.changes] }
  }
  if (action === 'management') {
    if (actor !== 'park') throw new Error('园区管理关系由园区维护')
    const status = payload.managedStatus, includedAt = payload.includedAt, exitedAt = payload.exitedAt || '', managementScope = String(payload.managementScope || '').trim()
    if (!['已纳管', '已退出', '待纳入'].includes(status) || !managementScope || status === '已纳管' && !includedAt || status === '已退出' && !exitedAt) throw new Error('请填写完整纳入状态、时间和管理范围')
    const next = { ...profile, managedStatus: status, includedAt, exitedAt, managementScope, updatedAt: at }
    return { ...state, profiles: state.profiles.map(p => p.enterpriseId === enterpriseId ? next : p), changes: [{ id: `management-${at}-${enterpriseId}`, enterpriseId, field: 'management', currentValue: `${profile.managedStatus} / ${profile.managementScope}`, proposedValue: `${status} / ${managementScope}`, reason: '园区维护管理关系', effectiveDate: today, status: '已生效', submittedAt: at, confirmedAt: at, materials: [], taskId: '', history: [event('管理关系维护', '园区', `${status}；纳入时间 ${includedAt || '—'}；退出时间 ${exitedAt || '—'}`, at)] }, ...state.changes] }
  }
  if (action === 'submit') {
    if (actor !== enterpriseId || existing && !['待提交', '退回补充'].includes(existing.status)) throw new Error('当前申请不可提交')
    const field = payload.field || existing?.field
    if (!changeFields.some(f => f.key === field)) throw new Error('请选择变更事项')
    if (!existing && state.changes.some(change => change.enterpriseId === enterpriseId && change.field === field && ['待提交', '待园区确认', '退回补充'].includes(change.status))) throw new Error('该事项已有未完成申请，请在变更记录中办理')
    const proposedValue = validValue(field, payload.proposedValue ?? existing?.proposedValue)
    const reason = String(payload.reason ?? existing?.reason ?? '').trim(), effectiveDate = payload.effectiveDate || existing?.effectiveDate
    if (!reason || !/^\d{4}-\d{2}-\d{2}$/.test(effectiveDate || '') || new Date(`${effectiveDate}T00:00:00`).toLocaleDateString('sv-SE') !== effectiveDate) throw new Error('请填写变更原因和拟生效日期')
    const currentValue = existing?.currentValue || String(profile[field] || '')
    if (currentValue === proposedValue) throw new Error('拟变更内容与当前有效内容相同')
    const materials = payload.materials ?? existing?.materials ?? []
    if (!materials.length) throw new Error('请上传或保留依据材料')
    const next = { ...(existing || {}), id: id || `archive-${crypto.randomUUID()}`, enterpriseId, field, currentValue, proposedValue, reason, effectiveDate, materials, status: '待园区确认', submittedAt: at, confirmedAt: '', feedback: null, taskId: payload.taskId ?? existing?.taskId ?? '', history: [...(existing?.history || []), event(existing?.status === '退回补充' ? '企业补充' : '企业提交', '企业', reason, at)] }
    return finish(next)
  }
  if (action === 'return') {
    if (actor !== 'park' || existing?.status !== '待园区确认') throw new Error('当前申请不可退回')
    const opinion = String(payload.opinion || '').trim()
    if (!opinion) throw new Error('退回时必须填写反馈意见')
    return finish({ ...existing, status: '退回补充', feedback: { opinion, at }, history: [...existing.history, event('园区退回', '园区', opinion, at)] })
  }
  if (action === 'confirm') {
    if (actor !== 'park' || existing?.status !== '待园区确认') throw new Error('当前申请不可确认')
    return finish({ ...existing, status: '已确认', confirmedAt: at, history: [...existing.history, event('园区确认', '园区', `确认通过，${existing.effectiveDate} 生效。`, at)] })
  }
  throw new Error('不支持的档案操作')
}

const key = 'qujing-enterprise-archive-v1'
let state
try { state = JSON.parse(localStorage.getItem(key)); if (state?.version !== 1) state = null } catch { /* Keep seed. */ }
state ||= createArchiveSeed()
const listeners = new Set()
const notify = () => listeners.forEach(fn => fn())
const commit = next => { try { localStorage.setItem(key, JSON.stringify(next)) } catch { throw new Error('本地演示存储空间不足') } state = next; notify() }
if (typeof window !== 'undefined') window.addEventListener('storage', e => { if (e.key !== key) return; try { const next = JSON.parse(e.newValue); if (next?.version === 1) { state = next; notify() } } catch { /* Ignore invalid storage. */ } })
export const useEnterpriseArchive = () => useSyncExternalStore(fn => { listeners.add(fn); return () => listeners.delete(fn) }, () => state)
export const archiveAction = args => commit(applyArchiveAction(state, args))
export const archiveSnapshot = () => state
export const archiveChanges = enterpriseId => state.changes.filter(c => c.enterpriseId === enterpriseId)
export function setArchiveProfiles(update) { const profiles = typeof update === 'function' ? update(state.profiles) : update; commit({ ...state, profiles }) }
