import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import SidebarAdmin from './SidebarAdmin';
import HeaderAdmin from './HeaderAdmin';

export default function LayoutAdmin() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex font-sans text-slate-800 p-2 md:p-4 print:p-0 print:bg-white">
      <div className="print:hidden">
        <SidebarAdmin isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      </div>
      
      <div className="flex-1 flex flex-col lg:ml-72 min-h-[calc(100vh-2rem)] transition-all duration-300 print:ml-0 print:min-h-0">
        <div className="print:hidden">
          <HeaderAdmin setIsOpen={setSidebarOpen} />
        </div>
        
        <main className="flex-1 mt-4 rounded-[2rem] overflow-x-hidden print:mt-0 print:overflow-visible">
          <div className="max-w-7xl mx-auto h-full print:max-w-none">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}