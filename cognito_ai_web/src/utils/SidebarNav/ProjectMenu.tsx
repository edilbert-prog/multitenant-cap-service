import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ChevronDown,
  Loader2,
  Plus,
  Check,
  Edit3,
  Folder as FolderIcon,
} from "lucide-react";
import { BiSolidDownArrow, BiSolidRightArrow } from "react-icons/bi";
import { PiFolderFill, PiBuildings } from "react-icons/pi";
import { FaDiagramProject } from "react-icons/fa6";
import { TbSubtask } from "react-icons/tb";
import Tooltip from "@/utils/Tooltip";
import DropdownV2 from "@/utils/DropdownV2";
import CustomModal from "@/utils/CustomModal";
import SprintForm from "@/components/TestDesignStudio/ProjectSprintDocs/SprintForm";
import SprintBPMapping from "@/components/TestDesignStudio/ProjectSprintDocs/SprintBPMapping";
import Projects from "@/components/TestDesignStudio/ProjectSprintDocs/Projects";
import { getDecryptedData } from "../helpers/storageHelper.js";
import transformApiDataToTree, {
  transformProcessesResponse,
} from "../helpers/LeftNavProjectParser.jsx";
import { apiRequest } from "../helpers/ApiHelper";
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
  SprintId?: string | number;
  SprintName?: string;
  BusinessProcessId?: string | number;
  BusinessProcessName?: string;
  BusinessSubProcessId?: string | number;
  BusinessSubProcessName?: string;
  SubProccessId?: string | number;
  SubProccessName?: string;
};

export type ProjectMenuProps = {
  collapsed: boolean;
  location: any; // react-router location
  navigateFn: (url: string) => void;
};

