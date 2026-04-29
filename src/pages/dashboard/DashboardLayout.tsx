import { Outlet } from "react-router-dom";
import { MeshGradient } from "@/components/landing/MeshGradient";
import { DashboardSidebar } from "@/components/dashboard/Sidebar";

const DashboardLayout = () => {
  return (
    <div className="relative min-h-screen overflow-x-hidden font-display">
      <MeshGradient />
      <div className="relative flex min-h-screen">
        <DashboardSidebar />
        <main className="flex-1 px-5 md:px-9 py-7 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
