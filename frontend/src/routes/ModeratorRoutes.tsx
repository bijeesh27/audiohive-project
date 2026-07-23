
import { Route, Routes } from 'react-router-dom'
import Dashboard from '../pages/moderator/Dashboard'
import { API_ROUTES } from '../constants/Api_Routes'

const ModeratorRoutes = () => {
  return (
    <div>
      <Routes>
        <Route path={API_ROUTES.MODERATOR.DASHBOARD} element={<Dashboard/>}/>
      </Routes>
    </div>
  )
}

export default ModeratorRoutes

