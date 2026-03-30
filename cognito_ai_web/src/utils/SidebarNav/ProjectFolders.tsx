import { createPortal } from "react-dom";
import { Loader2, Plus, Check, Edit3, Trash2 } from "lucide-react";
import { BiSolidDownArrow, BiSolidRightArrow } from "react-icons/bi";
import { PiFolderFill, PiBuildings } from "react-icons/pi";
import { FaDiagramProject } from "react-icons/fa6";
import { TbSubtask } from "react-icons/tb";
import DropdownV2 from "../../utils/DropdownV2";
import CustomModal from "../../utils/CustomModal";
import SprintForm from "../../components/TestDesignStudio/ProjectSprintDocs/SprintForm";
import SprintBPMapping from "../../components/TestDesignStudio/ProjectSprintDocs/SprintBPMapping";
import Projects from "../../components/TestDesignStudio/ProjectSprintDocs/Projects";
import { getDecryptedData } from "../helpers/storageHelper.js";
import transformApiDataToTree, { transformProcessesResponse } from "../helpers/LeftNavProjectParser.jsx";
import { apiRequest } from "../helpers/ApiHelper";
import { useEffect, useRef, useState } from "react";
import TooltipV2 from "../TooltipV2.js";

export type TreeNode = {
  key: string;
  type?: "project" | "sprint" | "businessprocess" | "subprocess";
  label: string;
  icon?: React.ReactNode;
  route?: string;
  children?: TreeNode[];
  ClientId?: string | number;
  BusinessUnitId?: string | number;
  BusinessUnitName?: string;
  ProjectId?: string | number;
  ProjectName?: string | number;
  SprintId?: string | number; // FolderId
  SprintName?: string;
  ParentFolderId?: string | null;
  BusinessProcessId?: string | number;
  BusinessProcessName?: string;
  BusinessSubProcessId?: string | number;
  BusinessSubProcessName?: string;
  SubProccessId?: string | number;
  SubProccessName?: string;
  __SubFolders?: any[];
};

export type ProjectMenuProps = {
  collapsed: boolean;
  location: any; // react-router location
  navigateFn: (url: string) => void;
};

/* ---------------- Utilities ---------------- */
function checkActive(node: any, location: any) {
  const p = new URLSearchParams(location.search);
  const sprId = p.get("SPRID") ?? "";
  const bpId = p.get("BPID") ?? "";
  const spId = p.get("SPID") ?? "";

  const isSprintMatch = node.SprintId && String(node.SprintId) === String(sprId);
  const isBPMatch =
    node.BusinessProcessId &&
    String(node.BusinessProcessId) === String(bpId) &&
    (!sprId || (node.SprintId && String(node.SprintId) === String(sprId)));
  const nodeSubId = node.BusinessSubProcessId ?? node.SubProccessId;
  const isSPMatch =
    nodeSubId &&
    String(nodeSubId) === String(spId) &&
    (!sprId || (node.SprintId && String(node.SprintId) === String(sprId)));
  const isRouteMatch =
    !node.SprintId &&
    !node.ProjectId &&
    node.route &&
    location.pathname === new URL(node.route, window.location.origin).pathname;

  let hasActiveChild = false;
  let hasActiveBPDescendant = false;
  let hasActiveSPDescendant = false;

  if (Array.isArray(node.children) && node.children.length) {
    for (const child of node.children) {
      const c = checkActive(child, location);
      if (c.isSelfActive || c.hasActiveChild) hasActiveChild = true;
      if (c.isSelfBP || c.hasActiveBPDescendant) hasActiveBPDescendant = true;
      if (c.isSelfSP || c.hasActiveSPDescendant) hasActiveSPDescendant = true;
    }
  }

  const isSelfSprint = !!isSprintMatch;
  const isSelfBP = !!isBPMatch;
  const isSelfSP = !!isSPMatch;
  const isSelfActive = !!(isSelfSprint || isSelfBP || isSelfSP || isRouteMatch);

  return {
    isSelfActive,
    isSelfSprint,
    isSelfBP,
    isSelfSP,
    hasActiveChild,
    hasActiveBPDescendant,
    hasActiveSPDescendant,
  };
}

const setSearchParam = (search: string, key: string, value: any) => {
  const sp = new URLSearchParams(search || "");
  if (value === undefined || value === null || value === "") sp.delete(key);
  else sp.set(key, String(value));
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
};

function buildProjectDetailsURLFromNode(node: any, overrides: any = {}) {
  const base: Record<string, any> = {
    CLId: node.ClientId,
    BUID: node.BusinessUnitId,
    BUNM: node.BusinessUnitName,
    PJID: node.ProjectId,
    PJN: node.ProjectName,
    SPRID: node.SprintId,
    SPRN: node.SprintName,
    BPID: overrides.BPID ?? node.BusinessProcessId,
    BPN: overrides.BPN ?? node.BusinessProcessName,
    SPID: overrides.SPID ?? node.BusinessSubProcessId ?? node.SubProccessId,
    BSPN: overrides.BSPN ?? node.BusinessSubProcessName ?? node.SubProccessName,
  };

  const params = new URLSearchParams();
  ["CLId", "BUID", "BUNM", "PJID", "PJN", "SPRID", "SPRN", "BPID", "BPN", "SPID", "BSPN"].forEach((k) => {
    const v = base[k];
    if (v !== undefined && v !== null && String(v) !== "") params.set(k, String(v));
  });
  return `/ProjectDetails?${params.toString()}`;
}

function ensureProjectDetailsURL(location: any, node: any, extra: Record<string, any> = {}) {
  const pathnameIsPD = location.pathname === "/ProjectDetails";
  const current = new URLSearchParams(location.search);
  const hasBase =
    current.get("CLId") &&
    current.get("BUID") &&
    current.get("PJID") &&
    current.get("PJN") &&
    current.get("SPRID") &&
    current.get("SPRN");

  if (pathnameIsPD && hasBase) {
    const merged = new URLSearchParams(location.search);
    const baseKeys = ["CLId", "BUID", "BUNM", "PJID", "PJN", "SPRID", "SPRN"];
    baseKeys.forEach((k) => {
      const fromNode =
        node?.[k] ??
        (k === "SPRID" ? node?.SprintId : undefined) ??
        (k === "SPRN" ? node?.SprintName : undefined) ??
        (k === "PJID" ? node?.ProjectId : undefined) ??
        (k === "PJN" ? node?.ProjectName : undefined) ??
        (k === "BUID" ? node?.BusinessUnitId : undefined) ??
        (k === "BUNM" ? node?.BusinessUnitName : undefined) ??
        (k === "CLId" ? node?.ClientId : undefined);
      if (fromNode !== undefined && fromNode !== null && String(fromNode) !== "") {
        merged.set(k, String(fromNode));
      }
    });
    Object.entries(extra).forEach(([k, v]) => {
      if (v === null || v === undefined || v === "") merged.delete(k);
      else merged.set(k, String(v));
    });
    return `/ProjectDetails?${merged.toString()}`;
  }
  return buildProjectDetailsURLFromNode(node, extra);
}

type BUOption = { label: string; value: string };

/* ---------------- FOLDER APIs + adapter ---------------- */
async function fetchBusinessUnits(): Promise<BUOption[]> {
  const user = getDecryptedData("UserSession");
  const ClientId = user?.ClientId ?? "";
  const resp = await apiRequest("api/GetBusinessUnitMasterByClientId", { ClientId });
  return resp?.ResponseData ?? [];
}

/** Deep debug for folder tree fetching */
async function fetchProjectsWithFolders(clientId: string, buId: string) {
  console.groupCollapsed("%c[DEBUG] >>> Entering fetchProjectsWithFolders", "color: purple; font-weight: bold;");
  console.log("[DEBUG] args:", { clientId, buId });
  try {
    const resp = await apiRequest("/client-projects/GetClientProjectsWithFolders", {
      ClientId: clientId,
      BusinessUnitId: buId,
    });
    if (!resp) {
      console.error("[DEBUG] fetchProjectsWithFolders: response is undefined/null");
      console.groupEnd();
      return { ResponseData: [] };
    }
    console.log("[DEBUG] fetchProjectsWithFolders: raw keys =", Object.keys(resp));
    console.log("[DEBUG] fetchProjectsWithFolders: ResponseData length =", resp?.ResponseData?.length ?? "N/A");
    console.log("[DEBUG] fetchProjectsWithFolders: sample =", resp?.ResponseData?.[0]);
    if (!resp.ResponseData || !Array.isArray(resp.ResponseData)) {
      console.warn("[DEBUG] fetchProjectsWithFolders: fixing malformed ResponseData", resp);
      console.groupEnd();
      return { ResponseData: [] };
    }
    console.log("%c[DEBUG] <<< fetchProjectsWithFolders resolved OK", "color: purple; font-weight: bold;");
    console.groupEnd();
    return resp;
  } catch (err) {
    console.error("[DEBUG] !!! fetchProjectsWithFolders threw error", err);
    console.groupEnd();
    return { ResponseData: [] };
  }
}

