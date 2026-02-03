import { useEffect } from 'react';
import LeftSidebar from './LeftSidebar';

interface MobileLeftSidebarDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function MobileLeftSidebarDrawer({ open, onClose }: MobileLeftSidebarDrawerProps) {
  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      {/* Scrim overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        className={`fixed top-0 left-0 bottom-0 w-64 bg-background z-50 lg:hidden transition-transform duration-300 ease-in-out overflow-y-auto ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4">
          <LeftSidebar isMobileDrawer />
        </div>
      </div>
    </>
  );
}
