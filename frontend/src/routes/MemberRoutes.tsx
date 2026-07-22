
import { Route, Routes } from 'react-router-dom'
import Dashboard from '../pages/member/Dashboard'

const MemberRoutes = () => {
  return (
    <div>
      <Routes>
        <Route path='dashboard' element={<Dashboard/>}/>
      </Routes>
    </div>
  )
}

export default MemberRoutes
