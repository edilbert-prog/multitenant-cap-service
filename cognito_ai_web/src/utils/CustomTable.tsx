import React, { useEffect, useRef, useState } from "react";
// @ts-ignore
import Nodata from "../assets/Nodata.svg";
import CustomModal from "./CustomModal";

type RowId = string | number;

type Column = {
    key: string;
    title?: React.ReactNode;
    className?: string;
    headerClassName?: string;
};

type RowData = {
    selected?: boolean;
    actions?: React.ReactNode;
    [key: string]: unknown;
};

type RowDataWithFlags = RowData & {
    checkFlag?: boolean;
    isSelected?: boolean;
};

type CustomTableProps = {
    columns: ReadonlyArray<Column>;
    data: Array<RowData>;
    rowKey?: string;
    responsive?: boolean;
    enableSelection?: boolean;
    onSelectionChange?: (data:Record<any, any>,item:any) => void;
    showActions?: boolean;
    scrollFlag?: boolean;
    scrollHeightClass?: string;
    children?: React.ReactNode;
};

export default function CustomTable({
                                        columns,
                                        data,
                                        rowKey = "id",
                                        responsive = true,
                                        enableSelection = false,
                                        onSelectionChange = () => {},
                                        showActions = true,
                                        scrollFlag = false,
                                        scrollHeightClass = "h-[500px]",
                                    }: CustomTableProps) {
    const [selectedRowIds, setSelectedRowIds] = useState<ReadonlyArray<RowId>>(
        []
    );
    const [tableData, setTableData] = useState<ReadonlyArray<RowDataWithFlags>>(
        []
    );
    const selectAllRef = useRef<HTMLInputElement | null>(null);
    const [modalState, setModalState] = useState<{
        open: boolean;
        content: React.ReactNode | string;
        title: React.ReactNode | string;
    }>({
        open: false,
        content: "",
        title: "",
    });

    useEffect(() => {
        setSelectedRowIds([]);
        const initiallySelectedIds: RowId[] = data
            .filter((row) => row.selected === true)
            .map((row) => row[rowKey] as RowId);

        const initializedData: RowDataWithFlags[] = data.map((row) => ({
            ...row,
            checkFlag: initiallySelectedIds.includes(row[rowKey] as RowId),
    }));

        setSelectedRowIds(initiallySelectedIds);
        setTableData(initializedData);
    }, [data, rowKey]);

    useEffect(() => {
        if (!enableSelection) return;

        const allSelected =
            selectedRowIds.length === tableData.length && tableData.length > 0;
        const noneSelected = selectedRowIds.length === 0;

        if (selectAllRef.current) {
            selectAllRef.current.checked = allSelected;
            selectAllRef.current.indeterminate = !allSelected && !noneSelected;
        }

        const allDataWithSelection: RowDataWithFlags[] = tableData.map((row) => ({
            ...row,
            isSelected: selectedRowIds.includes(row[rowKey] as RowId),
    }));
        onSelectionChange(allDataWithSelection, null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedRowIds, tableData, enableSelection]);

    const toggleSelectRow = (rowId: RowId): void => {
        if (!enableSelection) return;

        const isSelected = selectedRowIds.includes(rowId);

        const newSelectedRowIds: RowId[] = isSelected
            ? selectedRowIds.filter((id) => id !== rowId)
            : [...selectedRowIds, rowId];

        const newTableData: RowDataWithFlags[] = tableData.map((row) =>
            (row[rowKey] as RowId) === rowId ? { ...row, checkFlag: !isSelected } : row
    );

        const currentItem = tableData.find((row) => (row[rowKey] as RowId) === rowId);
        const updatedCurrentItem: RowDataWithFlags | null = currentItem
            ? { ...currentItem, checkFlag: !isSelected }
            : null;

        setSelectedRowIds(newSelectedRowIds);
        setTableData(newTableData);

        const allDataWithSelection: RowDataWithFlags[] = newTableData.map((row) => ({
            ...row,
            isSelected: newSelectedRowIds.includes(row[rowKey] as RowId),
    }));
        onSelectionChange(allDataWithSelection, updatedCurrentItem);
    };

    const handleSelectAll = (): void => {
        if (!enableSelection) return;

        if (selectedRowIds.length === tableData.length) {
            setSelectedRowIds([]);
            setTableData(tableData.map((row) => ({ ...row, checkFlag: false })));
        } else {
            const allIds: RowId[] = tableData.map((row) => row[rowKey] as RowId);
            setSelectedRowIds(allIds);
            setTableData(tableData.map((row) => ({ ...row, checkFlag: true })));
        }

        const allDataWithSelection: RowDataWithFlags[] = tableData.map((row) => ({
            ...row,
            isSelected: selectedRowIds.length !== tableData.length,
        }));
        onSelectionChange(allDataWithSelection, null);
    };

    const colWidth: string | undefined = responsive
        ? `${Math.floor(100 / columns.length)}%`
        : undefined;

    return (
        <div className={`w-full ${!responsive ? "overflow-x-auto" : ""}`}>
            {scrollFlag ? (
                <div className={`overflow-y-auto ${scrollHeightClass}`}>
                    <table
                        className={`min-w-full text-left text-[0.80rem] border border-gray-200 ${
                            !responsive ? "table-auto" : ""
                        }`}
                    >
                        <thead className="bg-[#ebebeb] text-gray-700 font-medium sticky top-0 z-10">
                        <tr>
                            {enableSelection && (
                                <th className="px-4 py-2.5 text-center min-w-[40px]">
                                    <label className="custom-checkbox">
                                        <input
                                            type="checkbox"
                                            ref={selectAllRef}
                                            onChange={handleSelectAll}
                                            disabled={tableData.length === 0}
                                        />
                                        <span className="checkmark" />
                                    </label>
                                </th>
                            )}
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    className={`px-4 py-2.5 whitespace-nowrap ${
                                        col.headerClassName || col.className || ""
                                    }`}
                                    style={
                                        !col.headerClassName && responsive
                                            ? ({ width: colWidth } as React.CSSProperties)
                                        : {}
                                    }
                                >
                                    {col.title}
                                </th>
                            ))}
                            {showActions && (
                                <th className="px-4 py-2.5 whitespace-nowrap min-w-[40px]">
                                    Actions
                                </th>
                            )}
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200 text-gray-800">
                        {tableData.length > 0 ? (
                            tableData.map((row, index) => {
                                const isSelected =
                                    enableSelection &&
                                    selectedRowIds.includes(row[rowKey] as RowId);
                                return (
                                    <tr
                                        key={
                                            (row[rowKey] as RowId | undefined)?.toString() ?? index
                                        }
                                        className={`hover:bg-gray-50`}
                                    >
                                        {enableSelection && (
                                            <td className="px-4 py-2.5 text-center">
                                                <label className="custom-checkbox cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={!!isSelected}
                                                        onChange={() =>
                                                            toggleSelectRow(row[rowKey] as RowId)
                                                        }
                                                        onClick={(e: React.MouseEvent<HTMLInputElement>) =>
                                                            e.stopPropagation()
                                                        }
                                                    />
                                                    <span className="checkmark" />
                                                </label>
                                            </td>
                                        )}
                                        {columns.map((col) => {
                                            const cell = row[col.key] as unknown;
                                            return (
                                                <td
                                                    key={col.key}
                                                    className={`px-4 py-2.5 break-words ${
                                                        col.className || ""
                                                    }`}
                                                    style={
                                                        responsive
                                                            ? ({ width: colWidth } as React.CSSProperties)
                                                        : {}
                                                    }
                                                >
                                                    {typeof cell === "string" && cell.length > 200 ? (
                                                        <div>
                                                            {cell.slice(0, 85)}...
                                                            <button
                                                                onClick={() =>
                                                                    setModalState({
                                                                        open: true,
                                                                        content: cell,
                                                                        title: col.title || "Details",
                                                                    })
                                                                }
                                                                className="ml-1 cursor-pointer text-blue-600 hover:underline text-xs"
                                                            >
                                                                View More
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        (cell as React.ReactNode)
                                                        )}
                                                </td>
                                            );
                                        })}
                                        {showActions && (
                                            <td className="px-4 py-2.5 text-center">
                                                <div className="flex flex-nowrap justify-center gap-2">
                                                    {row.actions}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td
                                    colSpan={
                                        columns.length +
                                        (enableSelection ? 1 : 0) +
                                        (showActions ? 1 : 0)
                                    }
                                >
                                    <div className="py-12 w-full flex flex-col justify-center items-center">
                                        <img src={Nodata} alt="No Data" className="w-48" />
                                        <h3 className="text-lg font-semibold mt-6 text-gray-700">
                                            No data available
                                        </h3>
                                    </div>
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            ) : (
                <table
                    className={`min-w-full text-left text-[0.80rem] border border-gray-200 ${
                        !responsive ? "table-auto" : ""
                    }`}
                >
                    <thead className="bg-[#ebebeb] text-gray-700 font-medium">
                    <tr>
                        {enableSelection && (
                            <th className="px-4 py-2.5 text-center min-w-[40px]">
                                <label className="custom-checkbox">
                                    <input
                                        type="checkbox"
                                        ref={selectAllRef}
                                        onChange={handleSelectAll}
                                        disabled={tableData.length === 0}
                                    />
                                    <span className="checkmark" />
                                </label>
                            </th>
                        )}
                        {columns.map((col) => (
                            <th
                                key={col.key}
                                className={`px-4 py-2.5 whitespace-nowrap ${
                                    col.headerClassName || col.className || ""
                                }`}
                                style={
                                    !col.headerClassName && responsive
                                        ? ({ width: colWidth } as React.CSSProperties)
                                    : {}
                                }
                            >
                                {col.title}
                            </th>
                        ))}
                        {showActions && (
                            <th className="px-4 py-2.5 whitespace-nowrap min-w-[40px]">
                                Actions
                            </th>
                        )}
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 text-gray-800">
                    {tableData.length > 0 ? (
                        tableData.map((row, index) => {
                            const isSelected =
                                enableSelection &&
                                selectedRowIds.includes(row[rowKey] as RowId);
                            return (
                                <tr
                                    key={(row[rowKey] as RowId | undefined)?.toString() ?? index}
                                    className={`hover:bg-gray-50`}
                                >
                                    {enableSelection && (
                                        <td className="px-4 py-2.5 text-center">
                                            <label className="custom-checkbox">
                                                <input
                                                    type="checkbox"
                                                    checked={!!isSelected}
                                                    onChange={() =>
                                                        toggleSelectRow(row[rowKey] as RowId)
                                                    }
                                                    onClick={(e: React.MouseEvent<HTMLInputElement>) =>
                                                        e.stopPropagation()
                                                    }
                                                />
                                                <span className="checkmark" />
                                            </label>
                                        </td>
                                    )}
                                    {columns.map((col) => {
                                        const cell = row[col.key] as unknown;
                                        return (
                                            <td
                                                key={col.key}
                                                className={`px-4 py-2.5 break-words ${
                                                    col.className || ""
                                                }`}
                                                style={
                                                    responsive
                                                        ? ({ width: colWidth } as React.CSSProperties)
                                                    : {}
                                                }
                                            >
                                                {typeof cell === "string" && cell.length > 65 ? (
                                                    <div>
                                                        {cell.slice(0, 85)}...
                                                        <button
                                                            onClick={() =>
                                                                setModalState({
                                                                    open: true,
                                                                    content: cell,
                                                                    title: col.title || "Details",
                                                                })
                                                            }
                                                            className="ml-1 cursor-pointer text-blue-600 hover:underline text-xs"
                                                        >
                                                            View More
                                                        </button>
                                                    </div>
                                                ) : (
                                                    (cell as React.ReactNode)
                                                    )}
                                            </td>
                                        );
                                    })}
                                    {showActions && (
                                        <td className="px-4 py-2.5 text-center">
                                            <div className="flex flex-nowrap justify-center gap-2">
                                                {row.actions}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            );
                        })
                    ) : (
                        <tr>
                            <td
                                colSpan={
                                    columns.length +
                                    (enableSelection ? 1 : 0) +
                                    (showActions ? 1 : 0)
                                }
                            >
                                <div className="py-12 w-full flex flex-col justify-center items-center">
                                    <img src={Nodata} alt="No Data" className="w-48" />
                                    <h3 className="text-lg font-semibold mt-6 text-gray-700">
                                        No data available
                                    </h3>
                                </div>
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            )}

            <CustomModal
                width="max-w-3xl"
                isOpen={modalState.open}
                onClose={() => setModalState({ open: false, content: "", title: "" })}
                title={modalState.title}
                footerContent={[
                    <button
                        key="close"
                        onClick={() => setModalState({ open: false, content: "", title: "" })}
                        className="mt-2 px-5 py-2 bg-white text-blue-700 border border-blue-600 text-sm rounded-lg"
                    >
                        Close
                    </button>,
                ]}
            >
                <div className="space-y-5 h-full flex flex-col text-sm text-gray-700 whitespace-pre-wrap">
                    {modalState.content}
                </div>
            </CustomModal>
        </div>
    );
}
