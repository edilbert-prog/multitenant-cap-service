import { apiRequest } from "@/utils/helpers/ApiHelper";
import { read, utils } from "xlsx";
import { WorkspaceFormData } from "./CreateWorkspaceStep";

export type TransportObjectField =
  | "JiraNumber"
  | "ObjectName"
  | "TransportId"
  | "TransportNumber"
  | "Module"
  | "SubModule"
  | "ObjectType"
  | "WorkspaceName"
  | "Description";

export type TransportObjectRecord = Partial<Record<TransportObjectField, string>> & {
  [key: string]: any;
};

const COLUMN_ALIASES: Record<TransportObjectField, string[]> = {
  JiraNumber: ["JIRA No.", "JIRA No", "Jira Number", "JiraNumber", "Jira #"],
  ObjectName: ["Object Name", "ObjectName"],
  TransportId: ["Transport ID", "TransportId"],
  TransportNumber: ["Transport No.", "Transport No", "TransportNumber"],
  Module: ["Module"],
  SubModule: ["Sub Module", "Submodule", "SubModule"],
  ObjectType: ["Object Type", "ObjectType"],
  WorkspaceName: ["Workspace Name", "WorkspaceName"],
  Description: ["Description"]
};

const DISPLAY_FIELDS: TransportObjectField[] = [
  "JiraNumber",
  "ObjectName",
  "TransportId",
  "TransportNumber",
  "Module",
  "SubModule",
  "ObjectType",
  "WorkspaceName",
  "Description"
];

const normaliseHeader = (value: string): string =>
  value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");

const coerceCellValue = (value: unknown): string | undefined => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }
  return String(value);
};

export const getObjectsFromFile = async (file: File): Promise<TransportObjectRecord[]> => {
  try {
    if (!file || typeof file.arrayBuffer !== "function") return [];
    const buffer = await file.arrayBuffer();
    const workbook = read(buffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) return [];

    const sheet = workbook.Sheets[sheetName];
    const jsonRows = utils.sheet_to_json<Record<string, any>>(sheet, { defval: undefined });

    return jsonRows.reduce<TransportObjectRecord[]>((acc, rawRow) => {
      const normalisedRow = new Map<string, unknown>();
      Object.entries(rawRow).forEach(([key, value]) => {
        normalisedRow.set(normaliseHeader(key), value);
      });

      const mapped: TransportObjectRecord = { ...rawRow };

      (Object.entries(COLUMN_ALIASES) as Array<[TransportObjectField, string[]]>).forEach(
        ([field, aliases]) => {
          for (const alias of aliases) {
            const candidate = normalisedRow.get(normaliseHeader(alias));
            const coerced = coerceCellValue(candidate);
            if (coerced !== undefined) {
              mapped[field] = coerced;
              break;
            }
          }
        }
      );

      const hasRelevantData = DISPLAY_FIELDS.some((field) => {
        const value = mapped[field];
        return value !== undefined && value !== null && String(value).trim().length > 0;
      });

      if (hasRelevantData) {
        acc.push(mapped);
      }
      return acc;
    }, []);
  } catch (err) {
    console.error("Failed to parse transport objects file", err);
    return [];
  }
};

export const SOURCE_FILE_URL = "/cognito/api/ExtractTransportIdsFromSAPRFC";
export const DOCS_UPLOAD_URL = "/api/docs-upload";
export const GENERATE_CASES_URL = "/api/generate-cases";
export const TRANSPORT_OBJECTS_URL = "/cognito/api/GetSAPObjectsMasterPaginationFilterSearchNewV2";
export const WORKSPACES_URL = "https://sirobilt.ai/cognito/api/GetWorkspaces";

const getAuthHeader = (): HeadersInit | undefined => {
  if (typeof window === "undefined") return undefined;
  const token = sessionStorage.getItem("access_token");
  return token ? { authentication: token } : undefined;
};

