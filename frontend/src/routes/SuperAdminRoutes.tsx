import { Route, Routes } from "react-router-dom"
import Dashboard from "../pages/superAdmin/Dashboard"
import Users from "../pages/superAdmin/Users"
import { API_ROUTES } from "../constants/Api_Routes"


const SuperAdminRoutes = () => {
  return (
    <div>
      <Routes>
        <Route path={API_ROUTES.SUPER_ADMIN.DASHBOARD} element={<Dashboard/>}/>
        <Route path={API_ROUTES.SUPER_ADMIN.GET_USERS} element={<Users/>}/>
      </Routes>
    </div>
  )
}

export default SuperAdminRoutes
