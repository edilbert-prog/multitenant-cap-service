import type { LucideIcon } from "lucide-react";
import { Folder } from "lucide-react";

const enc = encodeURIComponent;

type ApiStatus = "success" | "error" | string;

interface ApiResponse {
  status?: ApiStatus;
  ResponseData?: unknown;
  [key: string]: unknown;
}

interface RawProject {
  ProjectId?: string | number;
  ProjectName?: string;
  ClientId?: string | number;
  BusinessUnitId?: string | number;
  BusinessUnitName?: string;
  Sprints?: RawSprint[];
  [key: string]: unknown;
}

interface RawSprint {
  SprintId?: string | number;
  SprintName?: string;
  [key: string]: unknown;
}


export interface SprintNode {
  type: "sprint";
  key: string;
  label?: string;
  SprintId?: string;
  SprintName?: string;
  ProjectName?: string;
  ProjectId?: string;
  ClientId?: string;
  BusinessUnitId?: string;
  BusinessUnitName?: string;
  children?: undefined;
  route: string;
  [key: string]: unknown;
}

export interface ProjectNode {
  type: "project";
  key: string;
  label: string;
  icon: LucideIcon;
  route: string;
  ProjectId?: string;
  ProjectName?: string;
  ClientId?: string;
  BusinessUnitId?: string;
  BusinessUnitName?: string;
  children?: SprintNode[];
  [key: string]: unknown;
}

export default function transformApiDataToTree(apiResponse: unknown): ProjectNode[] {
  const resp = apiResponse as ApiResponse;
  if (!resp || resp.status !== "success" || !Array.isArray(resp.ResponseData)) {
    return [];
  }

  const projects = resp.ResponseData as RawProject[];

  const projectNodes: ProjectNode[] = projects.map((project) => {
    const sprintNodes: SprintNode[] = (project.Sprints || []).map((sprint) => ({
      type: "sprint",
      key: `s-${String(sprint.SprintId)}`,
      label: sprint.SprintName,
      SprintId: String(sprint.SprintId),
      SprintName: sprint.SprintName,
      ProjectName: project.ProjectName,
      ProjectId: String(project.ProjectId),
      ClientId: String(project.ClientId),
      BusinessUnitId: String(project.BusinessUnitId),
      BusinessUnitName: project.BusinessUnitName,
      children: undefined,
      route: `/ProjectDetails?CLId=${enc(String(project.ClientId))}&BUID=${enc(
          String(project.BusinessUnitId)
      )}&BUNM=${enc(project.BusinessUnitName || "")}&PJID=${enc(String(project.ProjectId))}&PJN=${enc(
          project.ProjectName || ""
      )}&SPRID=${enc(String(sprint.SprintId))}&SPRN=${enc(sprint.SprintName || "")}`,
    }));

    return {
      type: "project",
      key: `p-${String(project.ProjectId)}`,
      label: project.ProjectName || "Unnamed Project",
      icon: Folder,
      route: `/ProjectDetails?CLId=${enc(String(project.ClientId))}&BUID=${enc(
          String(project.BusinessUnitId)
      )}&PJID=${enc(String(project.ProjectId))}&PJN=${enc(project.ProjectName || "")}`,
      ProjectId: String(project.ProjectId),
      ProjectName: project.ProjectName,
      ClientId: String(project.ClientId),
      BusinessUnitId: String(project.BusinessUnitId),
      BusinessUnitName: project.BusinessUnitName,
      children: sprintNodes.length > 0 ? sprintNodes : undefined,
    };
  });

  return projectNodes;
}

interface SprintCtx {
  ClientId?: string;
  BusinessUnitId?: string;
  BusinessUnitName?: string;
  ProjectId?: string;
  ProjectName?: string;
  SprintId?: string;
  SprintName?: string;
  [key: string]: unknown;
}

interface RawSubProcess {
  BusinessSubProcessId?: string | number;
  BusinessSubProcessName?: string;
  SubProccessId?: string | number;
  SubProccessName?: string;
  ProjectSprintProcessId?: string | number;
  BusinessProcessId?: string | number;
  BusinessProcessName?: string;
  ClientId?: string | number;
  BusinessUnitId?: string | number;
  BusinessUnitName?: string;
  ProjectId?: string | number;
  ProjectName?: string;
  SprintId?: string | number;
  SprintName?: string;
  selected?: boolean;
  indeterminate?: boolean;
  Applications?: unknown[];
  Integrations?: unknown[];
  SubProcesses?: RawSubProcess[];
  [key: string]: unknown;
}

interface RawBusinessProcess {
  BusinessProcessId?: string | number;
  BusinessProcessName?: string;
  ClientId?: string | number;
  BusinessUnitId?: string | number;
  BusinessUnitName?: string;
  ProjectId?: string | number;
  ProjectName?: string;
  SprintId?: string | number;
  SprintName?: string;
  selected?: boolean;
  indeterminate?: boolean;
  SubProcesses?: RawSubProcess[];
  [key: string]: unknown;
}

