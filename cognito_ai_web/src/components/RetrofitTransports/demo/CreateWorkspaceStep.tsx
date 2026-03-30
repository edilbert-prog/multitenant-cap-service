import React from "react";
import { IllustratedMessage, Input, TextArea } from "@ui5/webcomponents-react";
import "@ui5/webcomponents-fiori/dist/illustrations/tnt/Systems.js";

export type WorkspaceFormData = {
  name: string;
  module: string;
  subModule: string;
  repository: string;
  notes: string;
  isTestGenerated: boolean;
  WorkspaceId?: string;
};

type CreateWorkspaceStepProps = {
  workspace: WorkspaceFormData;
  onChange: (changes: Partial<WorkspaceFormData>) => void;
};

const fieldLabelStyle: React.CSSProperties = {
  fontSize: 13,
  color: "#475569",
  fontWeight: 600
};

const CreateWorkspaceStep: React.FC<CreateWorkspaceStepProps> = ({ workspace, onChange }) => {
  return (
    <div
      style={{
        height: "100%",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 24,
        alignItems: "center"
      }}
    >
      <div style={{ justifySelf: "center" }}>
        <IllustratedMessage
          name="TntSystems"
          design="Scene"
          titleText="Create Workspace"
          subtitleText="Capture workspace metadata and knowledge base link."
        />
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: 460,
          background: "#fff",
          border: "1px solid #d1d5db",
          borderRadius: 12,
          padding: "24px 28px",
          display: "flex",
          flexDirection: "column",
          gap: 20,
          boxShadow: "0 4px 18px rgba(15, 36, 84, 0.06)"
        }}
      >
        <h3 style={{ margin: 0, fontSize: 20, color: "#1f2933" }}>Workspace Details</h3>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={fieldLabelStyle}>Workspace Name</span>
            <Input
              required
              value={workspace.name}
              onInput={(e: any) => onChange({ name: e.target.value })}
              style={{ width: "100%" }}
              placeholder="Enter workspace name"
            />
          </div>

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 200, display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={fieldLabelStyle}>Module</span>
              <Input
                required
                value={workspace.module}
                onInput={(e: any) => onChange({ module: e.target.value })}
                style={{ width: "100%" }}
                placeholder="Enter module"
              />
            </div>
            <div style={{ flex: 1, minWidth: 200, display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={fieldLabelStyle}>Submodule</span>
              <Input
                value={workspace.subModule}
                onInput={(e: any) => onChange({ subModule: e.target.value })}
                style={{ width: "100%" }}
                placeholder="Enter submodule"
              />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={fieldLabelStyle}>Knowledge Base Link</span>
            <Input
              value={workspace.repository}
              onInput={(e: any) => onChange({ repository: e.target.value })}
              style={{ width: "100%" }}
              placeholder="SharePoint or repository URL"
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={fieldLabelStyle}>Notes</span>
            <TextArea
              rows={3}
              value={workspace.notes}
              onInput={(e: any) => onChange({ notes: e.target.value })}
              style={{ width: "100%" }}
              placeholder="Any additional information"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateWorkspaceStep;
