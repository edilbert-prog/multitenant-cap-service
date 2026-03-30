import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { CheckCircle, PlayCircle, History, Database } from 'lucide-react';

interface ValidationLayoutProps {
  children: React.ReactNode;
}

interface MenuItem {
  MenuName: string;
  RouteName: string;
  icon: React.ReactNode;
  Route: string;
}

interface UnderlineStyle {
  left: number;
  width: number;
}

export default function ValidationLayout({ children }: ValidationLayoutProps) {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [activeMenu, setActiveMenu] = useState<string | null>(location.pathname);
  const [activeRoute, setActiveRoute] = useState<string | null>(location.pathname);
  const [underlineStyle, setUnderlineStyle] = useState<UnderlineStyle>({ left: 0, width: 0 });
  const menuRefs = useRef<Record<string, HTMLAnchorElement | null>>({});

  // Get folder from URL to maintain context
  const folderId = searchParams.get('folder');

  useEffect(() => {
    const el = activeMenu ? menuRefs.current[activeMenu] : null;
    if (el) {
      const rect = el.getBoundingClientRect();
      const containerRect = el.parentElement!.getBoundingClientRect();
      setUnderlineStyle({
        left: rect.left - containerRect.left,
        width: rect.width,
      });
    }
  }, [activeMenu]);

  const MenuItems: ReadonlyArray<MenuItem> = [
    {
      MenuName: 'Workflows',
      RouteName: 'ValidationList',
      icon: <CheckCircle className="w-4" />,
      Route: '/validation/workflows',
    },
    {
      MenuName: 'Run Workflow',
      RouteName: 'ValidationRun',
      icon: <PlayCircle className="w-4" />,
      Route: '/validation/run',
    },
    {
      MenuName: 'Workflow Results',
      RouteName: 'ValidationResults',
      icon: <History className="w-4" />,
      Route: '/validation/results',
    },
    {
      MenuName: 'SAP Tables',
      RouteName: 'ValidationSAPTables',
      icon: <Database className="w-4" />,
      Route: '/validation/sap-tables',
    },
  ] as const;

  // Build route with folder parameter if present
  const getRouteWithFolder = (baseRoute: string) => {
    if (folderId) {
      return `${baseRoute}?folder=${folderId}`;
    }
    return baseRoute;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Top Navigation Bar - Sticky */}
      <div className="sticky top-0 z-10 pr-6 py-4 pl-8 w-full gap-12 bg-white border-b border-b-gray-200 shadow-xs flex items-center">
        <div className="flex items-center">
          <div>
            <p className="font-semibold text-xl">Data Validation</p>
            <p className="font-medium pt-1 text-[#616161]">Compare and validate data across sources</p>
          </div>
          <nav className="hidden pl-8 md:flex gap-6 relative">
            {MenuItems.map((item) => (
              <Link
                to={getRouteWithFolder(item.Route)}
                key={item.RouteName}
                ref={(el: HTMLAnchorElement | null) => (menuRefs.current[item.RouteName] = el)}
                onClick={() => {
                  setActiveMenu(item.RouteName);
                  setActiveRoute(item.Route);
                }}
                className={`flex items-center relative cursor-pointer text-sm border rounded-lg px-3 py-2 transition text-[0.92rem] font-medium ${
                  activeRoute === item.Route
                    ? 'border-[#AA95FF] bg-[#F3F1FF] text-[#1C004F]'
                    : 'border-[#E3E3E3] text-[#1A1A1A]'
                }`}
              >
                <span className="pr-1.5">{item.icon}</span> {item.MenuName}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Content Area - Scrollable */}
      <div className="px-5 py-3">
        {children}
      </div>
    </div>
  );
}
