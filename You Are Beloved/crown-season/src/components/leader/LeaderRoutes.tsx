import { Routes, Route } from 'react-router-dom';
import LeaderAuth from './LeaderAuth';
import LeaderHome from './LeaderHome';
import MemberList from './MemberList';
import MemberProfile from './MemberProfile';
import WeekLeaderList from './WeekLeaderList';
import WeekLeader from './WeekLeader';

/* Mounted at /leader/* — lazy-loaded, and only compiled into the leader build.
 * All sensitive member data lives beneath this tree. */
export default function LeaderRoutes() {
  return (
    <Routes>
      <Route element={<LeaderAuth />}>
        <Route index element={<LeaderHome />} />
        <Route path="members" element={<MemberList />} />
        <Route path="member/:id" element={<MemberProfile />} />
        <Route path="weeks" element={<WeekLeaderList />} />
        <Route path="week/:n" element={<WeekLeader />} />
      </Route>
    </Routes>
  );
}
