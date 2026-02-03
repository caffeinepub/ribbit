import { Outlet, useRouterState } from '@tanstack/react-router';
import Header from './Header';
import Footer from './Footer';
import MobileLeftSidebarDrawer from './MobileLeftSidebarDrawer';
import { useState, useEffect } from 'react';

export default function Layout() {
  const [mobileLeftSidebarOpen, setMobileLeftSidebarOpen] = useState(false);
  const routerState = useRouterState();

  // Close drawer on route change
  useEffect(() => {
    setMobileLeftSidebarOpen(false);
  }, [routerState.location.pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header onMobileLeftSidebarToggle={() => setMobileLeftSidebarOpen(true)} />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <MobileLeftSidebarDrawer
        open={mobileLeftSidebarOpen}
        onClose={() => setMobileLeftSidebarOpen(false)}
      />
    </div>
  );
}
