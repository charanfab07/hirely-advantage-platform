import { useLocation, Outlet } from "react-router-dom";
import { MeshGradient } from "@/components/landing/MeshGradient";
import { DashboardSidebar } from "@/components/dashboard/Sidebar";

const DashboardLayout = () => {
  const { pathname } = useLocation();
  return (
    <div className="relative min-h-screen overflow-x-hidden font-display">
      <MeshGradient />
      <div className="relative flex min-h-screen">
        <div className="animate-sidebar-enter motion-reduce:animate-none">
          <DashboardSidebar />
        </div>
        <main className="flex-1 px-5 md:px-9 py-7 overflow-hidden">
          {/* key on pathname re-runs the enter animation on every nav within /app */}
          <div key={pathname} className="animate-dashboard-enter motion-reduce:animate-none">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
