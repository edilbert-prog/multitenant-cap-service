import type { CSSProperties } from "react";

type StyleRecord = Record<string, CSSProperties>;

export const layoutStyles: StyleRecord = {
  container: {
    display: "grid",
    gridTemplateRows: "auto 1fr auto",
    height: "calc(100vh - 64px)"
  },
  header: {
    padding: "8px 12px"
  },
  scrollContent: {
    display: "flex",
    flexDirection: "column",
    flex: "1 1 auto",
    overflow: "hidden",
    padding: "0 12px 12px"
  },
  footerBar: {
    position: "sticky",
    bottom: 0,
    zIndex: 1
  }
};

export const uploadStyles: StyleRecord = {
  dropArea: {
    border: "2px dashed #d1d5db",
    borderRadius: 8,
    padding: "24px 16px",
    background: "#ffffff",
    transition: "all 0.2s ease-in-out"
  },
  dropAreaActive: {
    border: "2px solid #0a6ed1",
    background: "rgba(10,110,209,0.08)"
  },
  fileName: {
    color: "#0a6ed1",
    fontWeight: 500
  },
  helperText: {
    color: "#6a6d70"
  },
  uploadActions: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12
  }
};
