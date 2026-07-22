import { Route, Routes } from "react-router-dom"
import Dashboard from "../pages/superAdmin/Dashboard"
import Users from "../pages/superAdmin/Users"


const SuperAdminRoutes = () => {
  return (
    <div>
      <Routes>
        <Route path="dashboard" element={<Dashboard/>}/>
        <Route path='getusers' element={<Users/>}/>
      </Routes>
    </div>
  )
}

export default SuperAdminRoutes
