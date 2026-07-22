
import { Route, Routes } from 'react-router-dom'
import Dashboard from '../pages/moderator/Dashboard'

const ModeratorRoutes = () => {
  return (
    <div>
      <Routes>
        <Route path="dashboard" element={<Dashboard/>}/>
      </Routes>
    </div>
  )
}

export default ModeratorRoutes