/** Adapt folder payload → sprint shape so the tree code keeps working */
function adaptFoldersToSprintShape(resp: any) {
  console.groupCollapsed("%c[DEBUG] adaptFoldersToSprintShape()", "color:#8e44ad;font-weight:bold");
  const cloned = JSON.parse(JSON.stringify(resp || {}));
  const arr = cloned?.ResponseData ?? [];
  for (const p of arr) {
    const folders = Array.isArray(p.Folders) ? p.Folders : [];
    p.Sprints = folders
      .filter((f: any) => !f.ParentFolderId)
      .map((f: any) => ({
        SprintId: f.FolderId,
        SprintName: f.FolderName,
        ParentFolderId: f.ParentFolderId ?? null,
      }));
    delete p.Folders;
  }
  console.log("[DEBUG] adapted projects:", arr.length);
  console.groupEnd();
  return cloned;
}

async function fetchProjectList(clientId: string, buId: string) {
  return apiRequest("/client-projects/GetClientProjectsByClientId", {
    ClientId: clientId,
    BusinessUnitId: buId,
  });
}

/** BP mapping stays identical – back-end will treat SprintId as FolderId */
async function fetchBPAndSubProcess({ ClientId, BusinessUnitId, ProjectId, SprintId }: any) {
  return apiRequest("/subprocess/GetMappedProjectSprintClientSubProcessesProjectSprintV5", {
    ClientId,
    BusinessUnitId,
    ProjectId,
    SprintId,
  });
}

/* ---------------- Subfolder lookup + decoration ---------------- */
function buildSubfolderLookupFromRaw(raw: any): Record<string, any[]> {
  const map: Record<string, any[]> = {};
  const data = raw?.ResponseData ?? [];
  for (const proj of data) {
    const folders = Array.isArray(proj.Folders) ? proj.Folders : [];
    const visit = (f: any) => {
      if (!f || !f.FolderId) return;
      map[f.FolderId] = Array.isArray(f.SubFolders) ? f.SubFolders : [];
      (f.SubFolders || []).forEach(visit);
    };
    folders.forEach(visit);
  }
  return map;
}

function decorateTreeWithSubfolders(
  groups: { category?: string; items: any[] }[],
  lookup: Record<string, any[]>
) {
  const mapItems = (items: any[]): any[] =>
    (items || []).map((n) => {
      if (n?.type === "sprint" && n?.SprintId && lookup[n.SprintId]) {
        return {
          ...n,
          __SubFolders: lookup[n.SprintId],
          children: Array.isArray(n.children) ? n.children : [],
        };
      }
      if (Array.isArray(n?.children) && n.children.length) {
        return { ...n, children: mapItems(n.children) };
      }
      return n;
    });

  return (groups || []).map((g) => ({
    ...g,
    items: mapItems(g.items || []),
  }));
}

/** Ensure stable keys so openMenus/selection survive refreshes */
function stabilizeTreeKeys(groups: { category?: string; items: any[] }[]) {
  const mapNode = (n: any, parentCtx: any = {}) => {
    const ctx = {
      ClientId: n.ClientId ?? parentCtx.ClientId,
      BusinessUnitId: n.BusinessUnitId ?? parentCtx.BusinessUnitId,
      ProjectId: n.ProjectId ?? parentCtx.ProjectId,
      SprintId: n.SprintId ?? parentCtx.SprintId,
      BusinessProcessId: n.BusinessProcessId ?? parentCtx.BusinessProcessId,
    };

    let key = n.key;
    if (n.type === "project" && ctx.ProjectId) key = `project-${ctx.ProjectId}`;
    else if (n.type === "sprint" && ctx.SprintId) key = `folder-${ctx.SprintId}`;
    else if (n.type === "businessprocess" && ctx.SprintId && ctx.BusinessProcessId) {
      key = `bp-${ctx.ProjectId ?? "p"}-${ctx.SprintId}-${ctx.BusinessProcessId}`;
    } else if (n.type === "subprocess") {
      const spId = n.BusinessSubProcessId ?? n.SubProccessId ?? "sp";
      key = `sp-${ctx.ProjectId ?? "p"}-${ctx.SprintId ?? "s"}-${ctx.BusinessProcessId ?? "b"}-${spId}`;
    }
    const kids = Array.isArray(n.children) ? n.children.map((c: any) => mapNode(c, ctx)) : [];
    return { ...n, key, children: kids };
  };

  return (groups || []).map((g) => ({
    ...g,
    items: (g.items || []).map((it: any) => mapNode(it)),
  }));
}

/* ---------------- Parent map from RAW ---------------- */
function buildFolderParentMapFromRaw(raw: any): Record<string, string | null> {
  const parent: Record<string, string | null> = {};
  const data = raw?.ResponseData ?? [];
  for (const proj of data) {
    const folders = Array.isArray(proj.Folders) ? proj.Folders : [];
    const walk = (f: any, p: string | null) => {
      if (!f?.FolderId) return;
      parent[String(f.FolderId)] = p;
      (f.SubFolders || []).forEach((sf: any) => walk(sf, String(f.FolderId)));
    };
    folders.forEach((f: any) => walk(f, f?.ParentFolderId ? String(f.ParentFolderId) : null));
  }
  return parent;
}

/* ---------------- Small Popover Menu ---------------- */
 /* ---------------- Small Popover Menu ---------------- */
