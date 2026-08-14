import { Route, Routes } from "react-router-dom"
import Dashboard from "../pages/superAdmin/Dashboard"
import Users from "../pages/superAdmin/Users"
import { API_ROUTES } from "../constants/Api_Routes"
import SuperAdminLayout  from '../components/superAdmin/layout/SuperAdminLayout'
import SubscriptionPlan from "../pages/superAdmin/SubscriptionPlan"
import Workspaces from "../pages/superAdmin/Workspaces"

const SuperAdminRoutes = () => {
  return (
    <Routes>
      <Route element={<SuperAdminLayout />}>
        <Route path={API_ROUTES.SUPER_ADMIN.DASHBOARD} element={<Dashboard/>}/>
        <Route path={API_ROUTES.SUPER_ADMIN.GET_USERS} element={<Users/>}/>
        <Route path={API_ROUTES.SUPER_ADMIN.GET_SUBSCRIPTIONS} element={<SubscriptionPlan/>}/>
        <Route path={API_ROUTES.SUPER_ADMIN.GET_WORKSPACES} element={<Workspaces/>}/>
      </Route>
    </Routes>
  )
}

export default SuperAdminRoutes
