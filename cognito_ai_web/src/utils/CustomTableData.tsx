import React, { useMemo, useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import SpinnerV2 from "./SpinnerV2.jsx";

type Align = "left" | "center" | "right";
type SortDir = "asc" | "desc" | null;

interface Column {
    key: string;
    header: React.ReactNode;
    colWidth?: number | string;
    width?: number;
    align?: Align;
    sortable?: boolean;
    filterable?: boolean;
    TruncateData?: boolean;
    truncateAt?: number;
    sortKey?: string;
    filterKey?: string;
    truncateData?: boolean;
    colClassName?: string;
    shrink?: boolean;
    maxWidth?: number | string;
    variant?: string;
}

interface SortState {
    key: string | null;
    dir: SortDir;
}

interface ModalState {
    open: boolean;
    title: string;
    content: React.ReactNode;
}

type Row = Record<string, unknown>;

type Props = {
    data?: Row[];
    columns?: Column[];
    rowKey?: string;
    scrollHeightClass?: string;
    emptyState?: React.ReactNode;
    truncateCharLimit?: number;
    showSpinnerFlag?: boolean;
    spinnerLabel?: string;
    HorizontalScroll?: boolean;
};

type GetComparableOpts = { forFilter?: boolean };

const getColSizeStyle = (
        val: number | string | undefined,
    { shrink = false, maxWidth }: { shrink?: boolean; maxWidth?: number | string } = {}
): React.CSSProperties | undefined => {
    if (val == null) return undefined;
    if (typeof val === "number") {
        return {
            width: `${val}px`,
            ...(shrink ? {} : { minWidth: `${val}px` }),
            ...(maxWidth ? { maxWidth: typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth } : {}),
        };
    }
    return {
        width: val,
        ...(shrink ? {} : { minWidth: val }),
        ...(maxWidth ? { maxWidth: typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth } : {}),
    };
};

export default function CustomTableData({
                                            data = [],
                                            columns = [],
                                            rowKey = "id",
                                            scrollHeightClass = "",
                                            emptyState = <div className="p-8 text-center text-slate-500">No data.</div>,
                                            truncateCharLimit = 28,
                                            showSpinnerFlag = false,
                                            spinnerLabel = "Loading...",
                                            HorizontalScroll = false,
                                        }: Props) {
    const [sort, setSort] = useState<SortState>({ key: null, dir: null });
    const [filters, setFilters] = useState<Record<string, string>>({});
    const [modal, setModal] = useState<ModalState>({ open: false, title: "", content: "" });

    const theadRef = useRef<HTMLTableSectionElement | null>(null);
    const [theadHeight, setTheadHeight] = useState<number>(0);

    useEffect(() => {
        const update = () => {
            const h = theadRef.current?.getBoundingClientRect?.().height ?? 0;
            setTheadHeight(h);
        };
        update();
        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
    }, []);

    useEffect(() => {
        const h = theadRef.current?.getBoundingClientRect?.().height ?? 0;
        setTheadHeight(h);
    }, [columns, showSpinnerFlag]);

    const cols: Column[] = useMemo(
        () =>
            columns.map((c) => ({
                align: "left",
                ...c,
                TruncateData: c.TruncateData ?? c.truncateData ?? false,
                truncateAt: c.truncateAt ?? truncateCharLimit,
            })),
        [columns, truncateCharLimit]
    );

    const extractText = (node: unknown): string => {
        if (node == null || node === false) return "";
        if (typeof node === "string" || typeof node === "number") return String(node);
        if (Array.isArray(node)) return node.map(extractText).join(" ");
        if (React.isValidElement(node)) {
            // @ts-expect-error children typing can be varied
            return extractText(node.props?.children);
        }
        return "";
    };

    const getComparable = (row: Row, col: Column, { forFilter = false }: GetComparableOpts = {}): string => {
        const accessor = forFilter ? col.filterKey : col.sortKey;
        const raw = accessor ? deepGet(row, accessor) : deepGet(row, col.key);
        return extractText(raw);
    };

    const normalizeText = (s: unknown): string => String(s).replace(/\s+/g, " ").trim();

    const filtered: Row[] = useMemo(() => {
        if (!Object.keys(filters).length) return data;
        return data.filter((r) =>
            Object.entries(filters).every(([key, query]) => {
                if (!query) return true;
                const col = cols.find((c) => c.key === key);
                if (!col) return true;
                const value = getComparable(r, col, { forFilter: true });
                return normalizeText(value).toLowerCase().includes(String(query).toLowerCase());
            })
        );
    }, [data, filters, cols]);

    const sorted: Row[] = useMemo(() => {
        if (!sort.key || !sort.dir) return filtered;
        const col = cols.find((c) => c.key === sort.key);
        if (!col) return filtered;
        const dir = sort.dir === "asc" ? 1 : -1;

        return [...filtered].sort((a, b) => {
            const av = normalizeText(getComparable(a, col)).toLowerCase();
            const bv = normalizeText(getComparable(b, col)).toLowerCase();
            return av.localeCompare(bv, undefined, { numeric: true, sensitivity: "base" }) * dir;
        });
    }, [filtered, sort, cols]);

    const toggleSort = (key: string): void => {
        setSort((prev: SortState) => {
            if (prev.key !== key) return { key, dir: "asc" };
            if (prev.dir === "asc") return { key, dir: "desc" };
            return { key: null, dir: null };
        });
    };

    return (
        <div className={`w-full relative`} aria-busy={showSpinnerFlag}>
            <div>
                <div
                    className={[
                        "relative",
                        scrollHeightClass,
                        showSpinnerFlag ? "overflow-y-hidden" : "overflow-y-auto",
                        HorizontalScroll ? "overflow-x-auto" : "overflow-x-hidden",
                    ].join(" ")}
                >
                    <table className={[HorizontalScroll ? "min-w-max" : "min-w-full", "table-fixed"].join(" ")}>
                        <colgroup>
                            {cols.map((c) => (
                                <col
                                    key={c.key}
                                    className={c.colClassName}
                                    style={
                                        c.colClassName
                                            ? undefined
                                            : getColSizeStyle(c.colWidth ?? c.width, { shrink: c.shrink, maxWidth: c.maxWidth })
                                    }
                                />
                            ))}
                        </colgroup>
                        <thead ref={theadRef} className="">
                        <tr className="text-left text-sm">
                            {cols.map((c) => {
                                const sortableEnabled = !!c.sortable;
                                return (
                                    <th
                                        key={c.key}
                                        className={`sticky top-0 z-30 bg-[#F7F7F7] text-[#616161] px-4 py-2 font-semibold ${
                                            c.align === "center" ? "text-center" : c.align === "right" ? "text-right" : "text-left"
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                className={`inline-flex items-center gap-1 ${
                                                    sortableEnabled ? "cursor-pointer select-none" : "cursor-default"
                                                }`}
                                                onClick={sortableEnabled ? () => toggleSort(c.key) : undefined}
                                            >
                                                <span>{c.header}</span>
                                                {sortableEnabled && <SortIcon state={sort.key === c.key ? sort.dir : null} />}
                                            </button>
                                            {c.filterable && (
                                                <FilterPopover
                                                    value={filters[c.key] ?? ""}
                                                    onChange={(v: string) => setFilters((prev) => ({ ...prev, [c.key]: v }))}
                                                />
                                            )}
                                        </div>
                                    </th>
                                );
                            })}
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F1F1F1] text-sm">
                        {sorted.length === 0 ? (
                            <tr>
                                <td colSpan={cols.length}>{emptyState}</td>
                            </tr>
                        ) : (
                            sorted.map((row, i) => {
                                const isConfiguring = (row as any).isConfiguring
                                return (
                                <tr 
                                  key={(row[rowKey] as React.Key) ?? i} 
                                  className="hover:bg-[#FAFAFA]"
                                >
                                    {cols.map((c, cellIndex) => {
                                        const cell = deepGet(row, c.key);
                                        const primitive = typeof cell === "string" || typeof cell === "number" ? String(cell) : null;
                                        const shouldTruncate =
                                            !!c.TruncateData && !!primitive && primitive.length > (c.truncateAt ?? truncateCharLimit);
                                        const alignClass =
                                            c.align === "center" ? "text-center" : c.align === "right" ? "text-right" : "text-left";
                                        const isStatusBadge = c.variant === "badge" || c.key?.toLowerCase?.() === "status";

                                        // Add rounded corners to first and last cells when configuring
                                        const isFirstCell = cellIndex === 0
                                        const isLastCell = cellIndex === cols.length - 1
                                        const roundClass = isConfiguring 
                                          ? isFirstCell 
                                            ? 'rounded-l-lg' 
                                            : isLastCell 
                                              ? 'rounded-r-lg' 
                                              : ''
                                          : ''

                                        const isConfigRow = (row as any).isConfigRow
                                        
                                        return (
                                            <td 
                                              key={c.key} 
                                              colSpan={isConfigRow && cellIndex === 0 ? cols.length : undefined}
                                              className={`px-4 py-3 ${alignClass} font-medium text-[#616161] ${
                                                isConfiguring ? `bg-purple-50 ${roundClass}` : ''
                                              }`}
                                            >
                                                {isConfigRow && cellIndex === 0 ? (
                                                    // For configuration rows, render the cell content
                                                    <>{cell as React.ReactNode}</>
                                                ) : isConfigRow ? (
                                                    // Empty cell for other columns in config row
                                                    null
                                                ) : isStatusBadge && primitive ? (
                                                    <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                              {primitive}
                            </span>
                                                ) : shouldTruncate ? (
                                                    <div className="flex items-center gap-2">
                              <span className="truncate">
                                {primitive!.slice(0, c.truncateAt ?? truncateCharLimit)}…
                              </span>
                                                        <button
                                                            type="button"
                                                            className="text-blue-600 cursor-pointer text-nowrap text-xs underline underline-offset-2"
                                                            onClick={() =>
                                                                setModal({
                                                                    open: true,
                                                                    title: String(c.header ?? ""),
                                                                    content: primitive!,
                                                            })
                                                            }
                                                        >
                                                            View more
                                                        </button>
                                                    </div>
                                                ) : (
                                                    (cell as React.ReactNode) ?? "-"
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                                )
                            })
                        )}
                        </tbody>
                    </table>

                    {showSpinnerFlag && (
                        <div
                            className="absolute z-40 flex items-center justify-center bg-white"
                            style={{ top: theadHeight, left: 0, right: 0, bottom: 0 }}
                            role="presentation"
                        >
                            <SpinnerV2 label={spinnerLabel} />
                        </div>
                    )}
                </div>
            </div>

            <Modal
                open={modal.open}
                title={modal.title}
                onClose={() => setModal({ open: false, title: "", content: "" })}
            >
                <div className="max-h-[60vh] overflow-auto whitespace-pre-wrap break-words text-slate-700">
                    {modal.content}
                </div>
            </Modal>
        </div>
    );
}

/* ---------------- UI bits ---------------- */

type SortIconProps = { state: SortDir };
function SortIcon({ state }: SortIconProps) {
    return (
        <span className="inline-flex h-4 w-4 items-center justify-center">
      {state === "asc" ? (
          <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current opacity-80">
              <path d="M10 6l5 6H5l5-6z" transform="rotate(180 10 10)" />
          </svg>
      ) : state === "desc" ? (
          <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current opacity-80">
              <path d="M10 6l5 6H5l5-6z" />
          </svg>
      ) : (
          <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current opacity-40">
              <path d="M6 7h8l-4-4-4 4zm8 6H6l4 4 4-4z" />
          </svg>
      )}
    </span>
    );
}

type FilterPopoverProps = {
    value: string;
    onChange: (v: string) => void;
};

function FilterPopover({ value, onChange }: FilterPopoverProps) {
    const [open, setOpen] = useState<boolean>(false);
    const [coords, setCoords] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });
    const btnRef = useRef<HTMLButtonElement | null>(null);

    useEffect(() => {
        function onDoc(e: MouseEvent) {
            if (!open) return;
            const target = e.target as HTMLElement | null;
            if (btnRef.current && target && !btnRef.current.contains(target)) {
                const inPortal = target.closest?.("[data-popover='filter']");
                if (!inPortal) setOpen(false);
            }
        }

        function onEsc(e: KeyboardEvent) {
            if (e.key === "Escape") setOpen(false);
        }

        document.addEventListener("mousedown", onDoc);
        document.addEventListener("keydown", onEsc);
        return () => {
            document.removeEventListener("mousedown", onDoc);
            document.removeEventListener("keydown", onEsc);
        };
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const calc = () => {
            const r = btnRef.current?.getBoundingClientRect();
            if (!r) return;
            const dropdownWidthRem = 14; // Tailwind w-56 = 14rem
            const dropdownWidthPx =
                dropdownWidthRem * parseFloat(getComputedStyle(document.documentElement).fontSize || "16");
            // Center the dropdown relative to the button
            const left = Math.max(8, Math.min(window.innerWidth - dropdownWidthPx - 8, r.left + r.width / 2 - dropdownWidthPx / 2));
            const top = Math.min(window.innerHeight - 8, r.bottom + 8);
            setCoords({ top, left, width: dropdownWidthPx });
        };
        calc();
        window.addEventListener("resize", calc);
        window.addEventListener("scroll", calc, true);
        return () => {
            window.removeEventListener("resize", calc);
            window.removeEventListener("scroll", calc, true);
        };
    }, [open]);

    return (
        <>
            <button
                ref={btnRef}
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="rounded p-1 hover:bg-slate-100"
                title="Filter"
            >
                <svg viewBox="0 0 20 20" className="h-4 w-4 fill-slate-500">
                    <path d="M3 4h14l-5 6v5l-4 2v-7L3 4z" />
                </svg>
            </button>

            {open &&
                ReactDOM.createPortal(
                    <div
                        data-popover="filter"
                        className="z-[9999] fixed rounded-lg border border-slate-200 bg-white p-3 shadow-lg w-56"
                        style={{ top: coords.top, left: coords.left }}
                    >
                        <input
                            type="text"
                            value={value}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Type to filter…"
                        />
                        <div className="mt-2 text-right">
                            <button
                                className="text-sm text-slate-600 hover:text-slate-900"
                                onClick={() => onChange("")}
                                type="button"
                            >
                                Clear
                            </button>
                        </div>
                    </div>,
                    document.body
                )}
        </>
    );
}

type ModalProps = {
    open: boolean;
    title: React.ReactNode;
    children: React.ReactNode;
    onClose: () => void;
};

function Modal({ open, title, children, onClose }: ModalProps) {
    useEffect(() => {
        if (!open) return;
        const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        document.addEventListener("keydown", onEsc);
        return () => document.removeEventListener("keydown", onEsc);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-[#7126FF]/40" onClick={onClose} aria-hidden="true" />
            <div className="relative z-50 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
                <div className="mb-4 flex items-start justify-between gap-6">
                    <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                    <button
                        onClick={onClose}
                        className="rounded p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Close"
                        type="button"
                    >
                        <svg viewBox="0 0 20 20" className="h-5 w-5 fill-current">
                            <path d="M14.348 5.652a.5.5 0 0 0-.707 0L10 9.293 6.36 5.652a.5.5 0 1 0-.707.707L9.293 10l-3.64 3.64a.5.5 0 1 0 .707.707L10 10.707l3.64 3.64a.5.5 0 1 0 .707-.707L10.707 10l3.64-3.64a.5.5 0 0 0 0-.708z" />
                        </svg>
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

/* -------------------- utils -------------------- */

function deepGet(obj: unknown, path?: string | null): unknown {
    if (!path) return undefined;
    return String(path)
        .split(".")
        .reduce((acc, k) => (acc == null ? acc : acc[k]), obj as any);
}

function isFiniteNum(v: unknown): boolean {
    return v !== null && v !== "" && !Number.isNaN(Number(v));
}
