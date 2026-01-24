import AIAllocation from './pages/AIAllocation';
import Approvals from './pages/Approvals';
import Dashboard from './pages/Dashboard';
import FindingDetail from './pages/FindingDetail';
import Findings from './pages/Findings';
import Home from './pages/Home';
import Reports from './pages/Reports';
import SystemDetail from './pages/SystemDetail';
import Systems from './pages/Systems';
import Tasks from './pages/Tasks';
import Team from './pages/Team';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AIAllocation": AIAllocation,
    "Approvals": Approvals,
    "Dashboard": Dashboard,
    "FindingDetail": FindingDetail,
    "Findings": Findings,
    "Home": Home,
    "Reports": Reports,
    "SystemDetail": SystemDetail,
    "Systems": Systems,
    "Tasks": Tasks,
    "Team": Team,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};