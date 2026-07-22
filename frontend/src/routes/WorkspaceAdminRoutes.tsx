
import { Route, Routes } from 'react-router-dom'
import Dashboard from '../pages/workspaceAdmin/Dashboard'

const WorkspaceAdminRoutes = () => {
  return (
    <div>
      <Routes>
        <Route path='dashboard' element={<Dashboard/>}/>
        
      </Routes>
    </div>
  )
}

export default WorkspaceAdminRoutes
