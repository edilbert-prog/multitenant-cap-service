import React, { useMemo, useRef, useState } from "react";
import {
  BusyIndicator,
  Button,
  IllustratedMessage,
  Title
} from "@ui5/webcomponents-react";
import ButtonDesign from "@ui5/webcomponents/dist/types/ButtonDesign.js";
import "@ui5/webcomponents-icons/dist/delete.js";
import "@ui5/webcomponents-icons/dist/add-document.js";
import { EccTestCase, S4ConfigChange } from "./ChangeExtractionStep";

// ⬇️ adjust this path to where you placed the provided FileUpload component
import FileUpload from "@/utils/FileUpload";
import { apiRequest } from "@/utils/helpers/ApiHelper";
import WorkSpaceScenarioDocs from "@/components/TestDesignStudio/ProjectSprintDocs/WorkSpaceScenarioDocs";

const MAX_PREVIEW_ROWS = 6;

const cardStyle: React.CSSProperties = {
  border: "1px solid #d1d5db",
  borderRadius: 10,
  padding: 16,
  display: "flex",
  flexDirection: "column",
  gap: 12,
  background: "#fff",
  minHeight: 0
};

const tableStyles: React.CSSProperties = { width: "100%", borderCollapse: "collapse" };

const headCellStyle: React.CSSProperties = {
  padding: "10px 12px",
  textAlign: "left",
  background: "#f3f4f6",
  color: "#1f2933",
  fontWeight: 600,
  fontSize: 13,
  borderBottom: "1px solid #e5e7eb"
};

const bodyCellStyle: React.CSSProperties = {
  padding: "9px 12px",
  fontSize: 13,
  color: "#1f2933",
  borderBottom: "1px solid #eef0f2",
  verticalAlign: "top"
};

const mutedTextStyle: React.CSSProperties = { fontSize: 12, color: "#6a6d70" };

const countBadgeStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: "#0a6ed1",
  background: "#e1effe",
  borderRadius: 999,
  padding: "4px 10px"
};

const tableScrollArea: React.CSSProperties = {
  flex: 1,
  overflowY: "auto",
  border: "1px solid #eef0f2",
  borderRadius: 8,
  background: "#fafbfc"
};

const slicePreviewRows = <T,>(rows: T[]) => {
  const total = rows.length;
  const preview = rows.slice(0, MAX_PREVIEW_ROWS);
  return { preview, total, truncated: total > preview.length };
};

const formatSummary = (value: any, fallback = "—", max = 48): string => {
  if (value === null || value === undefined) return fallback;
  const str = typeof value === "string" ? value.trim() : String(value);
  if (!str) return fallback;
  if (str.length <= max) return str;
  return `${str.slice(0, Math.max(0, max - 3))}...`;
};

