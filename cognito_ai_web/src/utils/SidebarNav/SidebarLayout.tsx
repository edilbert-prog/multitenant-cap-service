import React, { useEffect, useReducer, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Link, useLocation, useNavigate, useSearchParams, useParams } from "react-router-dom";
import {
    ChartLine,
    HomeIcon,
    LogOut,
    MonitorCog,
    MonitorPlay,
    SettingsIcon,
    User,
    CheckCircle,
    Folder,
    ChevronDown,
    ChevronUp,
    ChevronRight,
} from "lucide-react";
import SidebarContext from "./SidebarContext";
import user from "../../assets/user.png";
import { BiDotsHorizontalRounded } from "react-icons/bi";
import { AiContentGenerator01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
// import { useAuth } from "../AuthContext";
import { useFolderTree, useValidation } from "../../api/validation/hooks";
import ProjectMenu from "./ProjectMenu";
import { getDecryptedData, storeEncryptedData } from "../helpers/storageHelper";
import ProjectFolders from "./ProjectFolders";

const setSearchParam = (search: string, key: string, value: any) => {
    const sp = new URLSearchParams(search || "");
    if (value === undefined || value === null || value === "") sp.delete(key);
    else sp.set(key, String(value));
    const qs = sp.toString();
    return qs ? `?${qs}` : "";
};

const getActiveTabFromURL = (pathname: string, search: string) => {
    const sp = new URLSearchParams(search || "");
    const tab = sp.get("tab");
    if (tab) return tab;
    if (pathname === "/ProjectDetails") return "ProjectDetails";
    if (pathname === "/TestAutomation") return "TestAutomation";
    if (pathname === "/TestExecution") return "TestExecution";
    if (pathname === "/ImpactAnalysis") return "ImpactAnalysis";
    return "";
};

/* ---------------- SidebarLayout ---------------- */
export default function SidebarLayout({ children }: any) {
    const location = useLocation();
    const navigate = useNavigate();
    // const { logout } = useAuth();
    const [searchParams] = useSearchParams();
    const params = useParams();

    const searchParamsLegacy = new URLSearchParams(location.search);
    const ProjectNameFromUrl = searchParamsLegacy.get("PJN");
    const SprintNameFromUrl = searchParamsLegacy.get("SPRN");

    // Validation folder tracking (Tools section)
    const folderIdFromUrl = searchParams.get("folder");
    const validationIdFromUrl = params.id; // from /validation/workflows/:id/edit
    const { data: validation } = useValidation(validationIdFromUrl ? Number(validationIdFromUrl) : 0);

    const [collapsed, setCollapsed] = useState(false);
    const [validationOpen, setValidationOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [CurrClientDetails, setCurrClientDetails] = useState();
    const profileRef = useRef<any>(null);
    const settingsRef = useRef<any>(null);
    const menuRefs = useRef<Record<string, HTMLElement | null>>({});

    const { data: folders = [] } = useFolderTree();

    const loadFromLocalStorage = <T,>(key: string, defaultValue: T): T => {
        try {
            const stored = localStorage.getItem(`validationView.${key}`);
            return stored ? JSON.parse(stored) : defaultValue;
        } catch {
            return defaultValue;
        }
    };

    const activeFolderId = (() => {
        if (folderIdFromUrl) return Number(folderIdFromUrl);
        if (validation?.folder_id) return validation.folder_id;
        const storedFolderIds = loadFromLocalStorage<number[]>('selectedFolderIds', []);
        if (storedFolderIds.length === 1) return storedFolderIds[0];
        return null;
    })();

     useEffect(() => {
         storeEncryptedData("UserSession", JSON.stringify(
            {
            "username": "admin",
            "email": "admin@cognitoai.com",
            "first_name": "Admin",
            "last_name": "User",
            "roles": [],
            "permissions": [],
            "ClientId": "CLID-4",
            "Email": "admin@cognitoai.com",
            "FirstName": "Super",
            "LastName": "Admin"
        }));
    },[])

    useEffect(() => {
        if (location.pathname.startsWith('/validation')) {
            setValidationOpen(true);
        }
    }, [location.pathname]);

    useEffect(() => {
        let UserSession = getDecryptedData("UserSession");
        if (UserSession) {
            setCurrClientDetails( UserSession);
        }
        const handleClickOutside = (e: any) => {
            if (!profileRef.current?.contains(e.target)) {
                // no-op
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const handleClickOutside = (e: any) => {
            if (!settingsRef.current?.contains(e.target)) setSettingsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Tools nav helpers
    const getFolderNavigationUrl = (folderId: number) => {
        const currentPath = location.pathname;
        if (currentPath === '/validation/workflows') return `/validation/workflows?folder=${folderId}`;
        if (currentPath === '/validation/results') return `/validation/results?folder=${folderId}`;
        if (currentPath.includes('/validation/workflows/') && currentPath.includes('/edit')) {
            return `/validation/workflows?folder=${folderId}`;
        }
        if (currentPath.includes('/validation/results/')) {
            return `/validation/results?folder=${folderId}`;
        }
        return `/validation/workflows?folder=${folderId}`;
    };

    const getProjectNavigationUrl = (projectId: number) => {
        const currentPath = location.pathname;
        if (currentPath === '/validation/workflows') return `/validation/workflows?project=${projectId}`;
        if (currentPath === '/validation/results') return `/validation/results?project=${projectId}`;
        if (currentPath.includes('/validation/workflows/') && currentPath.includes('/edit')) {
            return `/validation/workflows?project=${projectId}`;
        }
        if (currentPath.includes('/validation/results/')) {
            return `/validation/results?project=${projectId}`;
        }
        return `/validation/workflows?project=${projectId}`;
    };


    const navigateTopMenu = (menuItem: any) => {
        const sp = new URLSearchParams(location.search);
        const nextSearch = setSearchParam(`?${sp.toString()}`, "tab", menuItem.RouteName);
        if (menuItem.RouteName === "ProjectDetails") {
            navigate(`/ProjectDetails${nextSearch}`);
        } else {
            navigate(`${menuItem.Route}${nextSearch}`);
        }
    };

    return (
        <div className="flex h-screen">
            {/* Sidebar */}
            <motion.aside
                animate={{ width: collapsed ? 64 : 299 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="bg-white shadow-sm h-full  flex flex-col justify-between relative pl-3 pr-2"
            >
                <div className="h-full overflow-y-auto HiddenLeftNavScrollbar">
                    <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"} h-16 py-12`}>
                        {!collapsed && <p className="font-semibold text-xl pl-2">Cognito AI Testing</p>}
                        <button onClick={() => setCollapsed((p) => !p)} className="flex cursor-pointer items-center justify-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 18 18" fill="none">
                                <path
                                    d="M1.5 9C1.5 6.23315 1.5 4.84972 2.11036 3.86908C2.33618 3.50627 2.61668 3.1907 2.93918 2.93666C3.81087 2.25 5.04058 2.25 7.5 2.25H10.5C12.9594 2.25 14.1891 2.25 15.0608 2.93666C15.3833 3.1907 15.6638 3.50627 15.8896 3.86908C16.5 4.84972 16.5 6.23315 16.5 9C16.5 11.7669 16.5 13.1503 15.8896 14.1309C15.6638 14.4937 15.3833 14.8093 15.0608 15.0633C14.1891 15.75 12.9594 15.75 10.5 15.75H7.5C5.04058 15.75 3.81087 15.75 2.93918 15.0633C2.61668 14.8093 2.33618 14.4937 2.11036 14.1309C1.5 13.1503 1.5 11.7669 1.5 9Z"
                                    stroke="#8A8A8A"
                                    strokeWidth="1.5"
                                />
                                <path d="M7.125 2.25L7.125 15.75" stroke="#8A8A8A" strokeWidth="1.5" strokeLinejoin="round" />
                                <path d="M3.75 5.25H4.5M3.75 7.5H4.5" stroke="#8A8A8A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </div>

                    <div className="space-y-1 mb-4">
                        <Link
                            to="/"
                            className={`flex items-center ${collapsed ? "justify-center px-2" : "px-2"} py-2 rounded-md text-sm font-medium transition ${location.pathname === "/" ? "text-white font-semibold bg-[#0071E9]" : "text-gray-700 hover:bg-gray-100"
                                }`}
                        >
                            <HomeIcon size={20} />
                            {!collapsed && <span className="ml-3">Home</span>}
                        </Link>
                        <Link
                            to="/Settings"
                            className={`flex items-center ${collapsed ? "justify-center px-2" : "px-2"} py-2 rounded-md text-sm font-medium transition ${location.pathname.startsWith("/Settings") ? "text-white font-semibold bg-[#0071E9]" : "text-gray-700 hover:bg-gray-100"
                                }`}
                        >
                            <SettingsIcon size={20} />
                            {!collapsed && <span className="ml-3">Setup</span>}
                        </Link>
                    </div>

                    <div className="pt-1">
                        <ProjectFolders collapsed={collapsed} location={location} navigateFn={navigate} />
                    </div>

                    {/* Data Validation (Tools) */}
                    {!collapsed && (
                        <div className="border-t pt-4 mt-4 border-t-[#F3F3F3] pb-20">
                            <div className="flex items-center px-2 mb-2">
                                <span className="text-xs text-[#8A8A8A] font-medium uppercase tracking-wide">Tools</span>
                            </div>
                            <div className="space-y-1">
                                <div className="space-y-1">
                                    <div className="flex items-center px-2 py-2 rounded-md text-sm font-medium transition">
                                        <Link
                                            to="/validation/workflows"
                                            className={`flex items-center flex-1 cursor-pointer ${location.pathname.startsWith("/validation")
                                                ? "text-[#7126FF] font-semibold"
                                                : "text-gray-700 hover:text-[#7126FF]"
                                                }`}
                                        >
                                            <CheckCircle
                                                size={20}
                                                className={
                                                    location.pathname.startsWith("/validation") ? "text-[#7126FF]" : "text-gray-500"
                                                }
                                            />
                                            <span className="ml-3">Data Validation</span>
                                        </Link>
                                        <button
                                            className="p-1 hover:bg-gray-200 rounded"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setValidationOpen(!validationOpen);
                                            }}
                                        >
                                            {validationOpen ? (
                                                <ChevronUp className="w-5 h-5 text-[#7126FF]" />
                                            ) : (
                                                <ChevronDown className="w-5 h-5 text-gray-500" />
                                            )}
                                        </button>
                                    </div>

                                    {validationOpen && (
                                        <div className="ml-4 space-y-0.5">
                                            {folders.map((projectGroup) => {
                                                const projectFolders = projectGroup.folders || [];
                                                const renderFolder = (folder, depth = 0) => {
                                                    const hasChildren = folder.children && folder.children.length > 0;
                                                    const showChildren = hasChildren;
                                                    const isOpen = false; // simplified: collapsed state per-folder could be added if needed
                                                    const FolderIc = Folder;
                                                    const paddingLeft = `${depth * 16}px`;
                                                    const isActive = activeFolderId === folder.folder_id;

                                                    return (
                                                        <div key={folder.folder_id}>
                                                            <div
                                                                className={`relative flex items-center px-2 py-1.5 rounded-md text-sm transition ${isActive
                                                                    ? "bg-[#F8F7FF] text-[#7126FF] font-semibold"
                                                                    : "hover:bg-gray-100"
                                                                    }`}
                                                                style={{ paddingLeft }}
                                                            >
                                                                {showChildren ? (
                                                                    <button
                                                                        className="mr-1 p-0.5 hover:bg-gray-200 rounded"
                                                                    // (optional) toggle local open state
                                                                    >
                                                                        <ChevronRight className={`w-4 h-4 ${isActive ? 'text-[#7126FF]' : 'text-gray-500'}`} />
                                                                    </button>
                                                                ) : (
                                                                    <div className="w-5 mr-1" />
                                                                )}

                                                                <Link
                                                                    to={getFolderNavigationUrl(folder.folder_id)}
                                                                    className="flex items-center flex-1 cursor-pointer"
                                                                >
                                                                    <FolderIc className="w-4 h-4" style={{ color: folder.color || "#6B7280" }} />
                                                                    <span className={`ml-2 truncate flex-1 ${isActive ? 'text-[#7126FF] font-semibold' : 'text-gray-700'
                                                                        }`}>
                                                                        {folder.folder_name}
                                                                    </span>
                                                                    {folder.validation_count > 0 && (
                                                                        <span className={`ml-auto text-xs ${isActive ? 'text-[#7126FF]' : 'text-gray-500'
                                                                            }`}>
                                                                            {folder.validation_count}
                                                                        </span>
                                                                    )}
                                                                </Link>
                                                            </div>

                                                            {isOpen && showChildren && (
                                                                <div className="mt-0.5">
                                                                    {folder.children.map((child) => renderFolder(child, depth + 1))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                };

                                                const projectIsOpen = false; // simplified
                                                const hasProjectFolders = projectFolders.length > 0;

                                                return (
                                                    <div key={projectGroup.projectId}>
                                                        <div className="relative flex items-center px-2 py-1.5 rounded-md text-sm transition hover:bg-gray-100">
                                                            {hasProjectFolders ? (
                                                                <button className="mr-1 p-0.5 hover:bg-gray-200 rounded">
                                                                    <ChevronRight className="w-4 h-4 text-gray-500" />
                                                                </button>
                                                            ) : (
                                                                <div className="w-5 mr-1" />
                                                            )}
                                                            <Link
                                                                to={getProjectNavigationUrl(projectGroup.projectId)}
                                                                className="flex items-center flex-1 cursor-pointer"
                                                            >
                                                                <Folder className="w-4 h-4" style={{ color: projectGroup.projectColor || "#3b82f6" }} />
                                                                <span className="ml-2 truncate flex-1 text-gray-700 font-medium">
                                                                    {projectGroup.projectName}
                                                                </span>
                                                                {projectGroup.validationCount > 0 && (
                                                                    <span className="ml-auto text-xs text-gray-500">
                                                                        {projectGroup.validationCount}
                                                                    </span>
                                                                )}
                                                            </Link>
                                                        </div>

                                                        {projectIsOpen && hasProjectFolders && (
                                                            <div className="mt-0.5 ml-4">
                                                                {projectFolders.map((folder) => renderFolder(folder, 0))}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>



                {/* Footer (Profile) */}
                <div className="border border-[#E3E3E3] bg-white rounded-xl px-3 py-3 bottom-5 relative" ref={settingsRef}>
                    <div className={`flex ${collapsed ? "justify-center" : "justify-between"} items-center`}>
                        {collapsed ? (
                            <div className="flex items-center justify-center">
                                <button
                                    onClick={() => setSettingsOpen((prev) => !prev)}
                                    className="flex flex-col items-center justify-center gap-1 p-2 hover:bg-gray-100 rounded cursor-pointer"
                                >
                                    <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
                                    <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
                                    <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-3" ref={profileRef}>
                                    <img src={user} alt="User" className="w-7 h-7 rounded-full object-cover" />
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-sm text-[#1A1A1A]">
                                            {`${(CurrClientDetails as any)?.FirstName ?? ""} ${(CurrClientDetails as any)?.LastName ?? ""}`}
                                        </span>
                                        <span className="text-xs text-[#616161]">{(CurrClientDetails as any)?.RoleName ?? ""}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSettingsOpen((prev) => !prev)}
                                    className="flex items-center text-gray-700 cursor-pointer text-sm hover:bg-gray-100 rounded"
                                >
                                    <BiDotsHorizontalRounded className="w-6 h-6" />
                                </button>
                            </>
                        )}
                    </div>
                    {settingsOpen && (
                        <div
                            className={`absolute bottom-14 ${collapsed ? "left-16 transform" : "right-3"} w-44 bg-white rounded-xl shadow-lg border border-gray-300 p-2 space-y-1 z-50`}
                        >
                            <button
                                className="flex border-b cursor-pointer border-gray-200 items-center gap-2 px-4 py-2 hover:bg-gray-100 w-full text-left"
                                onClick={() => navigate("/UserManagement")}
                            >
                                <User className="w-4 h-4" /> My Profile
                            </button>
                            <button
                                className="flex items-center cursor-pointer gap-2 px-4 py-2 hover:bg-gray-100 w-full text-left text-red-500"
                                onClick={() => {
                                    logout();
                                }}
                            >
                                <LogOut className="w-4 h-4" /> Logout
                            </button>
                        </div>
                    )}
                </div>
            </motion.aside>

            {/* Right-side content */}
            <div className="flex-1 overflow-y-auto border-l border-l-[#F3F3F3] ">
                {location.pathname !== "/Settings" &&
                    location.pathname !== "/connection-vault/connectors" &&
                    location.pathname !== "/" &&
                    !location.pathname.startsWith("/validation") ? (
                    <div className="pr-6 py-4 pl-8 w-full gap-12 bg-white border-b border-b-gray-200 shadow-xs flex items-center">
                        <div className="flex items-center ">
                            <div className=" ">
                                <p className="font-semibold text-xl">{ProjectNameFromUrl}</p>
                                <p className="font-medium pt-1 text-[#616161]">{SprintNameFromUrl}</p>
                            </div>
                            <nav className="hidden pl-8 md:flex gap-6 relative">
                                {[
                                    {
                                        MenuName: "Test Design Studio",
                                        RouteName: "ProjectDetails",
                                        icon: <HugeiconsIcon size={17} icon={AiContentGenerator01Icon} />,
                                        Route: "/ProjectDetails",
                                    },
                                    { MenuName: "Test Automation", RouteName: "TestAutomation", icon: <MonitorCog className="w-4" />, Route: "/TestAutomation" },
                                    { MenuName: "Test Execution", RouteName: "TestExecution", icon: <MonitorPlay className="w-4" />, Route: "/TestExecution" },
                                    { MenuName: "Impact Analysis", RouteName: "ImpactAnalysis", icon: <ChartLine className="w-4" />, Route: "/ImpactAnalysis" },
                                ].map((item) => {
                                    const sp = new URLSearchParams(location.search);
                                    sp.set("tab", item.RouteName);
                                    const toHref = `${item.Route}?${sp.toString()}`;
                                    const isActive = getActiveTabFromURL(location.pathname, location.search) === item.RouteName;

                                    return (
                                        <Link
                                            to={toHref}
                                            key={item.RouteName}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                navigateTopMenu(item);
                                            }}
                                            className={`flex items-center relative cursor-pointer text-sm border rounded-lg px-3 py-2 transition text-[0.92rem] font-medium ${isActive ? "border-[#0071E9] bg-[#0071E9] text-white" : "border-[#0071E9] text-[#005ABA]"
                                                }`}
                                        >
                                            <span className="pr-1.5">{item.icon}</span> {item.MenuName}
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>
                    </div>
                ) : (
                    ""
                )}

                <SidebarContext.Provider
                    value={{
                        toggleCollapse: (flag) => setCollapsed(flag),
                    }}
                >
                    {location.pathname.startsWith("/validation") ? children : <div className="px-5 py-3">{children}</div>}
                </SidebarContext.Provider>
            </div>
        </div>
    );
}
