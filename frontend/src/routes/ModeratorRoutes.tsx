
import { Route, Routes } from 'react-router-dom'
import Dashboard from '../pages/moderator/Dashboard'
import { API_ROUTES } from '../constants/Api_Routes'
import Users from '../pages/moderator/Users'

const ModeratorRoutes = () => {
  return (
    <div>
      <Routes>
        <Route path={API_ROUTES.MODERATOR.DASHBOARD} element={<Dashboard/>}/>
        <Route path={API_ROUTES.MODERATOR.GET_USERS} element={<Users/>}/>
      </Routes>
    </div>
  )
}

export default ModeratorRoutes

