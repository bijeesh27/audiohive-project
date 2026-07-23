
import { Route, Routes } from 'react-router-dom'
import Dashboard from '../pages/workspaceAdmin/Dashboard'
import { API_ROUTES } from '../constants/Api_Routes'

const WorkspaceAdminRoutes = () => {
  return (
    <div>
      <Routes>
        <Route path={API_ROUTES.WORKSPACE_ADMIN.DASHBOARD} element={<Dashboard/>}/>
        
      </Routes>
    </div>
  )
}

export default WorkspaceAdminRoutes