interface ProcessesResponse {
  ResponseData?: {
    BusinessProcesses?: RawBusinessProcess[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface SubprocessNode {
  type: "subprocess";
  key: string;
  label: string;
  BusinessSubProcessId?: string;
  BusinessSubProcessName?: string;
  SubProccessId?: string;
  SubProccessName?: string;
  ProjectSprintProcessId?: string;
  BusinessProcessId?: string;
  BusinessProcessName?: string;
  ClientId?: string;
  BusinessUnitId?: string;
  BusinessUnitName?: string;
  ProjectId?: string;
  ProjectName?: string;
  SprintId?: string;
  SprintName?: string;
  selected: boolean;
  indeterminate: boolean;
  Applications: unknown[];
  Integrations: unknown[];
  children?: SubprocessNode[];
  __raw: null;
  [key: string]: unknown;
}

export interface BusinessProcessNode {
  type: "businessprocess";
  key: string;
  label: string;
  BusinessProcessId?: string;
  BusinessProcessName?: string;
  ClientId?: string;
  BusinessUnitId?: string;
  BusinessUnitName?: string;
  ProjectId?: string;
  ProjectName?: string;
  SprintId?: string;
  SprintName?: string;
  selected: boolean;
  indeterminate: boolean;
  children?: SubprocessNode[];
  __raw: null;
  [key: string]: unknown;
}

export function transformProcessesResponse(
    resp: unknown,
    sprintCtx: SprintCtx = {}
): BusinessProcessNode[] {
  try {
    const r = resp as ProcessesResponse;
    const bpList: RawBusinessProcess[] = r?.ResponseData?.BusinessProcesses || [];
    const norm = (v: unknown): string | undefined =>
        v === undefined || v === null ? undefined : String(v);

    const baseFromCtx: SprintCtx = {
      ClientId: norm(sprintCtx.ClientId),
      BusinessUnitId: norm(sprintCtx.BusinessUnitId),
      BusinessUnitName: sprintCtx.BusinessUnitName,
      ProjectId: norm(sprintCtx.ProjectId),
      ProjectName: sprintCtx.ProjectName,
      SprintId: norm(sprintCtx.SprintId),
      SprintName: sprintCtx.SprintName,
    };

    const mapSubprocesses = (
        subs: RawSubProcess[] | undefined,
        bpInfo: { BusinessProcessId?: string; BusinessProcessName?: string }
    ): SubprocessNode[] =>
        (subs || []).map((sp, i) => {
          const subId =
              norm(sp.BusinessSubProcessId) ?? norm(sp.SubProccessId) ?? `idx-${i}`;

          const node: SubprocessNode = {
            type: "subprocess",
            key: `sp-${baseFromCtx.SprintId || "nospr"}-${bpInfo.BusinessProcessId || "nobp"}-${subId}`,
            label: sp.BusinessSubProcessName || sp.SubProccessName || "Sub-process",
            BusinessSubProcessId: norm(sp.BusinessSubProcessId),
            BusinessSubProcessName: sp.BusinessSubProcessName ?? sp.SubProccessName,
            SubProccessId: norm(sp.SubProccessId),
            SubProccessName: sp.SubProccessName,
            ProjectSprintProcessId: norm(sp.ProjectSprintProcessId),
            BusinessProcessId: norm(sp.BusinessProcessId) ?? bpInfo.BusinessProcessId,
            BusinessProcessName: sp.BusinessProcessName ?? bpInfo.BusinessProcessName,
            ClientId: norm(sp.ClientId) ?? baseFromCtx.ClientId,
            BusinessUnitId: norm(sp.BusinessUnitId) ?? baseFromCtx.BusinessUnitId,
            BusinessUnitName: (sp as any).BusinessUnitName ?? baseFromCtx.BusinessUnitName,
            ProjectId: norm(sp.ProjectId) ?? baseFromCtx.ProjectId,
            ProjectName: (sp as any).ProjectName ?? baseFromCtx.ProjectName,
            SprintId: norm(sp.SprintId) ?? baseFromCtx.SprintId,
            SprintName: (sp as any).SprintName ?? baseFromCtx.SprintName,
            selected: !!sp.selected,
            indeterminate: !!sp.indeterminate,
            Applications: sp.Applications || [],
            Integrations: sp.Integrations || [],
            children:
                sp.SubProcesses && sp.SubProcesses.length > 0
                    ? mapSubprocesses(sp.SubProcesses, {
                      BusinessProcessId: norm(sp.BusinessProcessId) ?? bpInfo.BusinessProcessId,
                      BusinessProcessName: sp.BusinessProcessName ?? bpInfo.BusinessProcessName,
                    })
                    : undefined,
            __raw: null,
          };
          return node;
        });

    const processNodes: BusinessProcessNode[] = bpList.map((p, i) => {
      const bpId = norm(p.BusinessProcessId) ?? `idx-${i}`;
      const bpName = p.BusinessProcessName;

      const node: BusinessProcessNode = {
        type: "businessprocess",
        key: `bp-${baseFromCtx.SprintId || "nospr"}-${bpId}`,
        label: bpName || "Business Process",
        BusinessProcessId: bpId,
        BusinessProcessName: bpName,
        ClientId: norm(p.ClientId) ?? baseFromCtx.ClientId,
        BusinessUnitId: norm(p.BusinessUnitId) ?? baseFromCtx.BusinessUnitId,
        BusinessUnitName: p.BusinessUnitName ?? baseFromCtx.BusinessUnitName,
        ProjectId: norm(p.ProjectId) ?? baseFromCtx.ProjectId,
        ProjectName: p.ProjectName ?? baseFromCtx.ProjectName,
        SprintId: norm(p.SprintId) ?? baseFromCtx.SprintId,
        SprintName: p.SprintName ?? baseFromCtx.SprintName,
        selected: !!p.selected,
        indeterminate: !!p.indeterminate,
        children: mapSubprocesses(p.SubProcesses || [], {
          BusinessProcessId: bpId,
          BusinessProcessName: bpName,
        }),
        __raw: null,
      };
      return node;
    });

    return processNodes;
  } catch (e) {
    console.error("[SIDEBAR] TRANSFORM ERROR", e);
    return [];
  }
}

