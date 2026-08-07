import { Route, Routes } from "react-router-dom"
import Dashboard from "../pages/superAdmin/Dashboard"
import Users from "../pages/superAdmin/Users"
import { API_ROUTES } from "../constants/Api_Routes"
import SuperAdminLayout  from '../components/superAdmin/layout/SuperAdminLayout'
import SubscriptionPlans from "../pages/superAdmin/SubscriptionPlans"


const SuperAdminRoutes = () => {
  return (
    <Routes>
      {/* The Layout wraps all the routes inside it */}
      <Route element={<SuperAdminLayout />}>
        <Route path={API_ROUTES.SUPER_ADMIN.DASHBOARD} element={<Dashboard/>}/>
        <Route path={API_ROUTES.SUPER_ADMIN.GET_USERS} element={<Users/>}/>
        <Route path={API_ROUTES.SUPER_ADMIN.GET_SUBSCRIPTIONS} element={<SubscriptionPlans/>}/>

      </Route>
    </Routes>
  )
}

export default SuperAdminRoutes
