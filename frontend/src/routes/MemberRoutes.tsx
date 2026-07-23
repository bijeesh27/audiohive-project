
import { Route, Routes } from 'react-router-dom'
import Dashboard from '../pages/member/Dashboard'
import { API_ROUTES } from '../constants/Api_Routes'

const MemberRoutes = () => {
  return (
    <div>
      <Routes>
        <Route path={API_ROUTES.MEMBER.DASHBOARD} element={<Dashboard/>}/>
      </Routes>
    </div>
  )
}

export default MemberRoutes