/* ------------------------------  utilities ------------------------------ */
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
  [
    "CLId",
    "BUID",
    "BUNM",
    "PJID",
    "PJN",
    "SPRID",
    "SPRN",
    "BPID",
    "BPN",
    "SPID",
    "BSPN",
  ].forEach((k) => {
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

async function fetchBusinessUnits(): Promise<BUOption[]> {
  const user = getDecryptedData("UserSession");
  const ClientId = user?.ClientId ?? "";
  const resp = await apiRequest("/api/GetBusinessUnitMasterByClientId", { ClientId });
  return resp?.ResponseData ?? [];
}

async function fetchProjectsWithSprints(clientId: string, buId: string) {
  const resp = await apiRequest("/GetClientProjectsWithSprints", {
    ClientId: clientId,
    BusinessUnitId: buId,
    ProjectId: "",
  });
  return resp;
}

async function fetchProjectList(clientId: string, buId: string) {
  const resp = await apiRequest("/client-projects/GetClientProjectsByClientId", {
    ClientId: clientId,
    BusinessUnitId: buId,
  });
  return resp;
}

async function fetchBPAndSubProcess({ ClientId, BusinessUnitId, ProjectId, SprintId }: any) {
  const resp = await apiRequest("/subprocess/GetMappedProjectSprintClientSubProcessesProjectSprintV5", {
    ClientId,
    BusinessUnitId,
    ProjectId,
    SprintId,
  });
  return resp;
}

/* --------------------------------- SidebarItem ------------------------------ */
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

    // ref for click-outside
    setEditingContainerRef,
  } = props;

  const isSprint = item.type === "sprint";
  const isBusinessProcess = item.type === "businessprocess";
  const isSubprocess = item.type === "subprocess";

  const hasChildren = Array.isArray(item.children) && item.children.length > 0;
  const isOpen = !!openMenus[item.key];
  const { isSelfSprint, isSelfBP, isSelfSP, hasActiveChild, hasActiveSPDescendant } =
    checkActive(item, location);

  const baseClasses = "relative flex items-center w-full px-2 py-2 rounded-lg transition";
  const BASE_INDENT = 1;
  const INDENT_STEP = 8;
  const paddingLeft = `${BASE_INDENT + depth * INDENT_STEP}px`;

  const isSelected = selectedKey === item.key;

  // 🔹 Do NOT apply active bg while editing this sprint
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

  // helper: if user interacts elsewhere, cancel edit
  const maybeAutoCancel = (nextTargetKey?: string) => {
    if (!editingSprintKey) return;
    onEditSprintCancel?.();
  };

  const goToSprint = async (sprintNode: any) => {
    openSprintExclusive(sprintNode.key);
    setSelectedKey(sprintNode.key);
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
    if (parentSprintKey) openSprintExclusive(parentSprintKey);
    openBPExclusive(parentSprintKey, bpNode.key);
    setSelectedKey(bpNode.key);
    const url = ensureProjectDetailsURL(location, bpNode, {
      BPID: bpNode.BusinessProcessId,
      BPN: bpNode.BusinessProcessName,
      SPID: null,
      BSPN: null,
    });
    navigateFn(url + "&tab=ProjectDetails");
  };

  const goToSub = (spNode: any) => {
    if (parentSprintKey) openSprintExclusive(parentSprintKey);
    if (parentBPKey) openBPExclusive(parentSprintKey, parentBPKey);
    setSelectedKey(spNode.key);
    setOpenMenus((prev: any) => ({ ...prev, [spNode.key]: true }));

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
    // Auto-cancel if interacting anywhere in the tree
    maybeAutoCancel(item.key);

    if (isSprint) return goToSprint(item);
    if (isBusinessProcess) return goToBP(item);
    if (isSubprocess) return goToSub(item);

    const hasChildren = Array.isArray(item.children) && item.children.length > 0;
    if (!hasChildren && item.route) {
      const sp = new URLSearchParams(location.search);
      const nextSearch = setSearchParam(`?${sp.toString()}`, "tab", "ProjectDetails");
      navigateFn(item.route + nextSearch);
    } else if (hasChildren) {
      toggleMenu(item.key);
    }
  };

  const handleChevronClick = async (e: any) => {
    e.stopPropagation();

    // Auto-cancel even if this is the same sprint caret
    maybeAutoCancel(item.key);

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

    toggleMenu(item.key);
  };

  const isProjectLevel = !!item.ProjectId && !item.SprintId;

  return (
    <div>
      <div
        className={`${baseClasses} group ${isRowActive ? "bg-[#0071E9] text-white" : "text-gray-900"} cursor-pointer ${collapsed ? "justify-center" : ""}`}
        style={{ paddingLeft: collapsed ? "8px" : paddingLeft }}
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

        {/* === Label OR Inline Editor (sprint) === */}
        {!collapsed && item.type === "sprint" && editingSprintKey === item.key ? (
          // Inline editor for sprint rename
          <div className="ml-1 flex-1 relative" ref={(el) => setEditingContainerRef?.(el)}>
            {/* Top-right Cancel above the field */}
            {/* <button
              title="Cancel"
              className="absolute -top-4  right-0 text-xs font-semibold text-red-500 underline"
              onClick={(e) => {
                e.stopPropagation();
                onEditSprintCancel?.();
              }}
              disabled={editingSprintSaving}
            >
              Cancel
            </button> */}

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
                {editingSprintSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        ) : (
          // Normal label when not editing this sprint
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
              className="ml-auto mr-2 p-1 rounded hover:bg-gray-100 text-gray-600 cursor-pointer"
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

        {/* Sprint actions (hidden while that sprint is being edited) */}
        {!collapsed && isSprint && editingSprintKey !== item.key && (
          <div className="ml-auto flex items-center gap-1">
            <TooltipV2
              content={
                <div className="">
                  Map Business Process
                </div>
              }
              initialPosition=""
            >
              <button
                className="ml-auto mr-2 p-1 rounded hover:bg-gray-100 text-gray-600 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditSprintCancel?.();
                  onAddSprintClick?.(item);
                }}
              >
                <Plus className={`w-4 h-4 ${isRowActive ? "text-white" : "text-gray-600"}`} />
              </button>
            </TooltipV2>


            <TooltipV2
              content={
                <div className="">
                  Edit Folder Name
                </div>
              }
              initialPosition=""
            >
              <button
                className="p-1 rounded cursor-pointer text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
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
          </div>
        )}

        {!collapsed && loadingByKey[item.key] && (
          <div className="ml-2">
            <Loader2 className={`w-4 h-4 animate-spin ${isRowActive ? "text-white" : "text-gray-500"}`} />
          </div>
        )}
      </div>

      {/* Inline Sprint Adder (shows under a Project row) */}
      {!collapsed && !!item.ProjectId && !item.SprintId && inlineAddProjectKey === item.key && (
        <div className="px-4 py-2">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-[14px] font-medium text-sky-600 mb-1">New Folder</label>
            <button
              title="Cancel"
              className="underline cursor-pointer  text-xs font-semibold text-red-500"
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
              title="Save"
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
          className={`relative transition-all duration-300 ${(item.children?.length ?? 0) > 6 ? "max-h-60 overflow-y-auto pr-1" : ""
            } overflow-x-auto`}
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
                  openBPExclusive={openBPExclusive}
                  onAddSprintClick={onAddSprintClick}
                  onOpenBPMappingClick={onOpenBPMappingClick}

                  // pass through rename props to children too
                  editingSprintKey={editingSprintKey}
                  editingSprintName={editingSprintName}
                  setEditingSprintName={setEditingSprintName}
                  editingSprintSaving={editingSprintSaving}
                  onEditSprintClick={onEditSprintClick}
                  onEditSprintSave={onEditSprintSave}
                  onEditSprintCancel={onEditSprintCancel}
                  setEditingContainerRef={setEditingContainerRef}

                  // inline add passthrough (unchanged)
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

/* ------------------------------- FloatingMenu ------------------------------ */
function FloatingMenu({
  item,
  position,
  onMouseEnter,
  onMouseLeave,
  location,
  onSprintOpen,
  loadingByKey,
  selectedKey,
  setSelectedKey,
  openSprintExclusive,
  openBPExclusive,
  onAddSprintClick,
  onOpenBPMappingClick,
  navigateFn,
}: any) {
  const [fmOpen, setFmOpen] = useState(() => ({ [item.key]: true }));

  const isOpen = (key: string) => !!fmOpen[key];
  const toggleFM = (key: string) => setFmOpen((prev: any) => ({ ...prev, [key]: !prev[key] }));

  const goSprint = async (node: any) => {
    openSprintExclusive(node.key);
    setSelectedKey(node.key);
    const url = buildProjectDetailsURLFromNode(node, {
      BPID: null,
      BPN: null,
      SPID: null,
      BSPN: null,
    });
    navigateFn(url + "&tab=ProjectDetails");
    const hasKids = Array.isArray(node.children) && node.children.length > 0;
    if (!hasKids && onSprintOpen) await onSprintOpen(node);
    setFmOpen((o: any) => ({ ...o, [node.key]: true }));
  };

  const goBP = (node: any, parentSprintKey: string) => {
    openSprintExclusive(parentSprintKey);
    openBPExclusive(parentSprintKey, node.key);
    setSelectedKey(node.key);
    const url = ensureProjectDetailsURL(location, node, {
      BPID: node.BusinessProcessId,
      BPN: node.BusinessProcessName,
      SPID: null,
      BSPN: null,
    });
    navigateFn(url + "&tab=ProjectDetails");
    setFmOpen((o: any) => ({ ...o, [node.key]: true }));
  };

  const goSub = (node: any, parentSprintKey: string, parentBPKey: string) => {
    openSprintExclusive(parentSprintKey);
    openBPExclusive(parentSprintKey, parentBPKey);
    setSelectedKey(node.key);

    const subId = node.BusinessSubProcessId ?? node.SubProccessId;
    const url = ensureProjectDetailsURL(location, node, {
      BPID: node.BusinessProcessId,
      BPN: node.BusinessProcessName,
      SPID: subId,
      BSPN: node.BusinessSubProcessName ?? node.SubProccessName,
    });
    navigateFn(url + "&tab=ProjectDetails");
    setFmOpen((o: any) => ({ ...o, [node.key]: true }));
  };

  const onClickRow = async (
    node: any,
    parentSprintKey: string | null = null,
    parentBPKey: string | null = null
  ) => {
    if (node.type === "sprint") return goSprint(node);
    if (node.type === "businessprocess") return goBP(node, parentSprintKey as string);
    if (node.type === "subprocess") return goSub(node, parentSprintKey as string, parentBPKey as string);
    if (node.route) {
      setSelectedKey(node.key);
      const nextSearch = setSearchParam(location.search, "tab", "ProjectDetails");
      navigateFn(node.route + nextSearch);
    }
  };

  const onClickChevron = async (
    e: any,
    node: any,
    parentSprintKey: string | null = null,
    parentBPKey: string | null = null
  ) => {
    e.stopPropagation();
    const open = isOpen(node.key);

    if (node.type === "sprint") {
      if (open) {
        setFmOpen((o: any) => ({ ...o, [node.key]: false }));
        return;
      }
      await goSprint(node);
      return;
    }

    if (node.type === "businessprocess") {
      if (open) {
        setFmOpen((o: any) => ({ ...o, [node.key]: false }));
        return;
      }
      goBP(node, parentSprintKey as string);
      return;
    }

    if (node.type === "subprocess") {
      if (open) {
        setFmOpen((o: any) => ({ ...o, [node.key]: false }));
        return;
      }
      goSub(node, parentSprintKey as string, parentBPKey as string);
      return;
    }

    toggleFM(node.key);
  };

  const isActiveForMenu = (node: any) => node.type !== "sprint" && selectedKey === node.key;

  const FMItem = ({ node, depth = 0, parentSprintKey = null, parentBPKey = null }: any) => {
    const hasKids = Array.isArray(node.children) && node.children.length > 0;
    const open = isOpen(node.key);
    const loading = !!loadingByKey?.[node.key];
    const active = isActiveForMenu(node);
    const leftPad = 8 + depth * 10;

    const fmIcon =
      node.type === "businessprocess" ? (
        <FaDiagramProject className={`w-4 h-4 ${active ? "text-[#0071E9]" : "text-gray-500"}`} />
      ) : node.type === "subprocess" ? (
        <TbSubtask className={`w-4 h-4 ${active ? "text-[#0071E9]" : "text-gray-500"}`} />
      ) : null;

    const isProjectLevel = !!node.ProjectId && !node.SprintId;

    return (
      <div className="w-full">
        <div
          className={`flex items-center justify-between rounded cursor-pointer px-2 py-1 ${active ? "text-[#0071E9] font-semibold" : "text-gray-700"
            }`}
          style={{ paddingLeft: leftPad }}
          onClick={() => onClickRow(node, parentSprintKey, parentBPKey)}
        >
          <div className="flex items-center min-w-0">
            {(hasKids || node.type === "sprint") && (
              <button
                className="mr-1.5 p-1 rounded shrink-0"
                onClick={(e) => onClickChevron(e, node, parentSprintKey, parentBPKey)}
                title={open ? "Collapse" : "Expand"}
              >
                {open ? (
                  <BiSolidDownArrow className="w-4 h-4 text-gray-500" />
                ) : (
                  <BiSolidRightArrow className="w-4 h-4 text-gray-500" />
                )}
              </button>
            )}
            {fmIcon && <span className="mr-2 shrink-0">{fmIcon}</span>}
            <span className={`truncate ${node.type === "sprint" ? "font-semibold" : ""}`}>
              {node.label}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {isProjectLevel && (
               <TooltipV2
              content={
                <div className="">
                 Add Folder
                </div>
              }
              initialPosition=""
            >
             <button
                className="p-1 rounded hover:bg-gray-100 text-gray-600 cursor-pointer"
                title=""
                onClick={(e) => {
                  e.stopPropagation();
                  onAddSprintClick?.(node);
                }}
              >
                <Plus className="w-4 h-4" />
              </button>
            </TooltipV2>
              
            )}
            {node.type === "sprint" && (
               <TooltipV2
              content={
                <div className="">
                Map Business Process 
                </div>
              }
              initialPosition=""
            >
         <button
                className="p-1 rounded hover:bg-gray-100 text-gray-600 cursor-pointer"
                title="Business Process Mapping"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenBPMappingClick?.(node);
                }}
              >
                <Plus className="w-4 h-4" />
              </button>
            </TooltipV2>
              
            )}
            {loading && <Loader2 className="ml-1 w-3.5 h-3.5 animate-spin text-gray-500" />}
          </div>
        </div>

        {open && hasKids && (
          <div className="mt-0.5">
            {node.children.map((c: any) => (
              <FMItem
                node={c}
                depth={depth + 1}
                key={c.key}
                parentSprintKey={node.type === "sprint" ? node.key : parentSprintKey}
                parentBPKey={node.type === "businessprocess" ? node.key : parentBPKey}
              />
            ))}
          </div>
        )}

        {open && !hasKids && loading && (
          <div className="text-xs text-gray-500 flex items-center gap-2 pl-4 py-1" style={{ paddingLeft: leftPad + 10 }}>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Loading...
          </div>
        )}
      </div>
    );
  };

  return createPortal(
    <AnimatePresence>
      {position && (
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 10 }}
          transition={{ duration: 0.15 }}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg w-56 p-2.5"
          style={{ top: `${position.top}px`, left: `${position.left}px` }}
        >
          <div className="text-sm font-semibold text-gray-800 mb-2 px-1">{item.label}</div>
          <FMItem node={item} parentSprintKey={item.type === "sprint" ? item.key : null} />
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

/* ------------------------------- ProjectMenu ------------------------------- */
export default function ProjectMenu({ collapsed, location, navigateFn }: ProjectMenuProps) {
  const [hoveredItem, setHoveredItem] = useState<any>(null);
  const [tooltipPosition, setTooltipPosition] = useState<any>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const timeoutRef = useRef<any>(null);

  const [businessUnits, setBusinessUnits] = useState<BUOption[]>([]);
  const [currBU, setCurrBU] = useState<string>("");
  const [groups, setGroups] = useState<{ category?: string; items: TreeNode[] }[]>([{ items: [] }]);

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [loadingByKey, setLoadingByKey] = useState<Record<string, boolean>>({});
  const [processCache, setProcessCache] = useState<Record<string, any[]>>({});

  const [openProjectModal, setOpenProjectModal] = useState(false);
  const [openSprintAdd, setOpenSprintAdd] = useState(false);

  const [inlineAddProjectKey, setInlineAddProjectKey] = useState<string | null>(null);
  const [inlineSprintName, setInlineSprintName] = useState<string>("");
  const [inlineSaving, setInlineSaving] = useState<boolean>(false);

  // rename state
  const [editingSprintKey, setEditingSprintKey] = useState<string | null>(null);
  const [editingSprintName, setEditingSprintName] = useState<string>("");
  const [editingSprintSaving, setEditingSprintSaving] = useState<boolean>(false);

  // ref to the active inline editor container (for click-outside)
  const editingContainerRef = useRef<HTMLDivElement | null>(null);

  const [openBPMap, setOpenBPMap] = useState(false);

  const [sprintCtx, setSprintCtx] = useState<{ ClientId: string; ProjectId: string; BusinessUnitId?: string }>({
    ClientId: "",
    ProjectId: "",
    BusinessUnitId: "",
  });

  const [bpCtx, setBpCtx] = useState<{ ClientId: string; ProjectId: string; BusinessUnitId: string; SprintId: string }>({
    ClientId: "",
    ProjectId: "",
    BusinessUnitId: "",
    SprintId: "",
  });

  /* ------------------------------ Load BU + Projects ------------------------------ */
  useEffect(() => {
    (async () => {
      const bus = await fetchBusinessUnits();
      setBusinessUnits(bus);
      const defaultBU = bus?.[0]?.value ?? "";
      setCurrBU(defaultBU);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const user = getDecryptedData("UserSession");
      if (!user?.ClientId || !currBU) return;

      // First, ensure projects are available (kept for parity with original flow)
      await fetchProjectList(user.ClientId, currBU);

      const resp = await fetchProjectsWithSprints(user.ClientId, currBU);
      if (resp?.ResponseData?.length > 0) {
        const treeGroups = [{ items: transformApiDataToTree(resp) as any[] }];
        setGroups(treeGroups);
        // Expand first project by default
        const firstProjectKey = treeGroups[0]?.items?.[0]?.key;
        if (firstProjectKey) {
          setOpenMenus((prev) => ({ ...prev, [firstProjectKey]: true }));
        }
      } else {
        setGroups([{ items: [] }]);
      }
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
      sprintKeys.forEach((k) => {
        next[k] = k === targetSprintKey;
      });
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
      bpKeys.forEach((k) => {
        next[k] = k === targetBPKey;
      });
      return next;
    });
  };

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

  const onSprintOpen = async (sprintItem: any) => {
    const sprintId = String(sprintItem?.SprintId || "");
    const sprintKey = sprintItem?.key;
    if (!sprintId || !sprintKey) return;

    setOpenMenus((om) => ({ ...om, [sprintKey]: true }));
    setLoadingByKey((p) => ({ ...p, [sprintKey]: true }));

    try {
      if (processCache[sprintId]) {
        attachProcessesToSprintDual(sprintKey, sprintId, processCache[sprintId]);
        return;
      }

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

      setProcessCache((p) => ({ ...p, [sprintId]: processNodes }));
      attachProcessesToSprintDual(sprintKey, sprintId, processNodes);
    } catch (e) {
      attachProcessesToSprintDual(sprintKey, sprintId, []);
    } finally {
      setLoadingByKey((p) => ({ ...p, [sprintKey]: false }));
      setOpenMenus((om) => ({ ...om, [sprintKey]: true }));
    }
  };

  const refreshSidebar = async (preserveOpen = true) => {
    const user = getDecryptedData("UserSession");
    if (!user?.ClientId || !currBU) return;

    const snapshotOpen = { ...openMenus };
    const snapshotSelected = selectedKey;

    const resp = await fetchProjectsWithSprints(user.ClientId, currBU);
    if (resp?.ResponseData?.length > 0) {
      const nextGroups = [{ items: transformApiDataToTree(resp) as any[] }];
      setGroups(nextGroups);

      if (preserveOpen) {
        setOpenMenus(snapshotOpen);
        setSelectedKey(snapshotSelected ?? null);
      } else {
        const firstProjectKey = nextGroups[0]?.items?.[0]?.key;
        setOpenMenus(firstProjectKey ? { [firstProjectKey]: true } : {});
      }
    } else {
      setGroups([{ items: [] }]);
    }
  };

  const refreshSprintProcesses = async (sprintId: string) => {
    const sprintNode = findSprintNodeById(sprintId);
    if (!sprintNode) {
      await refreshSidebar(true);
      return;
    }
    setOpenMenus((om) => ({ ...om, [sprintNode.key]: true }));
    setProcessCache((p) => {
      const n = { ...p };
      delete n[String(sprintId)];
      return n;
    });
    await onSprintOpen(sprintNode);
  };

  /* ------------------------------ Modals openers ------------------------------ */
  const handleOpenProjectModal = () => setOpenProjectModal(true);

  const openSprintAddForItem = (node: any) => {
    const user = getDecryptedData("UserSession");
    const ClientId = String(node.ClientId || user?.ClientId || "");
    const ProjectId = String(node.ProjectId || "");
    const BusinessUnitId = String(node.BusinessUnitId || currBU || "");
    setSprintCtx({ ClientId, ProjectId, BusinessUnitId });
    setInlineAddProjectKey(node.key);
    setInlineSprintName("");
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

  const saveInlineSprint = async () => {
    if (!inlineAddProjectKey || !inlineSprintName?.trim()) return;
    try {
      setInlineSaving(true);
      await apiRequest("/AddUpdateClientProjectSprint", {
        ClientId: sprintCtx.ClientId,
        BusinessUnitId: sprintCtx.BusinessUnitId,
        ProjectId: sprintCtx.ProjectId,
        SprintName: inlineSprintName.trim(),
      });
      await refreshSidebar(true);
      setInlineAddProjectKey(null);
      setInlineSprintName("");
    } finally {
      setInlineSaving(false);
    }
  };

  const cancelInlineSprint = () => {
    setInlineAddProjectKey(null);
    setInlineSprintName("");
  };

  // Start editing for a sprint node
  const startEditSprint = (sprintNode: any) => {
    const currentName = sprintNode?.SprintName ?? sprintNode?.label ?? "";
    setEditingSprintKey(sprintNode.key);
    setEditingSprintName(String(currentName));
  };

  // Cancel edit
  const cancelEditSprint = () => {
    setEditingSprintKey(null);
    setEditingSprintName("");
    setEditingSprintSaving(false);
    // also clear the ref
    editingContainerRef.current = null;
  };

  // Save new name
  const saveEditSprint = async () => {
    if (!editingSprintKey || !editingSprintName.trim()) return;
    const node = findSprintNodeByKey(editingSprintKey);
    if (!node?.SprintId) return;

    try {
      setEditingSprintSaving(true);
      await apiRequest("/AddUpdateClientProjectSprint", {
        ClientId: node.ClientId,
        BusinessUnitId: node.BusinessUnitId,
        ProjectId: node.ProjectId,
        SprintId: node.SprintId,
        SprintName: editingSprintName.trim(),
      });

      await refreshSidebar(true);

      // keep it open/selected
      setOpenMenus((om) => ({ ...om, [node.key]: true }));
      setSelectedKey(node.key);
    } finally {
      cancelEditSprint();
    }
  };

  /* ---------- Global click-outside to cancel inline rename ---------- */
  useEffect(() => {
    if (!editingSprintKey) return;

    const handleDocClick = (e: MouseEvent) => {
      const container = editingContainerRef.current;
      if (container && container.contains(e.target as Node)) return; // click inside editor
      // clicked outside -> cancel
      cancelEditSprint();
    };

    document.addEventListener("mousedown", handleDocClick, true);
    return () => {
      document.removeEventListener("mousedown", handleDocClick, true);
    };
  }, [editingSprintKey]);

  /* ------------------------------ Hover menu plumbing ------------------------------ */

  const handleMouseEnter = (e: any, item: any) => {
    const rect = e.currentTarget.getBoundingClientRect();
    clearTimeout(timeoutRef.current);
    setHoveredItem(item);
    setTooltipPosition({ top: rect.top, left: rect.right + 4 });
    setMenuVisible(true);
  };
  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      if (!menuVisible) {
        setHoveredItem(null);
        setTooltipPosition(null);
      }
    }, 200);
  };
  const handleMenuEnter = () => clearTimeout(timeoutRef.current);
  const handleMenuLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setHoveredItem(null);
      setTooltipPosition(null);
      setMenuVisible(false);
    }, 200);
  };

  /* ----------------------------------- UI ----------------------------------- */
  return (
    <div className="flex-1 overflow-y-auto overflow-x-auto space-y-4 pb-4">
      {/* Business Unit dropdown */}
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
                  Add Project
                </div>
              }
              initialPosition=""
            >
            <button
              onClick={handleOpenProjectModal}
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

      {/* Tree */}
      {groups.map((group, idx) => (
        <div key={`group-${idx}`}>
          {!collapsed && group.category ? (
            <div className="px-2 text-xs text-sky-700/80 font-semibold uppercase tracking-wide mb-1">
              {group.category ?? ""}
            </div>
          ) : (
            ""
          )}
          {group.items?.map((item: any) => (
            <div
              key={item.key}
              onMouseEnter={(e) => (collapsed ? handleMouseEnter(e, item) : null)}
              onMouseLeave={collapsed ? handleMouseLeave : undefined}
            >
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
                onOpenBPMappingClick={openBPMappingForItem}

                /* Inline add props */
                inlineAddProjectKey={inlineAddProjectKey}
                inlineSprintName={inlineSprintName}
                setInlineSprintName={setInlineSprintName}
                inlineSaving={inlineSaving}
                onInlineSave={saveInlineSprint}
                onInlineCancel={cancelInlineSprint}

                /* Inline rename props */
                editingSprintKey={editingSprintKey}
                editingSprintName={editingSprintName}
                setEditingSprintName={setEditingSprintName}
                editingSprintSaving={editingSprintSaving}
                onEditSprintClick={startEditSprint}
                onEditSprintSave={saveEditSprint}
                onEditSprintCancel={cancelEditSprint}
                setEditingContainerRef={(el: HTMLDivElement | null) => {
                  // keep reference to current inline editor DOM node
                  editingContainerRef.current = el;
                }}
              />
            </div>
          ))}
        </div>
      ))}

      {/* Floating hover menu for collapsed sidebar */}
      {collapsed && hoveredItem && tooltipPosition && (
        <FloatingMenu
          item={hoveredItem}
          position={tooltipPosition}
          onMouseEnter={handleMenuEnter}
          onMouseLeave={handleMenuLeave}
          location={location}
          onSprintOpen={onSprintOpen}
          loadingByKey={loadingByKey}
          selectedKey={selectedKey}
          setSelectedKey={setSelectedKey}
          openSprintExclusive={openSprintExclusive}
          openBPExclusive={openBPExclusive}
          onAddSprintClick={openSprintAddForItem}
          onOpenBPMappingClick={openBPMap
            ? () => { } // keep prop types happy; floating menu unaffected
            : openBPMappingForItem}
          navigateFn={navigateFn}
        />
      )}

      {/* ======= Modals ======= */}
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
        title={<div className="font-medium text-base">New Sprint</div>}
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
  );
}
