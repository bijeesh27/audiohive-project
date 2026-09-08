import { Route, Routes } from 'react-router-dom';
import Dashboard from '../pages/member/Dashboard';
import Rooms from '../pages/member/Rooms';
import RoomDetail from '../pages/member/RoomDetail';
import Announcements from '../pages/member/Announcements';
import { API_ROUTES } from '../constants/Api_Routes';
import MemberLayout from '../components/member/layout/MemberLayout';

const MemberRoutes = () => {
  return (
    <div>
      <Routes>
        <Route element={<MemberLayout />}>
          <Route path={API_ROUTES.MEMBER.DASHBOARD} element={<Dashboard />} />
          <Route path={API_ROUTES.MEMBER.ROOMS} element={<Rooms />} />
          <Route path={API_ROUTES.MEMBER.ROOM_DETAIL} element={<RoomDetail />} />
          <Route path={API_ROUTES.MEMBER.ANNOUNCEMENTS} element={<Announcements />} />
        </Route>
      </Routes>
    </div>
  );
};

export default MemberRoutes;
