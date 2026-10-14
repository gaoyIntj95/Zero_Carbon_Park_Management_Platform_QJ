import { TaskList } from '../components/CollaborationTasks.jsx'
import { useSharedData } from '../mock/sharedStore.js'
export function EnterpriseDataReportingPage() {
  const { currentEnterpriseId } = useSharedData()
  return <div className="content ct-page"><div className="ct-page-head"><h1>协同任务 <small>示例数据</small></h1></div><TaskList key={currentEnterpriseId}/></div>
}
