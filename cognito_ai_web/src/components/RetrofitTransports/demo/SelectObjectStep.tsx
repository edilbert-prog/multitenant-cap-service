import React, { useEffect, useState } from "react";
import { BusyIndicator, Title } from "@ui5/webcomponents-react";

type SelectObjectStepProps = {
  objects: any[];
  onSelect: (objects: any[]) => void;
  selectedObjects?: any[];
};

type TransportRow = Record<string, any>;

const columns: Array<{ key: string; label: string; width?: string }> = [
  { key: "JiraNumber", label: "JIRA No.", width: "10%" },
  { key: "ObjectName", label: "Object Name", width: "18%" },
  { key: "TransportId", label: "Transport ID", width: "10%" },
  { key: "TransportNumber", label: "Transport No.", width: "12%" },
  { key: "Module", label: "Module", width: "10%" },
  { key: "SubModule", label: "Sub Module", width: "12%" },
  { key: "ObjectType", label: "Object Type", width: "12%" },
  { key: "Description", label: "Description", width: "14%" }
];

const deriveRowId = (row: TransportRow): string | number | null => {
  if (!row || typeof row !== "object") return null;
  return (
    row.ObjectId ??
    row.TransportId ??
    row.id ??
    row.key ??
    row.Transport ??
    (row.ObjectName ? `${row.ObjectName}` : null)
  );
};

const formatCell = (row: TransportRow, key: string): React.ReactNode => {
  const value = row?.[key];
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

const SelectObjectStep: React.FC<SelectObjectStepProps> = ({ objects, onSelect, selectedObjects }) => {
  const [rows, setRows] = useState<TransportRow[]>(() => (Array.isArray(objects) ? objects : []));
  const loading = false;
  const [selectedRows, setSelectedRows] = useState<TransportRow[]>([]);

  useEffect(() => {
    setRows(Array.isArray(objects) ? objects : []);
  }, [objects]);

  useEffect(() => {
    if (!Array.isArray(selectedObjects)) return;
    setSelectedRows((prev) => {
      const prevIds = prev
        .map((item) => deriveRowId(item))
        .filter((id): id is string | number => id !== null)
        .join("|");
      const incomingIds = selectedObjects
        .map((item) => deriveRowId(item))
        .filter((id): id is string | number => id !== null)
        .join("|");
      if (prevIds === incomingIds) return prev;
      return selectedObjects;
    });
  }, [selectedObjects]);

  const handleRowSelection = (row: TransportRow) => {
    const rowId = deriveRowId(row);
    if (rowId === null) return;

    setSelectedRows((prev) => {
      const exists = prev.some((item) => deriveRowId(item) === rowId);
      if (exists) {
        const next = prev.filter((item) => deriveRowId(item) !== rowId);
        onSelect(next);
        return next;
      }

      const jiraNumber = row?.JiraNumber;
      if (!jiraNumber) {
        const next = [row];
        onSelect(next);
        return next;
      }

      const related = rows.filter(
        (item) => item?.JiraNumber === jiraNumber && deriveRowId(item) !== null
      );
      const uniqueById = related.reduce<TransportRow[]>((acc, item) => {
        const id = deriveRowId(item);
        if (id === null) return acc;
        if (acc.some((existing) => deriveRowId(existing) === id)) return acc;
        acc.push(item);
        return acc;
      }, []);
      onSelect(uniqueById);
      return uniqueById;
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%" }}>
      <Title level="H5">Select an Object</Title>
      <div
        style={{
          border: "1px solid #d1d5db",
          borderRadius: 8,
          overflow: "hidden",
          flex: 1,
          display: "flex",
          flexDirection: "column"
        }}
      >
        <div style={{ overflowY: "auto", flex: 1 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", height: "100%" }}>
            <thead>
              <tr style={{ background: "#f3f4f6", color: "#1f2933" }}>
                <th style={{ width: "40px", padding: "10px 12px", textAlign: "center" }} />
                {columns.map((col) => (
                  <th
                    key={col.key}
                    style={{
                      padding: "10px 12px",
                      fontWeight: 600,
                      fontSize: 13,
                      textAlign: "left",
                      width: col.width
                    }}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length + 1} style={{ padding: "24px 12px", textAlign: "center" }}>
                    <BusyIndicator active size="L" />
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    style={{ padding: "24px 12px", textAlign: "center", color: "#6a6d70", fontSize: 13 }}
                  >
                    No data available.
                  </td>
                </tr>
              ) : (
                rows.map((row, idx) => {
                  const rowId = deriveRowId(row) ?? idx;
                  const isSelected = selectedRows.some(
                    (item) => deriveRowId(item) === rowId
                  );
                  return (
                    <tr
                      key={rowId}
                      onClick={() => handleRowSelection(row)}
                      style={{
                        cursor: "pointer",
                        background: isSelected ? "rgba(10, 110, 209, 0.08)" : idx % 2 === 0 ? "#fff" : "#fafbfc",
                        transition: "background 0.15s ease-in-out"
                      }}
                    >
                      <td style={{ padding: "10px 12px", textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleRowSelection(row)}
                          onClick={(event) => event.stopPropagation()}
                        />
                      </td>
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          style={{
                            padding: "10px 12px",
                            borderTop: "1px solid #eef0f2",
                            fontSize: 13,
                            color: "#1f2933",
                            verticalAlign: "top"
                          }}
                        >
                          {formatCell(row, col.key)}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SelectObjectStep;
