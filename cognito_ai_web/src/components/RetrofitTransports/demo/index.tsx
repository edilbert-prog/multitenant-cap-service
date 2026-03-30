import "@ui5/webcomponents-fiori/dist/illustrations/AddColumn.js";
import "@ui5/webcomponents-fiori/dist/illustrations/NoData.js";
import "@ui5/webcomponents-fiori/dist/illustrations/NoEntries.js";
import "@ui5/webcomponents-fiori/dist/illustrations/UploadCollection.js";

import ButtonDesign from "@ui5/webcomponents/dist/types/ButtonDesign.js";
import BarDesign from "@ui5/webcomponents/dist/types/BarDesign.js";
import "@ui5/webcomponents-icons/dist/accept.js";
import "@ui5/webcomponents-icons/dist/complete.js";
import "@ui5/webcomponents-icons/dist/document.js";
import "@ui5/webcomponents-icons/dist/list.js";
import "@ui5/webcomponents-icons/dist/upload.js";
import "@ui5/webcomponents-icons/dist/add.js";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./index.css";
import {
  Bar,
  Button,
  Title,
  Wizard,
  WizardStep
} from "@ui5/webcomponents-react";
import { useNavigate } from "react-router-dom";
import CreateWorkspaceStep, { WorkspaceFormData } from "./CreateWorkspaceStep";
import ReviewGenerateStep from "./ReviewGenerateStep";
import SelectObjectStep from "./SelectObjectStep";
import UploadSourceStep from "./UploadSourceStep";
import { createWorkspace, fetchWorkspaces, generateCasesRequest, getObjectsFromFile, getStepIcon, uploadSourceFile } from "./helpers";
import { layoutStyles } from "./styles";
declare global {
  interface Window {
    workspaceData?: WorkspaceFormData;
  }
}

type StepKey = "0" | "1" | "2" | "3" | "4" | "5";

const GeneratedWorkspaceView: React.FC = () => {
  return <div style={{ padding: 20 }}>Test Cases have been generated for this workspace.</div>;
  // return <ProjectSprintSessionTestCases />;
};

