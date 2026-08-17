
import { Route, Routes } from 'react-router-dom'
import { API_ROUTES } from '../constants/Api_Routes'
import Dashboard from '../pages/organization/Dashboard'
import OrganizationLayout from '../components/organizationAdmin/layout/OrganizationLayout'
import Workspaces from '../pages/organization/Workspaces'
import CreateWorkspace from '../pages/organization/CreateWorkspace'
import SubscriptionDetails from '../pages/organization/SubscriptionDetails'

const OrganizationRoutes = () => {
  return (
    <div>
      <Routes>
        <Route element={<OrganizationLayout/>}>
            <Route path={API_ROUTES.ORGANIZATION_ADMIN.DASHBOARD} element={<Dashboard/>}/>
            <Route path={API_ROUTES.ORGANIZATION_ADMIN.WORKSPACES} element={<Workspaces/>}/>
            <Route path='create-workspace' element={<CreateWorkspace/>}/>
            <Route path='subscription' element={<SubscriptionDetails/>}/>
        </Route>
      </Routes>
    </div>
  )
}

export default OrganizationRoutes
