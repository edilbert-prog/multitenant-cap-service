import React, { useContext, useEffect, useRef, useState } from 'react';
import {
    ChartLine,
    ChartNetwork,
    ClockAlert,
    LayoutDashboard,
    LogOut,
    Menu,
    MonitorCog,
    MonitorPlay,
    Settings,
    User as UserIcon,
    X,
} from 'lucide-react';
// @ts-ignore
import user from '../../assets/user.png';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import SidebarContext from '../SidebarNav/SidebarContext';

type Props = {
    children?: React.ReactNode;
};

interface SidebarContextValue {
    selectFirstSprint: () => void;
}

interface UnderlineStyle {
    left: number;
    width: number;
}

interface MenuItem {
    MenuName: string;
    RouteName: string;
    icon: React.ReactNode;
    Route: string | null;
}

export default function Header(_props: Props) {
    const navigate = useNavigate();
    const location = useLocation();
    const currentRoute: string = location.pathname.replace('/', '');

    const [isScrolled, setIsScrolled] = useState<boolean>(false);
    const [menuOpen, setMenuOpen] = useState<boolean>(false);
    const [profileOpen, setProfileOpen] = useState<boolean>(false);
    const [activeMenu, setActiveMenu] = useState<string | null>(currentRoute);
    const [activeRoute, setActiveRoute] = useState<string | null>(currentRoute);
    const [underlineStyle, setUnderlineStyle] = useState<UnderlineStyle>({ left: 0, width: 0 });

    const menuRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
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

    const { selectFirstSprint } = useContext(SidebarContext) as SidebarContextValue;

    const profileRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const handleScroll = (): void => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent): void => {
            if (!profileRef.current?.contains(e.target as Node)) {
                setProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleProfileClick = (): void => setProfileOpen((prev) => !prev);
    const handleMenuToggle = (): void => setMenuOpen((prev) => !prev);
    const closeAllMenus = (): void => {
        setProfileOpen(false);
        setMenuOpen(false);
    };

    const MenuItems: ReadonlyArray<MenuItem> = [
        {
            MenuName: 'Dashboard',
            Route: '/',
            icon: <LayoutDashboard className="w-4" />,
            RouteName: 'Dashboard',
        },
        {
            MenuName: 'Impact Analysis',
            RouteName: 'ImpactAnalysis',
            icon: <ChartLine className="w-4" />,
            Route: '/ImpactAnalysis',
        },
        {
            MenuName: 'Test Design Studio',
            RouteName: 'Projects',
            icon: <ChartNetwork className="w-4" />,
            Route: '/ProjectDetails',
        },
        {
            MenuName: 'Test Automation',
            RouteName: 'TestAutomation',
            icon: <MonitorCog className="w-4" />,
            Route: '/TestAutomation',
        },
        {
            MenuName: 'Test Execution',
            RouteName: 'TestExecution',
            icon: <MonitorPlay className="w-4" />,
            Route: '/TestExecution',
        },
        {
            MenuName: 'Incident Management',
            RouteName: 'IncidentManagement',
            icon: <ClockAlert className="w-4" />,
            Route: '/IncidentManagement',
        },
        {
            MenuName: 'Settings',
            RouteName: 'Settings',
            icon: <Settings className="w-4" />,
            Route: '/Settings',
        },
    ] as const;

    // @ts-ignore
    return (
        <header
            className={`sticky top-0 z-50 w-full backdrop-blur header bg-white transition-shadow ${
                isScrolled ? 'shadow-md' : ''
            }`}
        >
            <div className="max-w-8xl mx-auto px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <div className="relative">
                        <nav className="hidden md:flex gap-6 relative">
                            {MenuItems.map((item) => (
                                <Link
                                    to={(item.Route ? item.Route : null) as unknown as string}
                                    key={item.RouteName}
                                    ref={(el: HTMLAnchorElement | null) => (menuRefs.current[item.RouteName] = el)}
                                    onClick={() => {
                                        if (item.Route) {
                                            setActiveMenu(item.RouteName ? item.RouteName : null);
                                            setActiveRoute(item.Route ? item.Route : null);
                                            closeAllMenus();
                                            if (item.RouteName === 'ProjectDetails') {
                                                selectFirstSprint();
                                            }
                                        }
                                    }}
                                    className={`flex items-center relative cursor-pointer pb-1 transition text-[0.92rem] font-medium ${
                                        activeRoute === item.Route
                                            ? 'text-[#891be9] font-semibold'
                                            : 'text-gray-600 hover:text-[#891be9]'
                                    }`}
                                >
                                    <span className="mr-1">{item.icon} </span> {item.MenuName}
                                </Link>
                            ))}
                            <span
                                className="absolute bottom-0 h-[2.2px] bg-[#8c2be0fc] rounded transition-all duration-300"
                                style={{
                                    left: underlineStyle.left,
                                    width: underlineStyle.width,
                                }}
                            />
                        </nav>
                    </div>
                </div>
                <div className="relative flex items-center gap-2">
                    <button className="md:hidden" onClick={handleMenuToggle}>
                        {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>

                    <div
                        className="flex items-center gap-2 cursor-pointer relative"
                        onClick={handleProfileClick}
                        ref={profileRef}
                    >
                        <img src={user} alt="Profile" className="w-9 h-9 rounded-full" />
                        <div className="hidden md:flex flex-col text-sm">
                            <span className="font-medium">John Gera</span>
                            <span className="text-gray-500">Admin</span>
                        </div>

                        {profileOpen && (
                            <div className="absolute top-12 right-0 w-44 bg-white rounded-xl shadow-lg border p-2 space-y-1 z-50">
                                <button
                                    className="flex cursor-pointer items-center gap-2 px-4 py-2 hover:bg-gray-100 w-full text-left"
                                    onClick={closeAllMenus}
                                >
                                    <UserIcon className="w-4 h-4" /> My Profile
                                </button>
                                <button
                                    className="flex cursor-pointer items-center gap-2 px-4 py-2 hover:bg-gray-100 w-full text-left"
                                    onClick={() => {
                                        sessionStorage.removeItem('UserSession');
                                        navigate('/Login');
                                    }}
                                >
                                    <LogOut className="w-4 h-4" /> Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
