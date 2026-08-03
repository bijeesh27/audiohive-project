
import { Route, Routes } from 'react-router-dom'
import Dashboard from '../pages/workspaceAdmin/Dashboard'
import { API_ROUTES } from '../constants/Api_Routes'
import Users from '../pages/workspaceAdmin/Users'

const WorkspaceAdminRoutes = () => {
  return (
    <div>
      <Routes>
        <Route path={API_ROUTES.WORKSPACE_ADMIN.DASHBOARD} element={<Dashboard/>}/>
        <Route path={API_ROUTES.WORKSPACE_ADMIN.GET_USERS} element={<Users/>}/>
        
      </Routes>
    </div>
  )
}

export default WorkspaceAdminRoutes