const formatBytes = (value?: number | string | null): string => {
  if (value === null || value === undefined) return "—";
  const num = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(num) || typeof num !== "number" || num <= 0) return "—";
  if (num < 1024) return `${num} B`;
  const kb = num / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(2)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(2)} GB`;
};

const deriveDocumentName = (doc: any, index: number): string => {
  if (doc instanceof File) return doc.name;
  return (
    doc?.name ||
    doc?.filename ||
    doc?.title ||
    doc?.DocumentName ||
    doc?.FileName ||
    `Document ${index + 1}`
  );
};

const deriveDocumentType = (doc: any): string => {
  if (doc instanceof File) return doc.type || "Upload";
  return (
    doc?.type ||
    doc?.mimeType ||
    doc?.FileType ||
    doc?.extension ||
    doc?.Source ||
    "Document"
  );
};

const deriveDocumentSize = (doc: any): string => {
  if (doc instanceof File) return formatBytes(doc.size);
  if (typeof doc?.size === "number") return formatBytes(doc.size);
  if (typeof doc?.Size === "number") return formatBytes(doc.Size);
  return "—";
};

// ------- types for incoming data (same as your original ReviewGenerateStep) -------
type ReviewGenerateStepProps = {
  selectedObjects: any[];
  documents: any[];
  eccTestCases?: EccTestCase[];
  s4Changes?: S4ConfigChange[];
  onGenerate: () => Promise<void>;
  onRemoveDocument?: (index: number) => void;
  generating?: boolean;
  workspace?: {
    name: string;
    module: string;
    subModule: string;
    repository: string;
    notes?: string;
  };
};

// optional: if you ever want to hydrate BusinessProcesses internally, use this guard
function filterSelectedOrIndeterminate(processes: any[] = []): any[] {
  return (processes || [])
    .map((process: any) => {
      const filteredSubProcesses = filterSelectedOrIndeterminate(process.SubProcesses || []);
      const isSelected = process.selected || process.indeterminate || filteredSubProcesses.length > 0;
      if (!isSelected) return null;
      return { ...process, SubProcesses: filteredSubProcesses };
    })
    .filter(Boolean);
}

// allow TS to know our FileUpload methods
type FileUploadRefHandle = {
  upload: (meta?: Record<string, string | Blob>) => Promise<void>;
  resetFile: () => void;
};

const ReviewGenerateStep: React.FC<ReviewGenerateStepProps> = ({
  selectedObjects,
  documents,
  eccTestCases,
  s4Changes,
  onGenerate: _onGenerate,
  onRemoveDocument,
  generating,
  workspace
}) => {
  const [showScenarioDocs, setShowScenarioDocs] = useState(false);
  // ===== derive ids from URL like your reference code =====
  const searchParams = new URLSearchParams(location.search);
  const ClientIdFromUrl = searchParams.get("CLId") || "";
  const BusinessUnitIdName = searchParams.get("BUNM") || "";
  const BusinessUnitId = searchParams.get("BUID") || "";
  const sprintIdFromUrl = searchParams.get("SPRID") || "";
  const ProjectIdFromUrl = searchParams.get("PJID") || "";

  // ===== local state to fully handle upload context internally =====
  const [selectedActionType, setSelectedActionType] = useState<string>("");
  const [additionalPrompt, setAdditionalPrompt] = useState<string>("");
  const [sessionId, setSessionId] = useState<string>(""); // you can set/auto-create elsewhere, but kept local here
  const [bpData, setBpData] = useState<any>({ BusinessProcesses: [] }); // optional internal BP tree holder

  // preview data
  const objectRows = useMemo(() => (Array.isArray(selectedObjects) ? selectedObjects : []), [selectedObjects]);
  const documentsWithIndex = useMemo(
    () => (Array.isArray(documents) ? documents : []).map((doc, index) => ({ doc, index })),
    [documents]
  );
  const eccRows = useMemo(() => (Array.isArray(eccTestCases) ? eccTestCases : []), [eccTestCases]);
  const s4Rows = useMemo(() => (Array.isArray(s4Changes) ? s4Changes : []), [s4Changes]);

  const objectPreview = useMemo(() => slicePreviewRows(objectRows), [objectRows]);
  const documentPreview = useMemo(() => {
    const total = documentsWithIndex.length;
    const preview = documentsWithIndex.slice(0, MAX_PREVIEW_ROWS);
    return { preview, total, truncated: total > preview.length };
  }, [documentsWithIndex]);
  const eccPreview = useMemo(() => slicePreviewRows(eccRows), [eccRows]);
  const s4Preview = useMemo(() => slicePreviewRows(s4Rows), [s4Rows]);

  const showDocumentActions = typeof onRemoveDocument === "function";

  // ===== FileUpload config (internal) =====
  const uploadAccept = ".docx,.txt,.png,.jpg,.jpeg,.pdf,.xlsx,.csv";
  const uploadRef = useRef<FileUploadRefHandle | null>(null);

  // ===== EXACT triggerUpload you asked to use (no parent props) =====
  const triggerUpload = async(
    SessionId: string,
  ): void => {
    if (uploadRef.current) {

      const CurrAddEditObj: any = {
        ClientId: ClientIdFromUrl,
        ProjectId: ProjectIdFromUrl,
        SprintId: sprintIdFromUrl,
      };
      let SourceType = "Document";
      let StatusInfo = "Reading Document";
      CurrAddEditObj.SessionStatus = "Starting";
      CurrAddEditObj.StatusInfo = StatusInfo;
      // const resp: any = await apiRequest("/AddProjectSprintSessionDocumentTestCasesV2", CurrAddEditObj);
      const resp: any = await apiRequest("/project-sprint-session-docs/AddUpdateProjectSprintSession", CurrAddEditObj);
      if (resp) {
        const newSessionId: string = resp.addProjectSprintSessionDocs.insertId;
        console.log("workspaceworkspaceworkspace", workspace);

        const metData: Record<string, unknown> = {
          ExistingRecordConfirm: false,
          ExistingDocumentDetails: {},
          ActionType: "",
          WorkspaceId: workspace?.WorkspaceId,
          InputFilePath: "",
          SourceType: "Document",
          ObjectInfo:selectedObjects,
          ImpactWorkspaceId: workspace?.WorkspaceId,
          FileInfo: [{
            FileName: "",
            Descripton: "",
          }],
          MarkdownFilePath: "",
          SessionId:newSessionId,
          BusinessProcesses: JSON.stringify([]),
          ClientId: ClientIdFromUrl,
          ProjectId: ProjectIdFromUrl,
          SprintId: sprintIdFromUrl,
          DocumentId: "",
          BusinessUnitId: BusinessUnitId,
          BusinessUnitName: BusinessUnitIdName,
          AdditionalPrompt: additionalPrompt,
        };
        // eslint-disable-next-line no-console
        console.log("metDatametDatametDatametDatametData", metData);
        uploadRef.current.upload(metData as Record<string, string | Blob>).catch(() => {
          // swallow here; UI feedback is handled in FileUpload list (error state)
        });
      }
    }
  };

  const clearSelectedFiles = () => uploadRef.current?.resetFile();

  if (showScenarioDocs) {
    return (
        <div style={{ height: "100%", display: "flex", flexDirection: "column", gap: 16 }}>
            <Button
                icon="nav-back"
                onClick={() => setShowScenarioDocs(false)}
                style={{ alignSelf: "flex-start" }}
            >
                Back to Review
            </Button>
            <WorkSpaceScenarioDocs CurrentSprint={workspace} />
        </div>
    );
  }

  return (
    <div style={{ position: "relative", height: "100%" }}>
      {generating ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(255,255,255,0.68)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 5,
            backdropFilter: "blur(2px)"
          }}
        >
          <BusyIndicator active size="L" />
        </div>
      ) : null}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          height: "100%",
          opacity: generating ? 0.5 : 1,
          minHeight: 0
        }}
      >
        {/* Optional workspace header */}
        {workspace ? (
          <section
            style={{
              ...cardStyle,
            }}
           className="flex "

          >
            <div className="flex justify-between items-center">
  <div className="flex flex-col gap-2">
              <Title level="H5" style={{ margin: 0 }}>Workspace Summary</Title>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16, fontSize: 13, color: "#1f2933" }}>
              <div><strong>Name:</strong> {workspace.name || "—"}</div>
              <div><strong>Module:</strong> {workspace.module || "—"}</div>
              <div><strong>Submodule:</strong> {workspace.subModule || "—"}</div>
              {workspace.notes ? <div><strong>Notes:</strong> {formatSummary(workspace.notes, "—", 80)}</div> : null}
            </div>
            </div>

            <a onClick={()=> setShowScenarioDocs(true)} className="text-blue-700 underline cursor-pointer ">View Test Cases</a>

            </div>
          
            
          </section>
        ) : null}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gridAutoRows: "minmax(0, 1fr)",
            gap: 20,
            flex: 1,
            minHeight: 0
          }}
        >
          {/* Selected Objects */}
          <section style={{ ...cardStyle, minHeight: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Title level="H5" style={{ margin: 0 }}>Selected Objects</Title>
              <span style={countBadgeStyle}>{objectPreview.total}</span>
            </div>
            <div style={tableScrollArea}>
              {objectPreview.total === 0 ? (
                <div style={{ padding: "24px 12px" }}>
                  <IllustratedMessage
                    name="NoEntries"
                    titleText="No objects selected"
                    subtitleText="Choose objects in the previous step."
                  />
                </div>
              ) : (
                <table style={tableStyles}>
                  <thead>
                    <tr>
                      <th style={headCellStyle}>Object</th>
                      <th style={headCellStyle}>Transport No.</th>
                      <th style={headCellStyle}>Transport ID</th>
                      <th style={headCellStyle}>JIRA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {objectPreview.preview.map((obj, idx) => (
                      <tr key={`${obj?.ObjectId ?? obj?.ObjectName ?? idx}`} style={{ background: idx % 2 === 0 ? "#fff" : "#f8fafc" }}>
                        <td style={bodyCellStyle}>{formatSummary(obj?.ObjectName)}</td>
                        <td style={bodyCellStyle}>{formatSummary(obj?.TransportNumber)}</td>
                        <td style={bodyCellStyle}>{formatSummary(obj?.TransportId)}</td>
                        <td style={bodyCellStyle}>{formatSummary(obj?.JiraNumber)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            {objectPreview.truncated ? (
              <span style={mutedTextStyle}>
                Showing first {objectPreview.preview.length} of {objectPreview.total} objects.
              </span>
            ) : null}
          </section>

          {/* Documents + Multi-file Upload (handled internally) */}
          <section style={{ ...cardStyle, minHeight: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Title level="H5" style={{ margin: 0 }}>Documents</Title>
              <span style={countBadgeStyle}>{documentPreview.total}</span>
            </div>

            <div style={{ ...tableScrollArea, borderStyle: documentPreview.total ? "solid" : "dashed" }}>
              {/* {documentPreview.total === 0 ? (
                <div style={{ padding: "24px 12px" }}>
                  <IllustratedMessage
                    name="UploadCollection"
                    titleText="No documents attached"
                    subtitleText="Use the uploader below to add documents."
                  />
                </div>
              ) : (
                <table style={tableStyles}>
                  <thead>
                    <tr>
                      <th style={headCellStyle}>Name</th>
                      <th style={headCellStyle}>Type</th>
                      <th style={headCellStyle}>Size</th>
                      {showDocumentActions ? <th style={{ ...headCellStyle, width: 60, textAlign: "center" }}>Action</th> : null}
                    </tr>
                  </thead>
                  <tbody>
                    {documentPreview.preview.map(({ doc, index }, idx) => (
                      <tr key={`${deriveDocumentName(doc, index)}-${index}`} style={{ background: idx % 2 === 0 ? "#fff" : "#f8fafc" }}>
                        <td style={bodyCellStyle}>{formatSummary(deriveDocumentName(doc, index), "—", 64)}</td>
                        <td style={bodyCellStyle}>{formatSummary(deriveDocumentType(doc), "—", 32)}</td>
                        <td style={bodyCellStyle}>{deriveDocumentSize(doc)}</td>
                        {showDocumentActions ? (
                          <td style={{ ...bodyCellStyle, textAlign: "center" }}>
                            <Button
                              design={ButtonDesign.Transparent}
                              icon="delete"
                              onClick={() => onRemoveDocument?.(index)}
                              disabled={generating}
                            />
                          </td>
                        ) : null}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )} */}
            </div>

            {documentPreview.truncated ? (
              <span style={mutedTextStyle}>
                Showing first {documentPreview.preview.length} of {documentPreview.total} documents.
              </span>
            ) : null}

            {/* Internal controls for upload context */}
            <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
              {/* <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <label style={{ fontSize: 13, color: "#1f2937" }}>
                  <div style={{ marginBottom: 4, fontWeight: 600 }}>Action Type <span style={{ color: "#dc2626" }}>*</span></div>
                  <select
                    value={selectedActionType}
                    onChange={(e) => setSelectedActionType(e.target.value)}
                    style={{ width: "100%", padding: 8, border: "1px solid #d1d5db", borderRadius: 8 }}
                  >
                    <option value="">Select action</option>
                    <option value="TestScenarios">Test Scenarios</option>
                    <option value="DocumentSummary">Document Summary</option>
                    <option value="TestCases">Test Cases</option>
                  </select>
                </label>

                <label style={{ fontSize: 13, color: "#1f2937" }}>
                  <div style={{ marginBottom: 4, fontWeight: 600 }}>Session Id (optional)</div>
                  <input
                    value={sessionId}
                    onChange={(e) => setSessionId(e.target.value)}
                    placeholder="e.g. 12345"
                    style={{ width: "100%", padding: 8, border: "1px solid #d1d5db", borderRadius: 8 }}
                  />
                </label>
              </div> */}

              <label style={{ fontSize: 13, color: "#1f2937" }}>
                <div style={{ marginBottom: 4, fontWeight: 600 }}>Additional Prompt (optional)</div>
                <textarea
                  value={additionalPrompt}
                  onChange={(e) => setAdditionalPrompt(e.target.value)}
                  rows={3}
                  placeholder="Add any guidance to the generator…"
                  style={{ width: "100%", padding: 8, border: "1px solid #d1d5db", borderRadius: 8, resize: "vertical" }}
                />
              </label>
            </div>

            {/* Uploader controls + FileUpload */}
            <div style={{ marginTop: 12 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ ...mutedTextStyle, color: "#1f2933" }}>Upload new documents</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <Button
                    design={ButtonDesign.Emphasized}
                    icon="add-document"
                    onClick={() => {
                      triggerUpload({}, bpData, sessionId, "Document");
                    }}
                    disabled={generating}
                  >
                    Generate Test Cases
                  </Button>
                  <Button design={ButtonDesign.Transparent} onClick={clearSelectedFiles} disabled={generating}>
                    Clear
                  </Button>
                </div>
              </div>

              <FileUpload
                ref={uploadRef as any}
                url={'/cognito/api/llm/GenerateTestCasesByDocument'}
                accept={uploadAccept}
                multi
                onFileSelect={(_names: string[] | string) => void 0}
                onSuccess={(_ok: boolean) => {
                  if (_ok) setShowScenarioDocs(true);
                }}
              />
            </div>
          </section>

          {/* ECC Test Cases */}
          {/* <section style={{ ...cardStyle, minHeight: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Title level="H5" style={{ margin: 0 }}>ECC Test Cases</Title>
              <span style={countBadgeStyle}>{eccPreview.total}</span>
            </div>
            <div style={tableScrollArea}>
              {eccPreview.total === 0 ? (
                <div style={{ padding: "24px 12px" }}>
                  <IllustratedMessage
                    name="NoData"
                    titleText="No ECC test cases"
                    subtitleText="Link ECC test cases in the previous steps."
                  />
                </div>
              ) : (
                <table style={tableStyles}>
                  <thead>
                    <tr>
                      <th style={headCellStyle}>Test Case</th>
                      <th style={headCellStyle}>Description</th>
                      <th style={headCellStyle}>Module</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eccPreview.preview.map((row, idx) => (
                      <tr key={`${row.testCaseId}-${idx}`} style={{ background: idx % 2 === 0 ? "#fff" : "#f8fafc" }}>
                        <td style={bodyCellStyle}>{formatSummary(row.testCaseId)}</td>
                        <td style={bodyCellStyle}>{formatSummary(row.description, "—", 64)}</td>
                        <td style={bodyCellStyle}>{formatSummary(row.module)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            {eccPreview.truncated ? (
              <span style={mutedTextStyle}>
                Showing first {eccPreview.preview.length} of {eccPreview.total} ECC test cases.
              </span>
            ) : null}
          </section>

          <section style={{ ...cardStyle, minHeight: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Title level="H5" style={{ margin: 0 }}>S/4 Config & Dev Changes</Title>
              <span style={countBadgeStyle}>{s4Preview.total}</span>
            </div>
            <div style={tableScrollArea}>
              {s4Preview.total === 0 ? (
                <div style={{ padding: "24px 12px" }}>
                  <IllustratedMessage
                    name="NoEntries"
                    titleText="No S/4 changes"
                    subtitleText="Record S/4 configuration or development changes before review."
                  />
                </div>
              ) : (
                <table style={tableStyles}>
                  <thead>
                    <tr>
                      <th style={headCellStyle}>Change ID</th>
                      <th style={headCellStyle}>Object</th>
                      <th style={headCellStyle}>Transport</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s4Preview.preview.map((row, idx) => (
                      <tr key={`${row.changeId}-${idx}`} style={{ background: idx % 2 === 0 ? "#fff" : "#f8fafc" }}>
                        <td style={bodyCellStyle}>{formatSummary(row.changeId)}</td>
                        <td style={bodyCellStyle}>{formatSummary(row.objectName ?? row.objectType, "—", 48)}</td>
                        <td style={bodyCellStyle}>{formatSummary(row.transportId)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            {s4Preview.truncated ? (
              <span style={mutedTextStyle}>
                Showing first {s4Preview.preview.length} of {s4Preview.total} S/4 entries.
              </span>
            ) : null}
          </section> */}
        </div>
      </div>
    </div>
  );
};

export default ReviewGenerateStep;
