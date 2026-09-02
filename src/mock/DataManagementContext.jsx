import { createContext,useContext,useMemo,useState } from 'react'
import { enterprises } from './masterData.js'
import { businessDataRecords,dataIssues,energyFlowRelations,energyNodes,qualityStatusForIssue } from './dataManagementStore.js'
const DataManagementContext=createContext(null)
export function DataManagementProvider({children}){
 const [enterpriseRows,setEnterpriseRows]=useState(enterprises),[records,setRecords]=useState(businessDataRecords),[issues,setIssues]=useState(dataIssues),[nodes,setNodes]=useState(energyNodes),[flows,setFlows]=useState(energyFlowRelations)
 const updateIssueStatus=(issueId,status)=>{const issue=issues.find(item=>item.issueId===issueId);if(!issue)return;setIssues(prev=>prev.map(item=>item.issueId===issueId?{...item,status,resolvedAt:status==='已解决'?'刚刚':item.resolvedAt}:item));if(issue.objectType==='BUSINESS_DATA')setRecords(prev=>prev.map(record=>{if(record.recordId!==issue.objectId)return record;const otherActive=issues.some(item=>item.issueId!==issueId&&item.objectId===issue.objectId&&item.status!=='已解决');return {...record,qualityStatus:status==='已解决'&&!otherActive?'正常':qualityStatusForIssue(issue)}}))}
 const createIssue=(input)=>{const issue={...input,issueId:input.issueId||`issue-${Date.now()}`,status:input.status||'待处理',createdAt:input.createdAt||'刚刚'};setIssues(prev=>[issue,...prev]);if(issue.objectType==='BUSINESS_DATA')setRecords(prev=>prev.map(record=>record.recordId===issue.objectId?{...record,qualityStatus:qualityStatusForIssue(issue)}:record));return issue}
 const value=useMemo(()=>({enterpriseRows,setEnterpriseRows,records,setRecords,issues,setIssues,nodes,setNodes,flows,setFlows,updateIssueStatus,resolveIssue:(issueId)=>updateIssueStatus(issueId,'已解决'),createIssue}),[enterpriseRows,records,issues,nodes,flows])
 return <DataManagementContext.Provider value={value}>{children}</DataManagementContext.Provider>
}
export function useDataManagement(){const value=useContext(DataManagementContext);if(!value)throw new Error('useDataManagement must be used within DataManagementProvider');return value}