const parseObjects = (payload: any): any[] => {
  if (Array.isArray(payload?.objects)) return payload.objects;
  if (Array.isArray(payload?.data?.objects)) return payload.data.objects;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

export const uploadSourceFile = async (file: File, workspaceId: string = "WSID-1"): Promise<any[]> => {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("WorkspaceId", workspaceId);

  const res = await apiRequest<any>(
                  '/ExtractTransportIdsFromSAPRFC',
                  fd,
                  { headers: { 'Content-Type': 'multipart/form-data' } }
              );
  

  if (!res.success) {
    const message = await res.text().catch(() => "");
    throw new Error(message || `Upload failed (${res.status})`);
  }

  const payload = await res.savedRecords;
  return parseObjects(payload);
};

export const createWorkspace = async (workspace: WorkspaceFormData): Promise<any[]> => {

  const data = {
    WorkspaceName: workspace.name,
    Module: workspace.module,
    Submodule: workspace.subModule,
    SharepointURL: workspace.repository,
    Notes: workspace.notes,
    Status: 1
  };

  const res = await apiRequest<any>(
                  '/AddUpdateWorkspace',
                  data,
                  { headers: {  'content-type': 'application/json' } });
  if (!res.status) {
    const message = await res.text().catch(() => "");
    throw new Error(message || `Upload failed (${res.status})`);
  }
  return res.addWorkspace;
};

export const uploadDocuments = async (files: File[]): Promise<any[]> => {
  const fd = new FormData();
  files.forEach((file) => fd.append("files", file));

  const res = await fetch(DOCS_UPLOAD_URL, {
    method: "POST",
    body: fd,
    headers: getAuthHeader()
  });

  if (!res.ok) {
    const message = await res.text().catch(() => "");
    throw new Error(message || `Document upload failed (${res.status})`);
  }

  const payload = await res.json();
  return Array.isArray(payload?.documents) ? payload.documents : Array.isArray(payload?.data) ? payload.data : [];
};

export type WorkspaceApiRecord = {
  WorkspaceId: string;
  WorkspaceName: string;
  Module?: string;
  Submodule?: string;
  SharepointURL?: string;
  Notes?: string;
  Status?: number;
  CreatedDate?: string;
  ModifiedDate?: string;
  IsTestGenerated?: boolean;
};

export const fetchWorkspaces = async (): Promise<WorkspaceApiRecord[]> => {

  const res = await apiRequest('/GetWorkspaces', {}, { headers: {  'content-type': 'application/json' } });

  if (res.status !== 'success') {
    const message = await res.text().catch(() => "");
    throw new Error(message || `Failed to load workspaces (${res.status})`);
  }

  const data = res.ResponseData ?? res.data ?? [];
  data[2].IsTestGenerated = true; // For testing purpose
  return data;
};

export const generateCasesRequest = async (payload: {
  object: any;
  objects?: any[];
  documents: any[];
  workspace?: WorkspaceFormData;
}): Promise<any> => {
  return await new Promise((resolve) => setTimeout(resolve, 3000));
  const res = await fetch(GENERATE_CASES_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(getAuthHeader() ?? {})
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const message = await res.text().catch(() => "");
    throw new Error(message || `Generate cases failed (${res.status})`);
  }

  return res.json();
};

export type TransportObjectFilters = {
  ObjectType?: string;
  Module?: string;
  SubModule?: string;
  SearchString?: string;
};

export const fetchTransportObjects = async (
  filters: TransportObjectFilters = {}
): Promise<any[]> => {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(getAuthHeader() ?? {})
  };

  const body = JSON.stringify({
    ObjectType: filters.ObjectType ?? "Transport",
    // ObjectType: filters.ObjectType ?? "Transaction",
    Module: filters.Module ?? "",
    SubModule: filters.SubModule ?? "",
    SearchString: filters.SearchString ?? ""
  });

  const res = await fetch(TRANSPORT_OBJECTS_URL, {
    method: "POST",
    headers,
    body
  });

  // if (!res.ok) {
  //   const message = await res.text().catch(() => "");
  //   throw new Error(message || `Failed to load transport objects (${res.status})`);
  // }

  // const payload = await res.json();
  // if (Array.isArray(payload?.ResponseData)) {
  //   return payload.ResponseData;
  // }
  // if (Array.isArray(payload?.data)) {
  //   return payload.data;
  // }
  // return [];
  return [
				{
					"TransportId": "TOID-23",
					"TransportNumber": "DEVK9A0SSG",
					"ObjectName": "Z_FI_PAYMENT_PROGRAM",
					"JiraNumber": "ITOTC-5778",
					"status": "saved"
				},
				{
					"TransportId": "TOID-24",
					"TransportNumber": "DEVK9A0SSG",
					"ObjectName": "Z_FI_INVOICE_REPORT",
					"JiraNumber": "ITOTC-5778",
					"status": "saved"
				},
				{
					"TransportId": "TOID-25",
					"TransportNumber": "DEVK9A0T6X",
					"ObjectName": "Z_SD_ORDER_FORM1",
					"JiraNumber": "ITOTC-5778",
					"status": "saved"
				},
				{
					"TransportId": "TOID-26",
					"TransportNumber": "DEVK9A0T6X",
					"ObjectName": "Z_SD_PRICING_CALC1",
					"JiraNumber": "ITOTC-5310",
					"status": "saved"
				},
        {
					"TransportId": "TOID-27",
					"TransportNumber": "DEVK9A0SSG",
					"ObjectName": "Z_FI_PAYMENT_PROGRAM1",
					"JiraNumber": "ITOTC-5310",
					"status": "saved"
				},
				{
					"TransportId": "TOID-28",
					"TransportNumber": "DEVK9A0SSG",
					"ObjectName": "Z_FI_INVOICE_REPORT1",
					"JiraNumber": "ITOTC-5310",
					"status": "saved"
				},
				{
					"TransportId": "TOID-29",
					"TransportNumber": "DEVK9A0T6X",
					"ObjectName": "Z_SD_ORDER_FORM2",
					"JiraNumber": "ITOTC-5310",
					"status": "saved"
				},
				{
					"TransportId": "TOID-30",
					"TransportNumber": "DEVK9A0T6X",
					"ObjectName": "Z_SD_PRICING_CALC3",
					"JiraNumber": "ITOTC-5778",
					"status": "saved"
				}
			]
};

export const getStepIcon = <T extends string>(
  completed: Record<T, boolean>,
  key: T,
  fallback: string
): string => (completed[key] ? "accept" : fallback);
