import React, { useCallback, useRef, useState } from "react";
import {
  IllustratedMessage,
  FileUploader,
  Button,
  BusyIndicator
} from "@ui5/webcomponents-react";
import ButtonDesign from "@ui5/webcomponents/dist/types/ButtonDesign.js";
import { uploadStyles } from "./styles";

type UploadSourceStepProps = {
  file: File | null;
  onFileChange: (file: File | null) => void;
  uploading: boolean;
  error?: string | null;
  onClearError?: () => void;
  title?: string;
  description?: string;
};

const UploadSourceStep: React.FC<UploadSourceStepProps> = ({
  file,
  onFileChange,
  uploading,
  error,
  onClearError,
  title = "Upload Source File",
  description = "Drop the file anywhere in this area or use Browse to pick manually."
}) => {
  const uploaderRef = useRef<any>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelection = useCallback(
    (nextFile: File | undefined) => {
      if (!nextFile || uploading) return;
      onClearError?.();
      onFileChange(nextFile);
    },
    [onClearError, onFileChange, uploading]
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (uploading) return;
      setIsDragging(false);
      const dropped = event.dataTransfer?.files?.[0];
      void handleFileSelection(dropped);
    },
    [handleFileSelection, uploading]
  );

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (uploading) return;
    event.dataTransfer.dropEffect = "copy";
    if (!isDragging) setIsDragging(true);
  }, [isDragging, uploading]);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node) && !uploading) {
      setIsDragging(false);
    }
  }, [uploading]);

  const dropAreaStyle = isDragging
    ? { ...uploadStyles.dropArea, ...uploadStyles.dropAreaActive }
    : uploadStyles.dropArea;

  return (
    <div
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{ ...dropAreaStyle, height: "100%", display: "flex", alignItems: "center" }}
    >
      <IllustratedMessage
        name="UploadCollection"
        titleText={file ? "File ready" : title}
        subtitleText={description}
      >
        <div style={{ ...uploadStyles.uploadActions, height: "100%", justifyContent: "center" }}>
          <FileUploader
            ref={uploaderRef}
            multiple={false}
            disabled={uploading}
            accept="xlsx, xlx, csv"
            style={{ width: "450px" }}
            onChange={(e: any) => {
              const nextFile: File | undefined = e?.detail?.files?.[0] || e?.target?.files?.[0];
              void handleFileSelection(nextFile);
            }}
          >
            <Button design={ButtonDesign.Emphasized} icon="upload" disabled={uploading}>
              {uploading ? "Uploading..." : "Browse"}
            </Button>
          </FileUploader>
          {uploading ? <BusyIndicator active size="M" /> : null}
          {file ? (
            <span style={uploadStyles.fileName}>{file.name}</span>
          ) : (
            <></>
            // <span style={uploadStyles.helperText}>Supported format: SAP transport file</span>
          )}
          {error ? (
            <span style={{ color: "#b00", fontSize: 12 }}>{error}</span>
          ) : null}
        </div>
      </IllustratedMessage>
    </div>
  );
};

export default UploadSourceStep;
