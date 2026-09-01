
import { Route, Routes } from 'react-router-dom'
import { API_ROUTES } from '../constants/Api_Routes'
import Dashboard from '../pages/organizationAdmin/Dashboard'
import OrganizationLayout from '../components/organizationAdmin/layout/OrganizationLayout'
import Workspaces from '../pages/organizationAdmin/Workspaces'
import CreateWorkspace from '../pages/organizationAdmin/CreateWorkspace'
import SubscriptionDetails from '../pages/organizationAdmin/SubscriptionDetails'

import Users from '../pages/organizationAdmin/Users'
import WorkspaceDetailsPage from '../pages/organizationAdmin/WorkspaceDetailsPage'

const OrganizationRoutes = () => {
  return (
    <div>
      <Routes>
        <Route element={<OrganizationLayout/>}>
            <Route path={API_ROUTES.ORGANIZATION_ADMIN.DASHBOARD} element={<Dashboard/>}/>
            <Route path={API_ROUTES.ORGANIZATION_ADMIN.WORKSPACES} element={<Workspaces/>}/>
            <Route path='create-workspace' element={<CreateWorkspace/>}/>
            <Route path='subscription' element={<SubscriptionDetails/>}/>
            <Route path={API_ROUTES.ORGANIZATION_ADMIN.USERS} element={<Users/>}/>
            <Route path='/getworkspace/:workspaceId' element={<WorkspaceDetailsPage/>}/>
        </Route>
      </Routes>
    </div>
  )
}

export default OrganizationRoutes