function ActionMenu({
  show,
  anchorRef,
  onClose,
  onCreateFolder,
  onMapBP,
}: {
  show: boolean;
  anchorRef: React.RefObject<HTMLButtonElement>;
  onClose: () => void;
  onCreateFolder: () => void;
  onMapBP: () => void;
}) {
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!show || !anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    setPos({
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX + rect.width + 6,
    });
  }, [show, anchorRef]);

  // Close when clicking outside the menu & the anchor button
  useEffect(() => {
    if (!show) return;

    const handleClickOutside = (e: MouseEvent) => {
      const menuEl = menuRef.current;
      const anchorEl = anchorRef.current;

      // Click inside menu → ignore
      if (menuEl && menuEl.contains(e.target as Node)) return;
      // Click on the button that opened the menu → ignore (the button's own handler will toggle)
      if (anchorEl && anchorEl.contains(e.target as Node)) return;

      onClose();
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [show, onClose, anchorRef]);

  if (!show) return null;

  return createPortal(
    <div
      ref={menuRef}
      style={{ top: pos.top, left: pos.left, position: "absolute", zIndex: 9999 }}
      className="bg-white border border-gray-200 rounded-md shadow-md w-44 py-1"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
        onClick={() => {
          onCreateFolder();
          onClose();
        }}
      >
        Create folder
      </button>
      <button
        className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
        onClick={() => {
          onMapBP();
          onClose();
        }}
      >
        Map business process
      </button>
    </div>,
    document.body
  );
}

function SidebarItem(props: any) {
  const {
    item,
    depth = 0,
    collapsed,
    openMenus,
    setOpenMenus,
    toggleMenu,
    location,
    onSprintOpen,
    loadingByKey,
    navigateFn,
    selectedKey,
    setSelectedKey,
    parentSprintKey = null,
    parentBPKey = null,
    openSprintExclusive,
    openBPExclusive,
    onAddSprintClick,
    onAddSubFolderClick,
    onOpenBPMappingClick,
    inlineAddProjectKey,
    inlineSprintName,
    setInlineSprintName,
    inlineSaving,
    onInlineSave,
    onInlineCancel,
    // rename props
    editingSprintKey,
    editingSprintName,
    setEditingSprintName,
    editingSprintSaving,
    onEditSprintClick,
    onEditSprintSave,
    onEditSprintCancel,
    onDeleteSprintClick,
    setEditingContainerRef,
  } = props;

  const isSprint = item.type === "sprint";
  const isBusinessProcess = item.type === "businessprocess";
  const isSubprocess = item.type === "subprocess";
  const hasChildren = Array.isArray(item.children) && item.children.length > 0;
  const isOpen = !!openMenus[item.key];
  const { isSelfSprint, isSelfBP, isSelfSP, hasActiveChild, hasActiveSPDescendant } =
    checkActive(item, location);

  const baseClasses = "relative flex items-center w-full   py-2 rounded-lg transition";
  const BASE_INDENT = 1;
  const INDENT_STEP = 8;
  const paddingLeft = `${BASE_INDENT + depth * INDENT_STEP}px`;

  const isSelected = selectedKey === item.key;
  const [folderMenuOpen, setFolderMenuOpen] = useState(false);
  const actionBtnRef = useRef<HTMLButtonElement>(null);
  const isEditingThis = isSprint && editingSprintKey === item.key;

  const isRowActive = isSelected && !isEditingThis;
  const textStyle = isRowActive ? { color: "#fff" } : {};
  const iconStyle = { color: isRowActive ? "#fff" : "#4B5563" } as React.CSSProperties;

  const labelBold =
    (isSprint && (isSelfSprint || hasActiveChild)) ||
    (isBusinessProcess && (isSelfBP || hasActiveSPDescendant)) ||
    (isSubprocess && isSelfSP);

  const IconRender = () => {
    if (isBusinessProcess) return <FaDiagramProject style={iconStyle} className="w-3 h-3" />;
    if (isSubprocess) return <TbSubtask style={iconStyle} className="w-4 h-4" />;
    if (item.icon) return <PiFolderFill style={iconStyle} className="w-4 h-4" />;
    return null;
  };

  const maybeAutoCancel = () => {
    if (!editingSprintKey) return;
    onEditSprintCancel?.();
  };

  const openSprintInclusive = (targetKey: string) => {
    setOpenMenus((prev: any) => ({ ...prev, [targetKey]: true }));
  };

  const goToSprint = async (sprintNode: any) => {
    openSprintInclusive(sprintNode.key);
    setSelectedKey(sprintNode.key);
    setFolderMenuOpen(false);
    const url = buildProjectDetailsURLFromNode(sprintNode, {
      BPID: null,
      BPN: null,
      SPID: null,
      BSPN: null,
    });
    navigateFn(url + "&tab=ProjectDetails");
    const hasLoadedKids =
      Array.isArray(sprintNode.children) && sprintNode.children.length > 0;
    if (!hasLoadedKids && onSprintOpen) {
      await onSprintOpen(sprintNode);
    }
  };

  const goToBP = (bpNode: any) => {
    if (parentSprintKey) openSprintInclusive(parentSprintKey);
    openBPExclusive(parentSprintKey, bpNode.key);
    setSelectedKey(bpNode.key);
    setFolderMenuOpen(false);
    const url = ensureProjectDetailsURL(location, bpNode, {
      BPID: bpNode.BusinessProcessId,
      BPN: bpNode.BusinessProcessName,
      SPID: null,
      BSPN: null,
    });
    navigateFn(url + "&tab=ProjectDetails");
  };

  const goToSub = (spNode: any) => {
    if (parentSprintKey) openSprintInclusive(parentSprintKey);
    if (parentBPKey) openBPExclusive(parentSprintKey, parentBPKey);
    setSelectedKey(spNode.key);
    setOpenMenus((prev: any) => ({ ...prev, [spNode.key]: true }));
    setFolderMenuOpen(false);
    const subId = spNode.BusinessSubProcessId ?? spNode.SubProccessId;
    const url = ensureProjectDetailsURL(location, spNode, {
      BPID: spNode.BusinessProcessId,
      BPN: spNode.BusinessProcessName,
      SPID: subId,
      BSPN: spNode.BusinessSubProcessName ?? spNode.SubProccessName,
    });
    navigateFn(url + "&tab=ProjectDetails");
  };

  const handleClickRow = async () => {
    maybeAutoCancel();
    if (isSprint) return goToSprint(item);
    if (isBusinessProcess) return goToBP(item);
    if (isSubprocess) return goToSub(item);
    const hasChildrenLocal = Array.isArray(item.children) && item.children.length > 0;
    if (!hasChildrenLocal && item.route) {
      const sp = new URLSearchParams(location.search);
      const nextSearch = setSearchParam(`?${sp.toString()}`, "tab", "ProjectDetails");
      navigateFn(item.route + nextSearch);
    } else if (hasChildrenLocal) {
      setFolderMenuOpen(false);
      toggleMenu(item.key);
    }
  };

  const handleChevronClick = async (e: any) => {
    e.stopPropagation();
    maybeAutoCancel();
    if (isSprint) {
      const currentlyOpen = !!openMenus[item.key];
      if (currentlyOpen) {
        setOpenMenus((prev: any) => ({ ...prev, [item.key]: false }));
        return;
      }
      await goToSprint(item);
      return;
    }
    if (isBusinessProcess) {
      const currentlyOpen = !!openMenus[item.key];
      if (currentlyOpen) {
        setOpenMenus((prev: any) => ({ ...prev, [item.key]: false }));
        return;
      }
      goToBP(item);
      return;
    }
    if (isSubprocess) {
      const currentlyOpen = !!openMenus[item.key];
      if (currentlyOpen) {
        setOpenMenus((prev: any) => ({ ...prev, [item.key]: false }));
        return;
      }
      goToSub(item);
      return;
    }
    setFolderMenuOpen(false);
    toggleMenu(item.key);
  };

  const isProjectLevel = !!item.ProjectId && !item.SprintId;

  return (
    <div>
      <div
        className={`${baseClasses} group ${isRowActive ? "bg-[#0071E9] text-white" : "text-gray-900"} cursor-pointer ${collapsed ? "justify-center" : ""}`}
        style={{ paddingLeft: collapsed ? "8px" : paddingLeft, position: "relative" }}
        title={item.label}
        onClick={handleClickRow}
      >
        {/* Chevron */}
        {!collapsed && (hasChildren || isSprint) && (
          <button
            className="mr-1 p-1 rounded shrink-0 cursor-pointer"
            onClick={handleChevronClick}
            title={isOpen ? "Collapse" : "Expand"}
          >
            {isOpen ? (
              <BiSolidDownArrow className={`w-3.5 h-3.5 ${isRowActive ? "text-white" : "text-gray-500"}`} />
            ) : (
              <BiSolidRightArrow className={`w-3.5 h-3.5 ${isRowActive ? "text-white" : "text-gray-500"}`} />
            )}
          </button>
        )}
        <IconRender />

        {/* Label / Inline rename */}
        {!collapsed && item.type === "sprint" && editingSprintKey === item.key ? (
          <div className="ml-1 flex-1 relative" ref={(el) => setEditingContainerRef?.(el)}>
            <div className="flex items-center gap-2 w-full">
              <input
                autoFocus
                className="flex-1 rounded-md w-full border border-gray-300 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                value={editingSprintName}
                onChange={(e) => setEditingSprintName?.(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onEditSprintSave?.();
                  if (e.key === "Escape") onEditSprintCancel?.();
                  e.stopPropagation();
                }}
                onClick={(e) => e.stopPropagation()}
                placeholder="Rename folder…"
              />
              <button
                title="Save"
                className="h-7 w-7 shrink-0 rounded-md bg-[#0071E9] text-white grid place-items-center disabled:opacity-60"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditSprintSave?.();
                }}
                disabled={editingSprintSaving || !editingSprintName?.trim()}
              >
                {editingSprintSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              </button>
            </div>
          </div>
        ) : (
          !collapsed && (
            <span
              className={`ml-1 text-sm truncate whitespace-nowrap overflow-hidden text-ellipsis max-w-[180px] ${labelBold ? "font-semibold" : "font-medium"}`}
              title={item.label}
              style={textStyle}
            >
              {item.label}
            </span>
          )
        )}

        {/* Actions */}
        {!collapsed && isProjectLevel && (
          <TooltipV2
            content={
              <div className="">
                Add New Folder
              </div>
            }
            initialPosition=""
          >
            <button
              className={`ml-auto mr-2 p-1 rounded ${isRowActive ? "text-white" : "hover:bg-gray-100  text-gray-600"}   cursor-pointer`}
              onClick={(e) => {
                e.stopPropagation();
                onEditSprintCancel?.();
                onAddSprintClick?.(item);
              }}
            >
              <Plus className={`w-4 h-4 ${isRowActive ? "text-white" : "text-gray-600"}`} />
            </button>
          </TooltipV2>

        )}
        {!collapsed && isSprint && editingSprintKey !== item.key && (
          <div className="ml-auto relative flex items-center">
            <TooltipV2
              content={
                <div className="">
                  Create Folder or Map Business Process
                </div>
              }
              initialPosition=""
            >
              <button
                ref={actionBtnRef}
                className={`p-1 rounded ${isRowActive ? "text-white hover:bg-[#0062ca]" : "hover:bg-gray-100  text-gray-600"}  cursor-pointer`}
                title=""
                onClick={(e) => {
                  e.stopPropagation();
                  setFolderMenuOpen((o) => !o);
                }}
              >
                <Plus className={`w-4 h-4 ${isRowActive ? "text-white" : "text-gray-600"}`} />
              </button>
            </TooltipV2>

            <ActionMenu
              show={folderMenuOpen}
              anchorRef={actionBtnRef}
              onClose={() => setFolderMenuOpen(false)}
              onCreateFolder={() => onAddSubFolderClick?.(item)}
              onMapBP={() => onOpenBPMappingClick?.(item)}
            />
            <TooltipV2
              content={
                <div className="">
                  Rename folder
                </div>
              }
              initialPosition=""
            >
              <button
                className={`ml-1 p-1  rounded cursor-pointer  ${isRowActive ? "text-white hover:bg-[#0062ca]" : "hover:bg-gray-100  text-gray-600"} opacity-0 group-hover:opacity-100 transition-opacity`}
                title=""
                onClick={(e) => {
                  e.stopPropagation();
                  if (editingSprintKey && editingSprintKey !== item.key) onEditSprintCancel?.();
                  onEditSprintClick?.(item);
                }}
              >
                <Edit3 className={`w-4 h-4 ${isRowActive ? "text-white" : "text-gray-600"}`} />
              </button>
            </TooltipV2>


            {/* 3. ADD DELETE BUTTON */}

            <TooltipV2
              content={
                <div className="">
                  Delete folder
                </div>
              }
              initialPosition=""
            >
              <button
                className={`ml-1 p-1 rounded cursor-pointer ${isRowActive ? "text-white hover:bg-[#0062ca]" : "hover:bg-gray-100  text-gray-600"}  opacity-0 group-hover:opacity-100 transition-opacity`}
                title=""
                onClick={(e) => {
                  e.stopPropagation();
                  onEditSprintCancel?.(); // Cancel edit if active
                  onDeleteSprintClick?.(item);
                }}
              >
                <Trash2 className={`w-4 h-4 `} />
              </button>
            </TooltipV2>




          </div>
        )}

        {!collapsed && loadingByKey[item.key] && (
          <div className="ml-2">
            <Loader2 className={`w-4 h-4 animate-spin ${isRowActive ? "text-white" : "text-gray-500"}`} />
          </div>
        )}
      </div>

      {/* Inline Folder Adder */}
      {!collapsed && inlineAddProjectKey === item.key && (
        <div className="px-4 py-2 mt-2">
          <div className="flex justify-between items-center mb-1">
            <label className="block text-[13px] font-medium text-sky-800 -1">Folder Name</label>
            <button
              title="Cancel"
              className="underline text-xs font-semibold pr-10 text-red-500"
              onClick={(e) => {
                e.stopPropagation();
                onEditSprintCancel?.();
                onInlineCancel?.();
              }}
              disabled={inlineSaving}
            >
              Cancel
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input
              autoFocus
              className="flex-1 rounded-md border border-gray-300 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Type folder name…"
              value={inlineSprintName}
              onChange={(e) => setInlineSprintName?.(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onInlineSave?.();
                if (e.key === "Escape") onInlineCancel?.();
              }}
              disabled={inlineSaving}
            />
            <button
              title="Save folder"
              className="h-7 w-7 shrink-0 rounded-md bg-[#0071E9] text-white grid place-items-center disabled:opacity-60"
              onClick={(e) => {
                e.stopPropagation();
                onEditSprintCancel?.();
                onInlineSave?.();
              }}
              disabled={inlineSaving || !inlineSprintName?.trim()}
            >
              {inlineSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      {/* Children */}
      {!collapsed && isOpen && (
        <div
          className={`relative transition-all duration-300 ${(item.children?.length ?? 0) > 6 ? "max-h-60 overflow-y-auto pr-1" : ""} overflow-x-auto`}
        >
          {depth >= 2 && (
            <span
              aria-hidden
              className="absolute top-1.5 bottom-1.5 w-px bg-gray-200"
              style={{ left: `${6 + depth * 11}px` }}
            />
          )}
          {Array.isArray(item.children) &&
            item.children.length > 0 &&
            (item.children || []).map((child: any, idx: number) => (
              <div key={child.key || `${item.key}-child-${idx}`} className="relative">
                <SidebarItem
                  item={child}
                  depth={depth + 1}
                  collapsed={collapsed}
                  openMenus={openMenus}
                  setOpenMenus={setOpenMenus}
                  toggleMenu={toggleMenu}
                  location={location}
                  onSprintOpen={onSprintOpen}
                  loadingByKey={loadingByKey}
                  navigateFn={navigateFn}
                  selectedKey={selectedKey}
                  setSelectedKey={setSelectedKey}
                  parentSprintKey={item.type === "sprint" ? item.key : parentSprintKey}
                  parentBPKey={item.type === "businessprocess" ? item.key : parentBPKey}
                  openSprintExclusive={openSprintExclusive}
                  onAddSprintClick={onAddSprintClick}
                  onAddSubFolderClick={onAddSubFolderClick}
                  onOpenBPMappingClick={onOpenBPMappingClick}
                  openBPExclusive={openBPExclusive}
                  editingSprintKey={editingSprintKey}
                  editingSprintName={editingSprintName}
                  setEditingSprintName={setEditingSprintName}
                  editingSprintSaving={editingSprintSaving}
                  onEditSprintClick={onEditSprintClick}
                  onEditSprintSave={onEditSprintSave}
                  onEditSprintCancel={onEditSprintCancel}
                  onDeleteSprintClick={onDeleteSprintClick} // Pass down
                  setEditingContainerRef={setEditingContainerRef}
                  inlineAddProjectKey={inlineAddProjectKey}
                  inlineSprintName={inlineSprintName}
                  setInlineSprintName={setInlineSprintName}
                  inlineSaving={inlineSaving}
                  onInlineSave={onInlineSave}
                  onInlineCancel={onInlineCancel}
                />
              </div>
            ))}
          {Array.isArray(item.children) &&
            item.children.length === 0 &&
            !loadingByKey[item.key] && (
              <div className="py-2 text-xs text-gray-500 italic">No Business Processes</div>
            )}
          {loadingByKey[item.key] && (
            <div className="py-2 text-xs text-gray-500 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading business processes...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
function FloatingMenu() {
  return null;
}
function buildStableTreeFromRaw(raw: any) {
  console.groupCollapsed("%c[DEBUG] buildStableTreeFromRaw()", "color:#2c3e50;font-weight:bold");
  const lookup = buildSubfolderLookupFromRaw(raw);
  console.log("[DEBUG] lookup entries:", Object.keys(lookup).length);
  const parentMap = buildFolderParentMapFromRaw(raw);
  console.log("[DEBUG] parent map entries:", Object.keys(parentMap).length);
  const adapted = adaptFoldersToSprintShape(raw);
  console.log("[DEBUG] → transformApiDataToTree()");
  const items = transformApiDataToTree(adapted) as any[]; // IMPORTANT: pass the same shape consistently
  console.log("[DEBUG] items length (projects):", items?.length ?? 0);
  const baseGroups = [{ items }];
  console.log("[DEBUG] → decorate with subfolders");
  const decorated = decorateTreeWithSubfolders(baseGroups, lookup);
  console.log("[DEBUG] → stabilize keys");
  const stable = stabilizeTreeKeys(decorated);
  // collect keys for restore
  const newKeys: string[] = [];
  const collect = (nodes: any[]) => nodes?.forEach((n) => {
    if (n?.key) newKeys.push(n.key);
    if (n?.children?.length) collect(n.children);
  });
  stable.forEach((g) => collect(g.items));
  console.log("[DEBUG] stable groups:", stable.length, "keys:", newKeys.length);
  console.groupEnd();
  return { stable, lookup, parentMap, keys: newKeys };
}


/* ------------------------------- ProjectMenu ------------------------------- */
export default function ProjectMenu({ collapsed, location, navigateFn }: ProjectMenuProps) {
  const [businessUnits, setBusinessUnits] = useState<BUOption[]>([]);
  const [currBU, setCurrBU] = useState<string>("");
  const [groups, setGroups] = useState<{ category?: string; items: TreeNode[] }[]>([{ items: [] }]);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [loadingByKey, setLoadingByKey] = useState<Record<string, boolean>>({});
  const [processCache, setProcessCache] = useState<Record<string, any[]>>({});
  const [subfolderLookup, setSubfolderLookup] = useState<Record<string, any[]>>({});
  const [folderParentMap, setFolderParentMap] = useState<Record<string, string | null>>({});

  const [openProjectModal, setOpenProjectModal] = useState(false);
  const [openSprintAdd, setOpenSprintAdd] = useState(false);
  const [inlineAddProjectKey, setInlineAddProjectKey] = useState<string | null>(null);
  const [inlineSprintName, setInlineSprintName] = useState<string>("");
  const [inlineSaving, setInlineSaving] = useState<boolean>(false);
  // rename state
  const [editingSprintKey, setEditingSprintKey] = useState<string | null>(null);
  const [editingSprintName, setEditingSprintName] = useState<string>("");
  const [editingSprintSaving, setEditingSprintSaving] = useState<boolean>(false);

  const optimisticSubfoldersRef = useRef<Record<string, any[]>>({});
  const editingContainerRef = useRef<HTMLDivElement | null>(null);
  const [openBPMap, setOpenBPMap] = useState(false);
  const inFlightLoadRef = useRef<Set<string>>(new Set());
  const [sprintCtx, setSprintCtx] = useState<{ ClientId: string; ProjectId: string; BusinessUnitId?: string; ParentFolderId?: string | null }>({
    ClientId: "",
    ProjectId: "",
    BusinessUnitId: "",
    ParentFolderId: null,
  });
  const [bpCtx, setBpCtx] = useState<{ ClientId: string; ProjectId: string; BusinessUnitId: string; SprintId: string }>({
    ClientId: "",
    ProjectId: "",
    BusinessUnitId: "",
    SprintId: "",
  });
  const processCacheRef = useRef<Record<string, any[]>>({});
  useEffect(() => {
    processCacheRef.current = processCache;
  }, [processCache]);

  function mergeOptimisticIntoLookup(
    lookup: Record<string, any[]>,
    optimistic: Record<string, any[]>
  ) {
    const out: Record<string, any[]> = { ...lookup };
    for (const [parentId, list] of Object.entries(optimistic || {})) {
      const base = out[parentId] ? [...out[parentId]] : [];
      for (const it of list || []) {
        const id = String(it.FolderId);
        if (!base.find((x) => String(x.FolderId) === id)) base.push(it);
      }
      out[parentId] = base;
    }
    return out;
  }

  // Prune optimistic once server returns those children (prevents dup/flicker)
  function pruneOptimisticAgainstLookup(
    lookup: Record<string, any[]>,
    optimistic: Record<string, any[]>
  ) {
    const pruned: Record<string, any[]> = {};
    let changed = false;
    for (const [parentId, list] of Object.entries(optimistic || {})) {
      const live = new Set((lookup[parentId] || []).map((x) => String(x.FolderId)));
      const keep = (list || []).filter((it) => !live.has(String(it.FolderId)));
      if (keep.length !== (list || []).length) changed = true;
      if (keep.length) pruned[parentId] = keep;
    }
    return changed ? pruned : optimistic;
  }

  function invalidateCache(sprintId: string) {
    console.log("[DEBUG] processCache: invalidated", sprintId);
    setProcessCache((p) => {
      const n = { ...p };
      delete n[String(sprintId)];
      return n;
    });
  }

  function optimisticInsertSubfolder(args: {
    parentFolderId: string;
    newFolderId: string;
    newFolderName: string;
    parentCtx: {
      ClientId: string;
      ProjectId: string;
      BusinessUnitId?: string;
      BusinessUnitName?: string;
      ProjectName?: string;
    };
  }) {
    const { parentFolderId, newFolderId, newFolderName, parentCtx } = args;
    console.log("[DEBUG] optimisticInsertSubfolder()", args);
    if (!parentFolderId || !newFolderId) return;
    // 1) Track optimistic child in ref
    const cur = optimisticSubfoldersRef.current[parentFolderId] || [];
    if (!cur.find((x) => String(x.FolderId) === String(newFolderId))) {
      optimisticSubfoldersRef.current[parentFolderId] = [
        ...cur,
        {
          FolderId: newFolderId,
          FolderName: newFolderName,
          ParentFolderId: parentFolderId,
          SubFolders: [],
        },
      ];
    }
    // 2) Update subfolder lookup immediately so UI can show it
    setSubfolderLookup((prev) => {
      const base = prev[parentFolderId] ? [...prev[parentFolderId]] : [];
      if (!base.find((x) => String(x.FolderId) === String(newFolderId))) {
        base.push({
          FolderId: newFolderId,
          FolderName: newFolderName,
          ParentFolderId: parentFolderId,
          SubFolders: [],
        });
      }
      const next = { ...prev, [parentFolderId]: base };
      console.log(
        `[DEBUG] parent map after merge(add): ${parentFolderId} for ${newFolderId}`
      );
      return next;
    });
    // 3) Ensure parent path is known in folderParentMap
    setFolderParentMap((prev) => {
      if (prev[newFolderId] === parentFolderId) return prev;
      return { ...prev, [newFolderId]: parentFolderId };
    });
    // 4) Invalidate only the parent’s cache (so its children refetch/merge when opened)
    setProcessCache((p) => {
      const n = { ...p };
      if (n[parentFolderId]) {
        console.log("[DEBUG] processCache: invalidated", parentFolderId);
        delete n[parentFolderId];
      }
      return n;
    });
    // 5) Optionally: graft a visible node now (pure UI, no server call needed)
    const folderNode = {
      key: `folder-${newFolderId}`,
      type: "sprint" as const,
      label: newFolderName,
      icon: <PiFolderFill className="w-4 h-4 text-gray-500" />,
      ClientId: parentCtx.ClientId,
      BusinessUnitId: parentCtx.BusinessUnitId,
      BusinessUnitName: parentCtx.BusinessUnitName,
      ProjectId: parentCtx.ProjectId,
      ProjectName: parentCtx.ProjectName,
      SprintId: newFolderId,
      SprintName: newFolderName,
      ParentFolderId: parentFolderId,
      __SubFolders: [],
      children: [],
    };
    setGroups((prevGroups) => {
      // Attach the new child under the parentFolderId (by SprintId)
      const attach = (node: any): any => {
        if (node?.type === "sprint" && String(node.SprintId) === String(parentFolderId)) {
          const kids = Array.isArray(node.children) ? node.children : [];
          if (!kids.find((k: any) => String(k.SprintId) === String(newFolderId))) {
            return { ...node, children: [folderNode, ...kids] };
          }
          return node;
        }
        if (Array.isArray(node?.children) && node.children.length) {
          const mapped = node.children.map(attach);
          if (mapped !== node.children) return { ...node, children: mapped };
        }
        return node;
      };
      let changed = false;
      const next = (prevGroups || []).map((g) => {
        const items = (g.items || []).map((it: any) => {
          const mapped = attach(it);
          if (mapped !== it) changed = true;
          return mapped;
        });
        return changed ? { ...g, items } : g;
      });
      return changed ? next : prevGroups;
    });
  }

  function optimisticInsertRootFolder(args: {
    projectNodeKey: string;                  // key of the project row
    newFolderId: string;
    newFolderName: string;
    ctx: {
      ClientId: string;
      ProjectId: string;
      BusinessUnitId?: string;
      BusinessUnitName?: string;
      ProjectName?: string;
    };
  }) {
    const { projectNodeKey, newFolderId, newFolderName, ctx } = args;

    // Create the new folder node (same "sprint" shape)
    const folderNode = {
      key: `folder-${newFolderId}`,
      type: "sprint" as const,
      label: newFolderName,
      icon: <PiFolderFill className="w-4 h-4 text-gray-500" />,
      ClientId: ctx.ClientId,
      BusinessUnitId: ctx.BusinessUnitId,
      BusinessUnitName: ctx.BusinessUnitName,
      ProjectId: ctx.ProjectId,
      ProjectName: ctx.ProjectName,
      SprintId: newFolderId,
      SprintName: newFolderName,
      ParentFolderId: null,
      __SubFolders: [],
      children: [],
    };

    // Update parent map: root has null parent
    setFolderParentMap((prev) => {
      if (prev[newFolderId] === null) return prev;
      return { ...prev, [newFolderId]: null };
    });

    // Graft the node under the project row without rebuilding whole tree
    setGroups((prevGroups) => {
      let changed = false;
      const attach = (node: any): any => {
        if (node?.type === "project" && node.key === projectNodeKey) {
          const kids = Array.isArray(node.children) ? node.children : [];
          if (!kids.find((k: any) => String(k.SprintId) === String(newFolderId))) {
            changed = true;
            return { ...node, children: [folderNode, ...kids] };
          }
          return node;
        }
        if (Array.isArray(node?.children) && node.children.length) {
          const mapped = node.children.map(attach);
          if (mapped !== node.children) changed = true;
          return { ...node, children: mapped };
        }
        return node;
      };

      const next = (prevGroups || []).map((g) => {
        const items = (g.items || []).map(attach);
        return changed ? { ...g, items } : g;
      });

      return changed ? next : prevGroups;
    });
  }

  // 4. NEW HELPER FUNCTION FOR OPTIMISTIC RENAME
  function optimisticUpdateFolderName(args: {
    folderKey: string;
    newFolderName: string;
  }) {
    const { folderKey, newFolderName } = args;

    setGroups((prevGroups) => {
      let changed = false;
      const updateNode = (node: any): any => {
        if (node?.key === folderKey) {
          changed = true;
          return {
            ...node,
            label: newFolderName,
            SprintName: newFolderName,
          };
        }
        if (Array.isArray(node?.children) && node.children.length) {
          const mapped = node.children.map(updateNode);
          if (mapped !== node.children) {
            changed = true;
            return { ...node, children: mapped };
          }
        }
        return node;
      };

      const next = (prevGroups || []).map((g) => {
        const items = (g.items || []).map(updateNode);
        return changed ? { ...g, items } : g;
      });

      return changed ? next : prevGroups;
    });

    // Also update the label in the cache if it exists, so it doesn't revert on re-open
    setProcessCache(prevCache => {
      let cacheChanged = false;
      const newCache = { ...prevCache };
      for (const key in newCache) {
        const items = newCache[key];
        if (Array.isArray(items)) {
          const newItems = items.map(item => {
            if (item?.key === folderKey) {
              cacheChanged = true;
              return { ...item, label: newFolderName, SprintName: newFolderName };
            }
            return item;
          });
          if (cacheChanged) {
            newCache[key] = newItems;
          }
        }
      }
      return cacheChanged ? newCache : prevCache;
    });
  }

  // 6. NEW HELPER FUNCTION FOR OPTIMISTIC DELETE
  function optimisticRemoveFolder(args: { folderKey: string }) {
    const { folderKey } = args;

    // 1. Unselect if it was selected
    setSelectedKey(prev => (prev === folderKey ? null : prev));
    // 2. Close if it was open
    setOpenMenus(prev => {
      if (!prev[folderKey]) return prev;
      const next = { ...prev };
      delete next[folderKey];
      return next;
    });

    // 3. Remove from tree
    setGroups((prevGroups) => {
      let changed = false;
      const removeNode = (nodes: any[]): any[] => {
        if (!Array.isArray(nodes)) return nodes;

        const filtered = nodes.filter(n => n.key !== folderKey);
        if (filtered.length !== nodes.length) {
          changed = true;
          return filtered;
        }

        return nodes.map(n => {
          if (Array.isArray(n.children) && n.children.length) {
            const newChildren = removeNode(n.children);
            if (newChildren !== n.children) {
              changed = true;
              return { ...n, children: newChildren };
            }
          }
          return n;
        });
      };

      const next = (prevGroups || []).map((g) => {
        const items = removeNode(g.items || []);
        return changed ? { ...g, items } : g;
      });

      return changed ? next : prevGroups;
    });
  }
  useEffect(() => {
    (async () => {
      console.groupCollapsed("%c[DEBUG] useEffect:init → fetchBusinessUnits()", "color:#16a085;font-weight:bold");
      const bus = await fetchBusinessUnits();
      setBusinessUnits(bus);
      const defaultBU = bus?.[0]?.value ?? "";
      setCurrBU(defaultBU);
      console.log("[DEBUG] businessUnits:", bus?.length ?? 0, "defaultBU:", defaultBU);
      console.groupEnd();
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const user = getDecryptedData("UserSession");
      if (!user?.ClientId || !currBU) return;
      console.groupCollapsed("%c[DEBUG] useEffect:currBU → fetch projects/folders", "color:#2980b9;font-weight:bold");
      await fetchProjectList(user.ClientId, currBU);
      const raw = await fetchProjectsWithFolders(user.ClientId, currBU);
      const { stable, lookup, parentMap } = buildStableTreeFromRaw(raw);
      setSubfolderLookup(lookup);
      setFolderParentMap(parentMap);
      setGroups(stable);
      const firstProjectKey = stable[0]?.items?.[0]?.key;
      if (firstProjectKey) {
        setOpenMenus((prev) => ({ ...prev, [firstProjectKey]: true }));
      }
      console.groupEnd();
    })();
  }, [currBU]);

  /* ------------------------------ Helpers for tree ------------------------------ */
  const getAllSprintKeys = () => {
    const keys: string[] = [];
    const visit = (node: any) => {
      if (node?.type === "sprint" && node.key) keys.push(node.key);
      (node?.children || []).forEach(visit);
    };
    (groups || []).forEach((g: any) => (g.items || []).forEach(visit));
    return keys;
  };

  const findSprintNodeByKey = (targetKey: string) => {
    let found: any = null;
    const visit = (node: any) => {
      if (node?.type === "sprint" && node.key === targetKey) {
        found = node;
        return;
      }
      (node?.children || []).forEach(visit);
    };
    (groups || []).forEach((g: any) => (g.items || []).forEach(visit));
    return found;
  };

  const findSprintNodeById = (sprintId: string) => {
    let found: any = null;
    const visit = (node: any) => {
      if (node?.type === "sprint" && String(node.SprintId) === String(sprintId)) {
        found = node;
        return;
      }
      (node?.children || []).forEach(visit);
    };
    (groups || []).forEach((g: any) => (g.items || []).forEach(visit));
    return found;
  };

  const openSprintExclusive = (targetSprintKey: string) => {
    const sprintKeys = getAllSprintKeys();
    setOpenMenus((prev) => {
      const next = { ...prev };
      sprintKeys.forEach((k) => (next[k] = k === targetSprintKey));
      return next;
    });
  };

  const openBPExclusive = (parentSprintKey: string, targetBPKey: string) => {
    const sprintNode = findSprintNodeByKey(parentSprintKey);
    if (!sprintNode) return;
    const bpKeys: string[] = [];
    (sprintNode.children || []).forEach((c: any) => {
      if (c?.type === "businessprocess" && c.key) bpKeys.push(c.key);
    });
    setOpenMenus((prev) => {
      const next = { ...prev };
      next[parentSprintKey] = true;
      bpKeys.forEach((k) => (next[k] = k === targetBPKey));
      return next;
    });
  };

  function mapItems(items: any[], mapFn: (x: any) => any) {
    if (!Array.isArray(items)) return items;
    let changed = false;
    const out = items.map((it) => {
      const mapped = mapFn(it);
      if (mapped !== it) changed = true;
      return mapped;
    });
    return changed ? out : items;
  }

  function mapNode(node: any, mapFn: (x: any) => any) {
    const replaced = mapFn(node);
    if (replaced !== node) return replaced;
    const kids = node.children;
    if (!Array.isArray(kids) || kids.length === 0) return node;
    const newKids = mapItems(kids, (child) => mapNode(child, mapFn));
    if (newKids === kids) return node;
    return { ...node, children: newKids };
  }

  const attachByKeyPure = (allGroups: any[], sprintKey: string, processNodes: any[]) => {
    let found = false;
    const tree = (allGroups || []).map((group) => {
      const newItems = (group.items || []).map((proj: any) =>
        mapNode(proj, (n: any) => {
          if (n.key !== sprintKey) return n;
          found = true;
          return { ...n, children: Array.isArray(processNodes) ? processNodes : [] };
        })
      );
      return newItems === group.items ? group : { ...group, items: newItems };
    });
    return { tree, found };
  };

  const attachBySprintIdPure = (allGroups: any[], sprintId: string, processNodes: any[]) => {
    let found = false;
    const tree = (allGroups || []).map((group) => {
      const newItems = (group.items || []).map((proj: any) =>
        mapNode(proj, (n: any) => {
          if (String(n.SprintId) !== String(sprintId)) return n;
          found = true;
          return { ...n, children: Array.isArray(processNodes) ? processNodes : [] };
        })
      );
      return newItems === group.items ? group : { ...group, items: newItems };
    });
    return { tree, found };
  };

  const attachProcessesToSprintDual = (sprintKey: string, sprintId: string, processNodes: any[]) => {
    setGroups((prev) => {
      const a1 = attachByKeyPure(prev, sprintKey, processNodes);
      if (a1.found) {
        setOpenMenus((om) => ({ ...om, [sprintKey]: true }));
        return a1.tree;
      }
      const a2 = attachBySprintIdPure(prev, sprintId, processNodes);
      if (a2.found) {
        setOpenMenus((om) => ({ ...om, [sprintKey]: true }));
        return a2.tree;
      }
      return prev;
    });
  };
  function buildFolderNodesFromSubfolders(list: any[], ctx: any) {
    return (list || []).map((f) => ({
      key: `folder-${f.FolderId}`,
      type: "sprint",
      label: f.FolderName,
      icon: <PiFolderFill className="w-4 h-4 text-gray-500" />,
      ClientId: ctx.ClientId,
      BusinessUnitId: ctx.BusinessUnitId,
      BusinessUnitName: ctx.BusinessUnitName,
      ProjectId: ctx.ProjectId,
      ProjectName: ctx.ProjectName,
      SprintId: f.FolderId,
      SprintName: f.FolderName,
      ParentFolderId: f.ParentFolderId ?? null,
      __SubFolders: Array.isArray(f.SubFolders) ? f.SubFolders : [],
      children: [],
    }));
  }

  const onSprintOpen = async (
    sprintItem: any,
    opts?: { force?: boolean }
  ) => {
    const sprintId = String(sprintItem?.SprintId || "");
    const sprintKey = sprintItem?.key;
    if (!sprintId || !sprintKey) return;

    console.log("[DEBUG] onSprintOpen()");
    console.log("[DEBUG] sprintId/key", sprintId, sprintKey);

    // If a load is already in-flight for this sprint, don't start another.
    if (inFlightLoadRef.current.has(sprintId)) {
      // We still make sure the row is visually open.
      setOpenMenus((om) => ({ ...om, [sprintKey]: true }));
      return;
    }

    setOpenMenus((om) => ({ ...om, [sprintKey]: true }));
    setLoadingByKey((p) => ({ ...p, [sprintKey]: true }));
    const force = !!opts?.force;

    try {
      inFlightLoadRef.current.add(sprintId);
      // Cache hit is OK unless forcing a reload
      if (!force && processCache[sprintId]) {
        console.log("[DEBUG] cache hit for sprintId", sprintId);
        attachProcessesToSprintDual(sprintKey, sprintId, processCache[sprintId]);
        return;
      }

      // 1) Subfolders from lookup (already includes optimistic)
      const rawSubFolders =
        subfolderLookup[sprintId] ||
        (Array.isArray(sprintItem?.__SubFolders) ? sprintItem.__SubFolders : []);
      const subFolderNodes = buildFolderNodesFromSubfolders(rawSubFolders, {
        ClientId: sprintItem.ClientId,
        BusinessUnitId: sprintItem.BusinessUnitId,
        BusinessUnitName: sprintItem.BusinessUnitName,
        ProjectId: sprintItem.ProjectId,
        ProjectName: sprintItem.ProjectName,
      });

      // 2) Fetch BPs
      const user = getDecryptedData("UserSession");
      const resp = await fetchBPAndSubProcess({
        ClientId: user?.ClientId,
        BusinessUnitId: sprintItem.BusinessUnitId,
        ProjectId: sprintItem.ProjectId,
        SprintId: sprintItem.SprintId,
      });
      const bp = Array.isArray(resp?.ResponseData?.BusinessProcesses)
        ? resp.ResponseData.BusinessProcesses
        : [];
      const processNodes = transformProcessesResponse(
        { ResponseData: { BusinessProcesses: bp } },
        {
          ClientId: sprintItem.ClientId,
          BusinessUnitId: sprintItem.BusinessUnitId,
          BusinessUnitName: sprintItem.BusinessUnitName,
          ProjectId: sprintItem.ProjectId,
          ProjectName: sprintItem.ProjectName,
          SprintId: sprintItem.SprintId,
          SprintName: sprintItem.SprintName,
        }
      );

      const mergedChildren = [...subFolderNodes, ...processNodes];
      setProcessCache((p) => ({ ...p, [sprintId]: mergedChildren }));
      attachProcessesToSprintDual(sprintKey, sprintId, mergedChildren);
    } catch (e) {
      // Fallback: only folders
      const rawSubFolders =
        subfolderLookup[sprintId] ||
        (Array.isArray(sprintItem?.__SubFolders) ? sprintItem.__SubFolders : []);
      const subFolderNodes = buildFolderNodesFromSubfolders(rawSubFolders, {
        ClientId: sprintItem.ClientId,
        BusinessUnitId: sprintItem.BusinessUnitId,
        BusinessUnitName: sprintItem.BusinessUnitName,
        ProjectId: sprintItem.ProjectId,
        ProjectName: sprintItem.ProjectName,
      });
      setProcessCache((p) => ({ ...p, [sprintId]: subFolderNodes }));
      attachProcessesToSprintDual(sprintKey, sprintId, subFolderNodes);
    } finally {
      inFlightLoadRef.current.delete(sprintId);
      setLoadingByKey((p) => ({ ...p, [sprintKey]: false }));
      setOpenMenus((om) => ({ ...om, [sprintKey]: true }));
    }
  };

  async function refreshSidebar(preserveOpen = true) {
    console.log("[DEBUG] refreshSidebar()");
    const user = getDecryptedData("UserSession");
    if (!user?.ClientId || !currBU) return;

    const snapshotOpen = { ...openMenus };
    const snapshotSelected = selectedKey;
    console.log("[DEBUG] Snapshot openMenus:", snapshotOpen);
    console.log("[DEBUG] Snapshot selectedKey:", snapshotSelected);

    const raw = await fetchProjectsWithFolders(user.ClientId, currBU);

    // Build from RAW
    let lookup = buildSubfolderLookupFromRaw(raw);
    // Merge optimistic children
    lookup = mergeOptimisticIntoLookup(lookup, optimisticSubfoldersRef.current);
    setSubfolderLookup(lookup);

    // Build parent map (+ optimistic edges)
    let parentMap = buildFolderParentMapFromRaw(raw);
    for (const [pId, list] of Object.entries(optimisticSubfoldersRef.current || {})) {
      for (const it of list || []) {
        const childId = String(it.FolderId);
        if (!parentMap[childId]) parentMap[childId] = String(pId);
      }
    }
    setFolderParentMap(parentMap);

    // Adapt → tree → decorate → stabilize
    const resp = adaptFoldersToSprintShape(raw);
    console.log("[DEBUG] adaptFoldersToSprintShape()");
    const baseGroups = [{ items: transformApiDataToTree(resp) as any[] }];
    const decorated = decorateTreeWithSubfolders(baseGroups, lookup);
    const stable = stabilizeTreeKeys(decorated);
    setGroups(stable);

    // Prune optimistic items that the server now returns
    const pruned = pruneOptimisticAgainstLookup(lookup, optimisticSubfoldersRef.current);
    if (pruned !== optimisticSubfoldersRef.current) {
      optimisticSubfoldersRef.current = pruned;
    }

    // Restore UI state on next frame
    requestAnimationFrame(() => {
      if (preserveOpen) {
        setOpenMenus(snapshotOpen);
        setSelectedKey(snapshotSelected ?? null);
      } else {
        const firstProjectKey = stable[0]?.items?.[0]?.key;
        setOpenMenus(firstProjectKey ? { [firstProjectKey]: true } : {});
        setSelectedKey(null);
      }
    });
  }

  const refreshSprintProcesses = async (sprintId: string) => {
    const sprintNode = findSprintNodeById(sprintId);
    if (!sprintNode) {
      // Fallback: If node isn't found (e.g., deleted), reload the whole sidebar.
      await refreshSidebar(true);
      return;
    }

    // 1. Ensure the parent sprint/folder is visually open.
    setOpenMenus(om => ({ ...om, [sprintNode.key]: true }));

    // 2. Invalidate cache and force reload.
    invalidateCache(sprintId);
    console.log(`[DEBUG] force reload: invalidated cache for ${sprintId}`);

    // 3. Wait for the reload to complete.
    await onSprintOpen(sprintNode, { force: true });

    // 4. After reload, find the *reloaded* node and attempt to select the first BP child.
    const reloadedNode = findSprintNodeById(sprintId);
    if (reloadedNode && Array.isArray(reloadedNode.children) && reloadedNode.children.length > 0) {
      // Filter for the first Business Process (BP) type child
      const firstBP = reloadedNode.children.find(
        (c: any) => c.type === "businessprocess"
      );

      if (firstBP) {
        openBPExclusive(sprintNode.key, firstBP.key);
        setSelectedKey(firstBP.key);
      }
    }
  };

  const openFolderPathById = async (
    targetFolderId: string,
    parentMapOverride?: Record<string, string | null>
  ) => {
    console.log("[DEBUG] openFolderPathById()");
    console.log("[DEBUG] target:", targetFolderId);
    const currentMap = parentMapOverride ?? folderParentMap;
    console.log("[DEBUG] current parentMap:", currentMap);
    // Build ancestor chain root→target
    const chain: string[] = [];
    let cur: string | null = String(targetFolderId);
    const seen = new Set<string>();
    while (cur && !seen.has(cur)) {
      seen.add(cur);
      chain.push(cur);
      cur = currentMap[cur] ?? null;
    }
    chain.reverse();
    console.log("[DEBUG] built chain:", chain);

    // Walk root -> target
    for (const id of chain) {
      const node = findSprintNodeById(id);
      if (!node) continue;
      // Open row visually
      setOpenMenus((om) => ({ ...om, [node.key]: true }));

      // Invalidate cache ONCE (only if we actually had something to delete)
      setProcessCache((p) => {
        if (!p[id]) return p;
        const n = { ...p };
        delete n[id];
        console.log("[DEBUG] force reload: invalidated cache for", id);
        return n;
      });
      // Force-load this hop, but de-duped by onSprintOpen's inFlight guard
      await onSprintOpen(node, { force: true });
    }

    // Select target
    const targetNode = findSprintNodeById(targetFolderId);
    if (targetNode) {
      setSelectedKey(targetNode.key);
      setOpenMenus((om) => ({ ...om, [targetNode.key]: true }));
    }
    return targetNode;
  };

  /* ------------------------------ Modals openers ------------------------------ */
  const handleOpenProjectModal = () => setOpenProjectModal(true);

  // Project-level add (root folder)
  const openSprintAddForItem = (node: any) => {
    const user = getDecryptedData("UserSession");
    const ClientId = String(node.ClientId || user?.ClientId || "");
    const ProjectId = String(node.ProjectId || "");
    const BusinessUnitId = String(node.BusinessUnitId || currBU || "");
    setSprintCtx({ ClientId, ProjectId, BusinessUnitId, ParentFolderId: null });
    setInlineAddProjectKey(node.key);
    setInlineSprintName("");
  };

  // Folder-level add (subfolder)
  const openSubfolderAddForItem = (node: any) => {
    const user = getDecryptedData("UserSession");
    const ClientId = String(node.ClientId || user?.ClientId || "");
    const ProjectId = String(node.ProjectId || "");
    const BusinessUnitId = String(node.BusinessUnitId || currBU || "");
    const ParentFolderId = String(node.SprintId || "");
    setSprintCtx({ ClientId, ProjectId, BusinessUnitId, ParentFolderId });
    setInlineAddProjectKey(node.key);
    setInlineSprintName("");
    setOpenMenus((om) => ({ ...om, [node.key]: true }));
    setSelectedKey(node.key);
  };

  const openBPMappingForItem = (node: any) => {
    const user = getDecryptedData("UserSession");
    const ClientId = String(node.ClientId || user?.ClientId || "");
    const ProjectId = String(node.ProjectId || "");
    const BusinessUnitId = String(node.BusinessUnitId || currBU || "");
    const SprintId = String(node.SprintId || "");
    setBpCtx({ ClientId, ProjectId, BusinessUnitId, SprintId });
    setOpenBPMap(true);
  };

  /* ---------------- Save new folder (root/subfolder) ---------------- */
  const cancelInlineSprint = () => {
    setInlineAddProjectKey(null);
    setInlineSprintName("");
  };

  const saveInlineSprint = async () => {
    if (!inlineAddProjectKey || !inlineSprintName?.trim()) return;

    const parentFolderId = sprintCtx.ParentFolderId ? String(sprintCtx.ParentFolderId) : "";
    const name = inlineSprintName.trim();

    try {
      setInlineSaving(true);

      const resp = await apiRequest("/AddUpdateProjectFolder", {
        ClientId: sprintCtx.ClientId,
        ProjectId: sprintCtx.ProjectId,
        FolderName: name,
        ParentFolderId: sprintCtx.ParentFolderId ?? null,
      });

      const newFolderId = resp?.ResponseData?.FolderId ? String(resp.ResponseData.FolderId) : "";
      cancelInlineSprint();

      if (!newFolderId) {
        setInlineSaving(false);
        return;
      }

      if (parentFolderId) {
        optimisticInsertSubfolder({
          parentFolderId,
          newFolderId,
          newFolderName: name,
          parentCtx: {
            ClientId: sprintCtx.ClientId,
            ProjectId: sprintCtx.ProjectId,
            BusinessUnitId: sprintCtx.BusinessUnitId,
            ProjectName: "",
            BusinessUnitName: "",
          },
        });

        // Open the parent & select the new child
        const newKey = `folder-${newFolderId}`;
        setOpenMenus((om) => {
          const parentNode = findSprintNodeById(parentFolderId);
          return parentNode ? { ...om, [parentNode.key]: true } : om;
        });
        setSelectedKey(newKey);
      } else {
        optimisticInsertRootFolder({
          projectNodeKey: inlineAddProjectKey, // this is the project's key row
          newFolderId,
          newFolderName: name,
          ctx: {
            ClientId: sprintCtx.ClientId,
            ProjectId: sprintCtx.ProjectId,
            BusinessUnitId: sprintCtx.BusinessUnitId,
          },
        });

        const newKey = `folder-${newFolderId}`;
        // Ensure the project row is open and select the new folder
        setOpenMenus((om) => ({ ...om, [inlineAddProjectKey]: true }));
        setSelectedKey(newKey);
      }
    } catch (error) {
      console.error("[DEBUG] ERROR in saveInlineSprint:", error);
    } finally {
      setInlineSaving(false);
    }
  };


  // rename flow (folder)
  const startEditSprint = (sprintNode: any) => {
    const currentName = sprintNode?.SprintName ?? sprintNode?.label ?? "";
    setEditingSprintKey(sprintNode.key);
    setEditingSprintName(String(currentName));
  };

  const cancelEditSprint = () => {
    setEditingSprintKey(null);
    setEditingSprintName("");
    setEditingSprintSaving(false);
    editingContainerRef.current = null;
  };
  const saveEditSprint = async () => {
    if (!editingSprintKey || !editingSprintName.trim()) return;
    const node = findSprintNodeByKey(editingSprintKey);
    if (!node?.SprintId) return;

    const newName = editingSprintName.trim();
    const oldName = node.label;
    const keyToRestore = editingSprintKey;
    optimisticUpdateFolderName({
      folderKey: editingSprintKey,
      newFolderName: newName,
    });
    cancelEditSprint();
    setSelectedKey(keyToRestore);
    try {
      await apiRequest("/AddUpdateProjectFolder", {
        ClientId: node.ClientId,
        ProjectId: node.ProjectId,
        FolderId: node.SprintId,
        FolderName: newName,
        ParentFolderId: node.ParentFolderId ?? null,
      });
      invalidateCache(node.SprintId);

    } catch (error) {
      console.error("[DEBUG] ERROR in saveEditSprint:", error);
      optimisticUpdateFolderName({
        folderKey: keyToRestore,
        newFolderName: oldName,
      });
      alert(`Failed to rename folder: ${error.message || "Unknown error"}`);
    } finally {
      cancelEditSprint();
    }
  };
  const handleDeleteSprint = async (node: any) => {
    if (!node?.SprintId || !node?.key) return;

    // 1. Confirm
    const folderName = node.label || "this folder";
    if (
      !window.confirm(
        `Are you sure you want to delete "${folderName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    const keyToRemove = node.key;
    const idToRemove = node.SprintId;
    const parentId = node.ParentFolderId ?? null;

    // 2. Optimistic remove
    optimisticRemoveFolder({ folderKey: keyToRemove });

    try {
      await apiRequest("/DeleteProjectFolder", {
        ClientId: node.ClientId,
        ProjectId: node.ProjectId,
        FolderId: idToRemove,
      });

      invalidateCache(idToRemove);
      if (parentId) {
        invalidateCache(String(parentId));
      }

      if (optimisticSubfoldersRef.current) {
        for (const pId in optimisticSubfoldersRef.current) {
          const list = optimisticSubfoldersRef.current[pId];
          const newList = list.filter(it => String(it.FolderId) !== String(idToRemove));
          if (newList.length !== list.length) {
            optimisticSubfoldersRef.current[pId] = newList;
          }
        }
      }
      setFolderParentMap(prev => {
        if (!prev[idToRemove]) return prev;
        const next = { ...prev };
        delete next[idToRemove];
        return next;
      });

      if (parentId) {
        setSubfolderLookup(prev => {
          const parentList = prev[String(parentId)];
          if (!Array.isArray(parentList)) {
            return prev; // No list to clean, do nothing
          }

          const newList = parentList.filter(
            (folder: any) => String(folder.FolderId) !== String(idToRemove)
          );

          if (newList.length === parentList.length) {
            return prev; // Folder wasn't in the list, do nothing
          }

          console.log(`[DEBUG] subfolderLookup: removed ${idToRemove} from parent ${parentId}`);
          return {
            ...prev,
            [String(parentId)]: newList,
          };
        });
      }
    } catch (error) {
      console.error("[DEBUG] ERROR in handleDeleteSprint:", error);
      alert(
        `Failed to delete "${folderName}". The view will now refresh.`
      );
      await refreshSidebar(true);
    }
  };

  useEffect(() => {
    if (!editingSprintKey) return;
    const handleDocClick = (e: MouseEvent) => {
      const container = editingContainerRef.current;
      if (container && container.contains(e.target as Node)) return;
      cancelEditSprint();
    };
    document.addEventListener("mousedown", handleDocClick, true);
    return () => document.removeEventListener("mousedown", handleDocClick, true);
  }, [editingSprintKey]);

  /* ----------------------------------- UI ----------------------------------- */
  return (
    <div className="flex-1    pb-  " >
      {/* BU dropdown */}
      {!collapsed && (
        <div>
          <DropdownV2
            searchable={false}
            Icon={<PiBuildings className="text-[#1A1A1A] w-4 h-4" />}
            mode="single"
            size="small"
            options={businessUnits}
            value={currBU}
            onChange={(val: any) => setCurrBU(val)}
          />
        </div>
      )}

  {/* Projects header */}
      {!collapsed ? (
        <div className="flex items-center justify-between mb-1 border-t pt-4 border-t-[#F3F3F3]">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#8A8A8A] font-medium uppercase tracking-wide">Projects</span>
          </div>

          <TooltipV2
            content={
              <div className="">
                Add New Project
              </div>
            }
            initialPosition=""
          >
            <button
              onClick={() => setOpenProjectModal(true)}
              type="button"
              className="flex cursor-pointer bg-[#0071E9] text-white items-center justify-center rounded-md transition h-6 w-6"
              title="Add Project"
              aria-label="Add Project"
            >
              <Plus className="w-4 h-4 font-bold " />
            </button>
          </TooltipV2>

        </div>
      ) : (
        <div className="border-t border-t-[#F3F3F3] mx-2 mb-4">
          <div className="flex justify-center py-4">
            <span className="text-[6px] font-bold text-gray-400 tracking-wide transform whitespace-nowrap">PROJECTS</span>
          </div>
        </div>
      )}

    <div className="LeftNavScrollbar overflow-y-auto overflow-x-auto max-h-[calc(100vh-460px)]">
      {/* Tree */}
      {groups.map((group, idx) => (
        <div key={`group-${idx}`}>
          {!collapsed && group.category ? (
            <div className="px-2 text-xs text-sky-700/80 font-semibold uppercase tracking-wide mb-1">
              {group.category ?? ""}
            </div>
          ) : null}
          {group.items?.map((item: any) => (
            <div key={item.key}>
              <SidebarItem
                item={item}
                collapsed={collapsed}
                openMenus={openMenus}
                setOpenMenus={setOpenMenus}
                toggleMenu={(key: string) => setOpenMenus((prev) => ({ ...prev, [key]: !prev[key] }))}
                location={location}
                onSprintOpen={onSprintOpen}
                loadingByKey={loadingByKey}
                navigateFn={navigateFn}
                selectedKey={selectedKey}
                setSelectedKey={setSelectedKey}
                openSprintExclusive={openSprintExclusive}
                openBPExclusive={openBPExclusive}
                onAddSprintClick={openSprintAddForItem}
                onAddSubFolderClick={openSubfolderAddForItem}
                onOpenBPMappingClick={openBPMappingForItem}
                inlineAddProjectKey={inlineAddProjectKey}
                inlineSprintName={inlineSprintName}
                setInlineSprintName={setInlineSprintName}
                inlineSaving={inlineSaving}
                onInlineSave={saveInlineSprint}
                onInlineCancel={cancelInlineSprint}
                editingSprintKey={editingSprintKey}
                editingSprintName={editingSprintName}
                setEditingSprintName={setEditingSprintName}
                editingSprintSaving={editingSprintSaving}
                onEditSprintClick={startEditSprint}
                onEditSprintSave={saveEditSprint}
                onEditSprintCancel={cancelEditSprint}
                // 8. PASS THE DELETE HANDLER DOWN
                onDeleteSprintClick={handleDeleteSprint}
                setEditingContainerRef={(el: HTMLDivElement | null) => {
                  editingContainerRef.current = el;
                }}
              />
            </div>
          ))}
        </div>
      ))}
      <CustomModal
        width="max-w-7xl"
        isOpen={openProjectModal}
        onClose={() => setOpenProjectModal(false)}
        title={<div className="font-medium text-xl">Projects</div>}
        footerContent={[
          <button
            key="close"
            onClick={() => setOpenProjectModal(false)}
            className="mt-2 cursor-pointer px-5 py-2 bg-white text-blue-700 border border-blue-600 text-sm rounded-lg"
          >
            Close
          </button>,
        ]}
      >
        <div className="space-y-6 h-full flex flex-col text-sm">
          <Projects refreshSidebar={() => refreshSidebar(true)} CurrClientDetails={getDecryptedData("UserSession")} />
        </div>
      </CustomModal>
      <SprintForm
        isOpen={openSprintAdd}
        onClose={() => setOpenSprintAdd(false)}
        CurrProject={sprintCtx}
        title={<div className="font-medium text-base">New Folder</div>}
        width="max-w-2xl"
        onSaved={async () => {
          await refreshSidebar(true);
          setOpenSprintAdd(false);
        }}
      />
      <SprintBPMapping
        isOpen={openBPMap}
        onClose={() => setOpenBPMap(false)}
        title={<div className="font-medium text-base">Business Process Mapping</div>}
        width="max-w-5xl"
        CurrentSprint={bpCtx}
        onSaved={async () => {
          await refreshSprintProcesses(bpCtx.SprintId);
          setOpenBPMap(false);
        }}
      />

</div>
    

    </div>
  );
}