const DemoRetrofit: React.FC = () => {
  const navigate = useNavigate();
  const workspaceName = useRef<WorkspaceFormData>({
    name: "",
    module: "",
    subModule: "",
    repository: "",
    notes: "",
    isTestGenerated: false
  });

  const [selectedStep, setSelectedStep] = useState<StepKey>("0");
  const [completed, setCompleted] = useState<Record<StepKey, boolean>>({
    "0": false,
    "1": false,
    "2": false,
    "3": false,
    "4": false,
    "5": false
  });

  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [objects, setObjects] = useState<any[]>([]);
  const [selectedObjects, setSelectedObjects] = useState<any[]>([]);
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const [documentSummaries, setDocumentSummaries] = useState<any[]>([]);
  const [isUploadingSource, setIsUploadingSource] = useState(false);
  const [sourceUploadError, setSourceUploadError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [existingWorkspaces, setExistingWorkspaces] = useState<WorkspaceFormData[]>([]);
  const [selectedWorkspaceIndex, setSelectedWorkspaceIndex] = useState<string>("");
  const [isWorkspaceLoading, setIsWorkspaceLoading] = useState(false);
  const [workspaceLoadError, setWorkspaceLoadError] = useState<string | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceFormData>({
    name: workspaceName.current.name,
    module: workspaceName.current.module,
    subModule: workspaceName.current.subModule,
    repository: workspaceName.current.repository,
    notes: workspaceName.current.notes,
    isTestGenerated: workspaceName.current.isTestGenerated
  });

  const loadWorkspaces = useCallback(async () => {
    setIsWorkspaceLoading(true);
    setWorkspaceLoadError(null);
    try {
      const remoteRecords: any[] = await fetchWorkspaces();
      const sanitiseWorkspace = (record: any): WorkspaceFormData | null => {
        if (!record || typeof record !== "object") return null;

        const name = record.WorkspaceName || record.name || record.WorkspaceId;
        if (typeof name !== "string" || !name.trim()) return null;

        const isTestGenerated =
            typeof record.isTestGenerated === "boolean" ? record.isTestGenerated :
            typeof record.IsTestGenerated === "boolean" ? record.IsTestGenerated : false;

        return {
          name: name,
          module: record.Module ?? record.module ?? "",
          subModule: record.Submodule ?? record.subModule ?? "",
          repository: record.SharepointURL ?? record.repository ?? "",
          notes: record.Notes ?? record.notes ?? "",
          isTestGenerated: isTestGenerated,
          WorkspaceId: record.WorkspaceId, // Keep the ID for selection
        };
      };
      const mapped = remoteRecords.map(sanitiseWorkspace).filter((entry): entry is WorkspaceFormData => entry !== null);
      setExistingWorkspaces(mapped);
    } catch (err) {
      setWorkspaceLoadError(err instanceof Error ? err.message : "Failed to fetch workspaces");
    } finally {
      setIsWorkspaceLoading(false);
    }
  }, []);

  const canProceed = useMemo(() => {
    switch (selectedStep) {
      case "0":
        return workspace.name.trim().length > 0 && workspace.module.trim().length > 0;
      case "1":
        // return !!sourceFile;
        return true;
      case "2":
        return selectedObjects.length > 0;
      case "3":
        return true;
      case "4":
        return true;
      case "5":
        return true;
      default:
        return false;
    }
  }, [selectedStep, sourceFile, selectedObjects.length, documentFiles.length, workspace]);

  const updateCompletion = useCallback((key: StepKey, value = true) => {
    setCompleted((prev) => (prev[key] === value ? prev : { ...prev, [key]: value }));
  }, []);

  useEffect(() => {
    const hasBasics = workspace.name.trim().length > 0 && workspace.module.trim().length > 0;
    updateCompletion("0", hasBasics);
    if (typeof window !== "undefined") {
      window.workspaceData = workspace;
    }
  }, [workspace, updateCompletion]);

  useEffect(() => {
    void loadWorkspaces();
  }, [loadWorkspaces]);


  const handleStepChange = (e: any) => {
    const step = e.detail?.selectedStep?.dataset?.step as StepKey | undefined;
    if (step) setSelectedStep(step);
  };

  const handleSourceFileChange = (file: File | null) => {
    setSourceFile(file);
    setSourceUploadError(null);
  };

  const handleSourceUpload = useCallback(async (file: File) => {
    const fetchedObjects = await getObjectsFromFile(file);
    setObjects(fetchedObjects);
    return fetchedObjects;
  }, []);

  const handleSelectObject = useCallback((objectList: any[]) => {
    setSelectedObjects(objectList);
    updateCompletion("2", objectList.length > 0);
  }, [updateCompletion]);

  const handleDocumentFilesChange = useCallback((files: File[]) => {
    setDocumentFiles(files);
    if (files.length === 0) {
      setDocumentSummaries([]);
      updateCompletion("3", false);
    }
  }, [updateCompletion]);

  const applyWorkspaceSelection = useCallback(
    (data?: WorkspaceFormData, options?: { autoAdvance?: boolean }) => {
      const next: WorkspaceFormData = {
        name: typeof data?.name === "string" ? data.name : "",
        module: typeof data?.module === "string" ? data.module : "",
        subModule: typeof data?.subModule === "string" ? data.subModule : "",
        repository: typeof data?.repository === "string" ? data.repository : "",
        notes: typeof data?.notes === "string" ? data.notes : "",
        isTestGenerated: typeof data?.isTestGenerated === "boolean" ? data.isTestGenerated : false,
        WorkspaceId: data?.WorkspaceId
      };
      workspaceName.current = { ...next };
      setWorkspace(next);
      const hasBasics = next.name.trim().length > 0 && next.module.trim().length > 0;
      updateCompletion("0", hasBasics);
      if (options?.autoAdvance && hasBasics) {
        setSelectedStep("0");
      }
    },
    [updateCompletion]
  );

  const handleWorkspaceSelect = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const value = event.target.value;
      setSelectedWorkspaceIndex(value);

      if (!value) {
        applyWorkspaceSelection(undefined);
        setSelectedStep("0");
        return;
      }

      const parsedIndex = Number(value);
      if (Number.isNaN(parsedIndex) || parsedIndex < 0 || parsedIndex >= existingWorkspaces.length) {
        setSelectedWorkspaceIndex("");
        applyWorkspaceSelection(undefined);
        setSelectedStep("0");
        return;
      }

      const selected = existingWorkspaces[parsedIndex];
      if (!selected) {
        setSelectedWorkspaceIndex("");
        applyWorkspaceSelection(undefined);
        setSelectedStep("0");
        return;
      }

      applyWorkspaceSelection(selected, { autoAdvance: true });
    },
    [applyWorkspaceSelection, existingWorkspaces]
  );

  useEffect(() => {
    if (!selectedWorkspaceIndex) return;
    const parsedIndex = Number(selectedWorkspaceIndex);
    if (
      Number.isNaN(parsedIndex) ||
      parsedIndex < 0 ||
      parsedIndex >= existingWorkspaces.length
    ) {
      setSelectedWorkspaceIndex("");
      applyWorkspaceSelection(undefined);
      setSelectedStep("0");
      return;
    }
    const selected = existingWorkspaces[parsedIndex];
    if (!selected) {
      setSelectedWorkspaceIndex("");
      applyWorkspaceSelection(undefined);
      setSelectedStep("0");
      return;
    }
    applyWorkspaceSelection(selected, { autoAdvance: true });
  }, [applyWorkspaceSelection, existingWorkspaces, selectedWorkspaceIndex]);

  const handleWorkspaceChange = useCallback((changes: Partial<WorkspaceFormData>) => {
    workspaceName.current = { ...workspaceName.current, ...changes };
    setWorkspace((prev) => {
      const newWorkspace = { ...prev, ...changes };
      // When creating a new workspace, WorkspaceId should be undefined
      if (selectedWorkspaceIndex === "") newWorkspace.WorkspaceId = undefined;
      return newWorkspace;
    });
  }, []);

  const handleGenerateCases = useCallback(async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      const payload = {
        object: selectedObjects[0] ?? null,
        objects: selectedObjects,
        documents: documentSummaries.length ? documentSummaries : documentFiles,
        workspace
      };
      await generateCasesRequest(payload);
      updateCompletion("5");
      const search = window.location.search;
      const parsedSearch = search.substring(0, search.lastIndexOf("&"));
      navigate({ pathname: "/ProjectDetails", search: `${parsedSearch}&tab=ProjectDetails` });
    } catch (err) {
      console.error("Failed to generate cases", err);
    } finally {
      setIsGenerating(false);
    }
  }, [documentFiles, documentSummaries, isGenerating, navigate, selectedObjects, updateCompletion, workspace]);

  const handleRemoveReviewedDocument = useCallback(
    (index: number) => {
      if (documentSummaries.length) {
        setDocumentSummaries((prev) => {
          const next = prev.filter((_, idx) => idx !== index);
          updateCompletion("3", next.length > 0);
          return next;
        });
      } else {
        setDocumentFiles((prev) => {
          const next = prev.filter((_, idx) => idx !== index);
          updateCompletion("3", next.length > 0);
          return next;
        });
      }
    },
    [documentSummaries.length, updateCompletion]
  );

  const goNext = async () => {
    if (selectedStep === "0") {
      if (!(workspace.name.trim() && workspace.module.trim())) return;
      if (!selectedWorkspaceIndex) {
        const result = await createWorkspace(workspace);
        console.log("Created workspace:", result);
        await loadWorkspaces(); // Re-fetch workspaces after creation
      }
      updateCompletion("0", true);
      setSelectedStep("1");
      return;
    }

    if (selectedStep === "1") {
      if (!sourceFile || isUploadingSource) return;
      setIsUploadingSource(true);
      setSourceUploadError(null);
      try {
        await handleSourceUpload(sourceFile);
        setSelectedObjects([]);
        setDocumentFiles([]);
        setDocumentSummaries([]);
        setCompleted({
          "0": true,
          "1": true,
          "2": false,
          "3": false,
          "4": false,
          "5": false
        });
        setSelectedStep("2");
        return;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed";
        setSourceUploadError(message);
      } finally {
        setIsUploadingSource(false);
      }
      return;
    }

    if (!canProceed) return;

    if (selectedStep === "2") {
      updateCompletion("2");
      setSelectedStep("3");
      return;
    }
    if (selectedStep === "3") {
      updateCompletion("3");
      setSelectedStep("4");
      return;
    }
    if (selectedStep === "4") {
      updateCompletion("4");
      setSelectedStep("5");
      return;
    }
    if (selectedStep === "5") {
      if (isGenerating) return;
      await handleGenerateCases();
    }
  };

  const goPrev = () => {
    if (selectedStep === "1") setSelectedStep("0");
    else if (selectedStep === "2") setSelectedStep("1");
    else if (selectedStep === "3") setSelectedStep("2");
    else if (selectedStep === "4") setSelectedStep("3");
    else if (selectedStep === "5") setSelectedStep("4");
  };

  return (
    <div id="workspace-div" style={layoutStyles.container}>
      <div
        style={{
          ...layoutStyles.header,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12
        }}
      >
        <Title level="H4">
          {workspace.name.trim() ? workspace.name.trim() : "Create Workspace"}
        </Title>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 8,
            minWidth: 240,
            maxWidth: 320
          }}
        >
          <select
            id="workspace-select"
            value={selectedWorkspaceIndex}
            onChange={handleWorkspaceSelect}
            style={{
              width: "100%",
              padding: "6px 10px",
              borderRadius: 6,
              border: "1px solid #d1d5db",
              fontSize: 14,
              color: "#1f2933",
              backgroundColor: "#fff"
            }}
          >
            <option value="">Create New Workspace</option>
            {existingWorkspaces.map((entry, index) => (
              <option key={`${entry.name || "workspace"}-${index}`} value={String(index)}>
                {entry.name || `Workspace ${index + 1}`}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div style={layoutStyles.scrollContent}>
        {workspace.isTestGenerated ? (
          <GeneratedWorkspaceView />
        ) : (
          <Wizard
            onStepChange={handleStepChange}
            contentLayout="SingleStep"
            className="transport-wizard"
            style={{ height: "100%" }}
          >
            <WizardStep
              data-step="0"
              selected={selectedStep === "0"}
              titleText={selectedWorkspaceIndex ? "Workspace Details" : "Create Workspace"}
              icon={getStepIcon(completed, "0", "add")}
            >
              <CreateWorkspaceStep workspace={workspace} onChange={handleWorkspaceChange} />
            </WizardStep>

            <WizardStep
              data-step="1"
              selected={selectedStep === "1"}
              disabled={!completed["0"]}
              titleText="Upload Source File"
              icon={getStepIcon(completed, "1", "upload")}
            >
              <UploadSourceStep
                file={sourceFile}
                onFileChange={handleSourceFileChange}
                uploading={isUploadingSource}
                error={sourceUploadError}
                onClearError={() => setSourceUploadError(null)}
              />
            </WizardStep>

            <WizardStep
              data-step="2"
              selected={selectedStep === "2"}
              disabled={!completed["1"]}
              titleText="JIRA"
              icon={getStepIcon(completed, "2", "list")}
              style={{ height: "100%" }}
            >
              <SelectObjectStep
                objects={objects}
                onSelect={handleSelectObject}
                selectedObjects={selectedObjects}
              />
            </WizardStep>
            <WizardStep
              data-step="3"
              selected={selectedStep === "3"}
              disabled={!completed["2"]}
              titleText="Review & Generate Cases"
              icon={getStepIcon(completed, "3", "complete")}
            >
              <ReviewGenerateStep
                selectedObjects={selectedObjects}
                documents={documentSummaries.length ? documentSummaries : documentFiles}
                onGenerate={handleGenerateCases}
                onRemoveDocument={handleRemoveReviewedDocument}
                generating={isGenerating}
                workspace={workspace}
                WorkspaceId={workspace.WorkspaceId}
              />
            </WizardStep>
          </Wizard>
        )}
      </div>

      {!workspace.isTestGenerated && (
        <Bar
          design={BarDesign.Footer}
          style={layoutStyles.footerBar}
          startContent={
            <Button onClick={goPrev} disabled={selectedStep === "0"}>
              Previous
            </Button>
          }
          endContent={
          selectedStep !== "3" && ( <Button
              design={ButtonDesign.Emphasized}
              onClick={goNext}
              disabled={
                (selectedStep === "1" && (!sourceFile || isUploadingSource)) ||
                (selectedStep !== "1" && !canProceed) ||
                (selectedStep === "3" && isGenerating)
              }
            >
              {selectedStep == "3"
                ? isGenerating
                  ? "Generating..."
                  : "Generate Test Case"
                : selectedStep === "1" && isUploadingSource
                ? "Uploading..."
                : "Next"}
            </Button>
         )}
        />
      )}
    </div>
  );
};
    
export default DemoRetrofit;
