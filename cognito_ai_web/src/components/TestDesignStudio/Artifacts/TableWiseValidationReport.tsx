import React, { useState, useEffect } from 'react';

interface TableWiseReportProps {
    data: any;
}

interface DrilldownData {
    field: any;
    tableName: string;
    tableDesc: string;
    sourceInfo: string;
    sourceField: string;
    targetInfo: string;
    targetField: string;
}

const formatValue = (value: any): string => {
    if (value === null || value === undefined || value === '') return '-';
    if (typeof value === 'number') return value.toLocaleString();
    return String(value);
};

const formatDateTime = (dateStr: string | undefined): string => {
    if (!dateStr) return '-';
    try {
        const date = new Date(dateStr);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    } catch {
        return dateStr;
    }
};

const TableWiseValidationReport: React.FC<TableWiseReportProps> = ({ data }) => {
    const [filter, setFilter] = useState<'all' | 'pass' | 'fail'>('all');
    const [drilldownPanel, setDrilldownPanel] = useState<DrilldownData | null>(null);

    // Reset on data change
    useEffect(() => {
        setFilter('all');
        setDrilldownPanel(null);
    }, [data]);

    const filterResults = (filterType: 'all' | 'pass' | 'fail') => {
        setFilter(filterType);
    };

    if (!data) return null;

    const header = data.header || {};
    const tableWiseData = data.table_wise_data || [];
    const fieldSummary = data.field_summary?.rows || [];
    const ruleWiseSummary = data.rule_wise_summary?.rows || [];

    // Summary stats from rule_wise_summary
    let totalCount = 0;
    let passedCount = 0;
    let failedCount = 0;

    ruleWiseSummary.forEach((rule: any) => {
        totalCount++;
        if (rule.overall_status === 'PASS') passedCount++;
        else if (rule.overall_status === 'FAIL') failedCount++;
    });

    const hasFailed = fieldSummary.some((row: any) => row['Overall Status'] === 'Failed');
    const overallResult = hasFailed ? 'fail' : 'pass';

    const parseSourceVsTarget = (svt: string, tableName: string, targetTables: string) => {
        if (!svt || !svt.includes('_vs_')) {
            return { sourceInfo: tableName, targetInfo: targetTables || '-', sourceField: '', targetField: '' };
        }

        const parts = svt.split('_vs_');
        let sourceInfo = tableName;
        let targetInfo = targetTables || '-';
        let sourceField = '';
        let targetField = '';

        if (parts[0].includes('.')) {
            const sourceParts = parts[0].split('.');
            sourceInfo = sourceParts[0];
            sourceField = sourceParts[1];
        } else {
            sourceField = parts[0];
        }

        if (parts[1].includes('.')) {
            const targetParts = parts[1].split('.');
            targetInfo = targetParts[0];
            targetField = targetParts[1];
        } else if (parts[1] === 'CONSTANT') {
            targetInfo = 'CONSTANT';
            targetField = 'Fixed Value';
        } else {
            targetField = parts[1];
        }

        return { sourceInfo, targetInfo, sourceField, targetField };
    };

    const openDrilldown = (field: any, tableData: any) => {
        const svt = field.source_vs_target || '';
        const parsed = parseSourceVsTarget(svt, tableData.table_name, tableData.target_tables);

        setDrilldownPanel({
            field,
            tableName: tableData.table_name,
            tableDesc: tableData.table_description,
            sourceInfo: parsed.sourceInfo,
            sourceField: parsed.sourceField,
            targetInfo: parsed.targetInfo,
            targetField: parsed.targetField,
        });
    };

    const getVisibleRuleIds = (): Set<string> => {
        if (filter === 'all') {
            return new Set(ruleWiseSummary.map((rule: any) => rule.rule_id));
        }
        return new Set(
            ruleWiseSummary
                .filter((rule: any) => (filter === 'pass' ? rule.overall_status === 'PASS' : rule.overall_status === 'FAIL'))
                .map((rule: any) => rule.rule_id),
        );
    };

    const visibleRuleIds = getVisibleRuleIds();

    const shouldShowTable = (tableData: any): boolean => {
        if (filter === 'all') return true;
        const fields = tableData.fields || [];
        return fields.some((field: any) => visibleRuleIds.has(field.rule_name || ''));
    };

    const shouldShowRow = (field: any): boolean => {
        if (filter === 'all') return true;
        return visibleRuleIds.has(field.rule_name || '');
    };

    return (
        <div className="w-full h-full flex flex-col overflow-hidden">
            {/* Header with Filter Buttons */}
            <div className="px-4 py-3 bg-blue-50 flex-shrink-0 border-b border-blue-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h2 className="text-base font-bold text-sky-700">Validation Results</h2>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => filterResults('all')}
                                className={`px-2 rounded-lg text-xs font-semibold transition-all border-2 ${
                                    filter === 'all'
                                        ? 'bg-[#0071E9] text-white border-[#0071E9] shadow-md'
                                        : 'bg-blue-50 border-[#0071E9] text-sky-700 hover:bg-blue-50'
                                }`}
                            >
                                ALL - {totalCount}
                            </button>
                            <button
                                onClick={() => filterResults('pass')}
                                className={`px-2 rounded-lg text-xs font-semibold transition-all border-2 ${
                                    filter === 'pass'
                                        ? 'bg-green-600 text-white border-green-700 shadow-md'
                                        : 'bg-blue-50 border-green-600 text-green-700 hover:bg-green-50'
                                }`}
                            >
                                PASSED - {passedCount}
                            </button>
                            <button
                                onClick={() => filterResults('fail')}
                                className={`px-2 rounded-lg text-xs font-semibold transition-all border-2 ${
                                    filter === 'fail'
                                        ? 'bg-red-500 text-white border-red-600 shadow-md'
                                        : 'bg-blue-50 border-red-500 text-red-600 hover:bg-red-50'
                                }`}
                            >
                                FAILED - {failedCount}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* General Info - Compact */}
            <div className="mx-2 my-2 flex-shrink-0 p-3 gap-0 bg-blue-50/30 border border-blue-200 rounded">
                <div className="p-2">
                    <div className="grid grid-cols-4 gap-x-4 gap-y-1 text-xs">
                        <div className="flex py-0">
                            <span className="font-semibold text-sky-700 min-w-[100px] text-xs">Validation ID:</span>
                            <span className="text-gray-800 text-xs font-medium">{header.validation_id || '-'}</span>
                        </div>
                        <div className="flex py-0">
                            <span className="font-semibold text-sky-700 min-w-[100px] text-xs">Description:</span>
                            <span className="text-gray-800 text-xs font-medium">{header.validation_description || '-'}</span>
                        </div>
                        <div className="flex py-0">
                            <span className="font-semibold text-sky-700 min-w-[100px] text-xs">Executed By:</span>
                            <span className="text-gray-800 text-xs font-medium">{header.executed_by || '-'}</span>
                        </div>
                        <div className="flex py-0">
                            <span className="font-semibold text-sky-700 min-w-[100px] text-xs">Date/Time:</span>
                            <span className="text-gray-800 text-xs font-medium">{formatDateTime(header.execution_date_time)}</span>
                        </div>
                        <div className="flex py-0">
                            <span className="font-semibold text-sky-700 min-w-[100px] text-xs">Application:</span>
                            <span className="text-gray-800 text-xs font-medium">{header.application_label || '-'}</span>
                        </div>
                        <div className="flex py-0">
                            <span className="font-semibold text-sky-700 min-w-[100px] text-xs">Module:</span>
                            <span className="text-gray-800 text-xs font-medium">{header.module || '-'}</span>
                        </div>
                        <div className="flex py-0">
                            <span className="font-semibold text-sky-700 min-w-[100px] text-xs">Transaction Code:</span>
                            <span className="text-gray-800 text-xs font-medium">{header.tcode || '-'}</span>
                        </div>
                        <div className="flex py-0">
                            <span className="font-semibold text-sky-700 min-w-[100px] text-xs">Input Document:</span>
                            <span className="text-gray-800 text-xs font-medium">{header.input_document || '-'}</span>
                        </div>
                        <div className="flex py-0">
                            <span className="font-semibold text-sky-700 min-w-[100px] text-xs">Execution Time:</span>
                            <span className="text-gray-800 text-xs font-medium">
                {header.execution_time
                    ? `${typeof header.execution_time === 'number' ? header.execution_time.toFixed(3) : header.execution_time}s`
                    : '-'}
              </span>
                        </div>
                        <div className="flex py-0">
                            <span className="font-semibold text-sky-700 min-w-[100px] text-xs">Job ID:</span>
                            <span className="text-gray-800 text-xs font-medium">{header.job_id || '-'}</span>
                        </div>
                        <div className="flex py-0">
                            <span className="font-semibold text-sky-700 min-w-[100px] text-xs">Test Cycle:</span>
                            <span className="text-gray-800 text-xs font-medium">{header.test_cycle || '-'}</span>
                        </div>
                        <div className="flex items-center py-0">
                            <span className="font-semibold text-sky-700 min-w-[100px] text-xs">Overall Result:</span>
                            <span
                                className={`ml-1 inline-flex items-center justify-center text-xs h-5 px-2 rounded border ${
                                    overallResult === 'pass'
                                        ? 'bg-emerald-100 text-green-800 border-emerald-300'
                                        : 'bg-red-100 text-red-700 border-red-300'
                                }`}
                            >
                {overallResult.toUpperCase()}
              </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content + (optional) Drilldown side panel */}
            <div className="flex-1 overflow-hidden flex gap-3 px-1 pb-2 pt-2">
                {/* Main scrollable area */}
                <div className="flex-1 overflow-y-auto">
                    {tableWiseData.map((tableData: any, idx: number) => {
                        if (!shouldShowTable(tableData)) return null;

                        const tableKeys = Object.entries(tableData.table_keys || {})
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(', ');

                        return (
                            <div key={idx} className="mb-2 overflow-hidden p-0 gap-0 border border-blue-200 shadow-sm rounded">
                                {/* Table Header */}
                                <div className="bg-white px-4 py-3">
                                    <div className="flex items-center gap-2 flex-wrap text-sm">
                    <span className="font-bold text-sky-700">
                      TABLE: {tableData.table_name}
                    </span>
                                        <span className="text-sky-700">|</span>
                                        <span className="text-sky-700">{tableData.table_description}</span>
                                        <span className="text-sky-700">|</span>
                                        <span className="text-sm italic text-sky-700">Keys: {tableKeys}</span>
                                    </div>
                                </div>

                                {/* Table Content */}
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse">
                                        <thead>
                                        <tr className="border-b-2 border-t border-blue-300">
                                            {(tableData.columns || []).map((col: string) => (
                                                <th
                                                    key={col}
                                                    className="font-bold text-left text-sky-700 text-sm py-3 px-3 border-r border-blue-200 last:border-r-0"
                                                >
                                                    {col}
                                                </th>
                                            ))}
                                        </tr>
                                        </thead>
                                        <tbody className="divide-y divide-blue-100">
                                        {(tableData.fields || []).map((field: any, fieldIdx: number) => {
                                            if (!shouldShowRow(field)) return null;

                                            const resultClass = field.result?.toLowerCase() || '';
                                            const svt = field.source_vs_target || '';
                                            const parsed = parseSourceVsTarget(svt, tableData.table_name, tableData.target_tables);

                                            let actualValueCell: React.ReactNode = formatValue(field.actual_value);
                                            if (field.drilldown && field.drilldown.rows && field.drilldown.rows.length > 0) {
                                                actualValueCell = (
                                                    <button
                                                        onClick={() => openDrilldown(field, tableData)}
                                                        className="text-blue-600 underline hover:text-sky-700 cursor-pointer font-medium transition-colors"
                                                    >
                                                        {formatValue(field.actual_value)}
                                                    </button>
                                                );
                                            }

                                            return (
                                                <tr key={fieldIdx} data-result={resultClass} className="hover:bg-blue-50/70 transition-colors border-0">
                                                    <td className="py-2 px-3 border-r border-blue-100 last:border-r-0">
                                                        <div className="flex items-center gap-1.5 flex-wrap text-xs">
                                <span className="inline-flex items-center rounded border text-sky-700 border-blue-300 text-xs px-1.5 py-0.5">
                                  {parsed.sourceInfo}.{parsed.sourceField}
                                </span>
                                                            <span className="text-blue-600 font-bold text-xs">→</span>
                                                            {parsed.targetInfo === 'CONSTANT' ? (
                                                                <span className="inline-flex items-center rounded border text-sky-700 border-blue-300 text-xs px-1.5 py-0.5">
                                    CONSTANT
                                  </span>
                                                            ) : (
                                                                <span className="inline-flex items-center rounded border text-sky-700 border-blue-300 text-xs px-1.5 py-0.5">
                                    {parsed.targetInfo}.{parsed.targetField}
                                  </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="text-xs py-2 px-3 border-r border-blue-100 text-gray-700">
                                                        {field.field_text || '-'}
                                                    </td>
                                                    <td className="text-xs py-2 px-3 border-r border-blue-100">{actualValueCell}</td>
                                                    <td className="py-2 px-3 border-r border-blue-100">
                              <span className="inline-flex items-center rounded border bg-gray-50 text-gray-700 border-gray-300 text-xs font-mono px-1.5 py-0.5">
                                {field.validation || '-'}
                              </span>
                                                    </td>
                                                    <td className="text-xs py-2 px-3 border-r border-blue-100 text-gray-700">
                                                        {formatValue(field.expected_value)}
                                                    </td>
                                                    <td className="py-2 px-3">
                              <span
                                  className={`inline-flex font-medium items-center rounded border text-xs px-1.5 py-0.5 ${
                                      resultClass === 'pass'
                                          ? 'bg-emerald-100 text-green-800 border-emerald-300'
                                          : 'bg-red-100 text-red-800 border-red-300'
                                  }`}
                              >
                                {field.result || '-'}
                              </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Drilldown inline panel */}
                {drilldownPanel && (
                    <div className="w-[40rem] max-w-[45vw] h-full overflow-y-auto rounded-xl border border-blue-200 bg-white shadow-sm sticky top-0 self-start">
                        <div className="bg-blue-50 border-b border-blue-200 rounded-t-xl relative pr-10 p-3">
                            <button
                                onClick={() => setDrilldownPanel(null)}
                                className="absolute right-3 top-2 h-7 w-7 text-sky-700 hover:bg-blue-50 rounded-lg border border-[#0071E9] bg-white flex items-center justify-center"
                                aria-label="Close details"
                                title="Close"
                            >
                                <span className="text-base leading-none">×</span>
                            </button>
                            <h3 className="text-sky-700 text-lg font-bold">
                                Validation Details: {drilldownPanel.sourceInfo}.{drilldownPanel.sourceField} → {drilldownPanel.targetInfo}.
                                {drilldownPanel.targetField}
                            </h3>
                        </div>

                        <div className="p-3">
                            {/* Info Section */}
                            <div className="mb-2 p-4 rounded border border-blue-200 bg-blue-50/30">
                                <div className="grid grid-cols-5 gap-4 text-xs">
                                    {/* Row 1 */}
                                    <div className="flex flex-col gap-1">
                                        <span className="font-semibold text-sky-700 text-xs">Source Table</span>
                                        <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded border bg-emerald-50 text-emerald-700 border-emerald-300 text-xs px-1.5 py-0.5">
                        {drilldownPanel.sourceInfo}
                      </span>
                                            <span className="text-gray-600 text-xs">({drilldownPanel.tableDesc})</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="font-semibold text-sky-700 text-xs">Field Name</span>
                                        <span className="text-gray-800 font-medium text-xs">
                      {drilldownPanel.field.field || drilldownPanel.sourceField}
                    </span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="font-semibold text-sky-700 text-xs">Field Text</span>
                                        <span className="text-gray-800 text-xs">{drilldownPanel.field.field_text || '-'}</span>
                                    </div>

                                    {/* Row 2 */}
                                    <div className="flex flex-col gap-1">
                                        <span className="font-semibold text-sky-700 text-xs">Source Field</span>
                                        <span className="text-gray-800 text-xs">
                      {drilldownPanel.sourceInfo}.{drilldownPanel.sourceField}
                    </span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="font-semibold text-sky-700 text-xs">Source Aggregated</span>
                                        <span className="text-gray-800 font-medium text-xs">{formatValue(drilldownPanel.field.actual_value)}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="font-semibold text-sky-700 text-xs">Target Table</span>
                                        <span className="inline-flex items-center rounded border bg-blue-50 text-sky-700 border-blue-400 text-xs w-fit px-1.5 py-0.5">
                      {drilldownPanel.targetInfo}
                    </span>
                                    </div>

                                    {/* Row 3 */}
                                    <div className="flex flex-col gap-1">
                                        <span className="font-semibold text-sky-700 text-xs">Target Field</span>
                                        <span className="text-gray-800 text-xs">
                      {drilldownPanel.targetInfo}.{drilldownPanel.targetField}
                    </span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="font-semibold text-sky-700 text-xs">Target Value</span>
                                        <span className="text-gray-800 font-medium text-xs">{formatValue(drilldownPanel.field.expected_value)}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="font-semibold text-sky-700 text-xs">Status</span>
                                        <span
                                            className={`inline-flex items-center rounded border text-xs w-fit px-1.5 py-0.5 ${
                                                drilldownPanel.field.result === 'PASS'
                                                    ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                                                    : 'bg-red-100 text-red-700 border-red-300'
                                            }`}
                                        >
                      {drilldownPanel.field.result}
                    </span>
                                    </div>

                                    {/* Row 4 - Error Message if exists */}
                                    {drilldownPanel.field.error_message && (
                                        <div className="flex flex-col gap-1 col-span-3">
                                            <span className="font-semibold text-sky-700 text-xs">Error Message</span>
                                            <span className="text-red-700 text-xs">{drilldownPanel.field.error_message}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Drilldown Table */}
                            {drilldownPanel.field.drilldown &&
                                drilldownPanel.field.drilldown.rows &&
                                drilldownPanel.field.drilldown.rows.length > 0 && (
                                    <div className="mb-4">
                                        <h3 className="text-xs font-semibold text-sky-700 mb-3 flex items-center gap-2">
                                            <div className="w-1 h-4 bg-blue-200 rounded-full"></div>
                                            Detailed Records
                                        </h3>
                                        <div className="overflow-x-auto rounded-xl border border-blue-200 bg-white shadow-sm">
                                            <table className="w-full border-collapse">
                                                <thead>
                                                <tr className="bg-blue-50">
                                                    {(drilldownPanel.field.drilldown.columns || []).map((col: string) => (
                                                        <th
                                                            key={col}
                                                            className="text-left text-sky-700 font-semibold text-xs py-3 px-4 border-0"
                                                        >
                                                            {col.charAt(0).toUpperCase() + col.slice(1).replace(/_/g, ' ')}
                                                        </th>
                                                    ))}
                                                </tr>
                                                </thead>
                                                <tbody className="divide-y divide-blue-100">
                                                {(drilldownPanel.field.drilldown.rows || []).map((row: any, rowIdx: number) => (
                                                    <tr key={rowIdx} className="hover:bg-blue-50/70 transition-colors border-0">
                                                        {(drilldownPanel.field.drilldown.columns || []).map((col: string, colIdx: number) => {
                                                            const normalizedCol = col.toLowerCase().trim();

                                                            // Try exact match first (case-insensitive)
                                                            let rowValue =
                                                                Object.keys(row).find((k) => k.toLowerCase() === normalizedCol)
                                                                    ? row[Object.keys(row).find((k) => k.toLowerCase() === normalizedCol)!]
                                                                    : undefined;

                                                            if (rowValue === undefined) {
                                                                // Try variations
                                                                const variations = [
                                                                    normalizedCol.replace(/\s+/g, '_'),
                                                                    normalizedCol.replace(/\s+/g, ''),
                                                                    normalizedCol.replace(/\s+/g, '-'),
                                                                    normalizedCol.replace(/s$/, ''),
                                                                    normalizedCol.replace(/s$/, '').replace(/\s+/g, '_'),
                                                                ];

                                                                for (const variation of variations) {
                                                                    if (Object.prototype.hasOwnProperty.call(row, variation)) {
                                                                        rowValue = row[variation];
                                                                        break;
                                                                    }
                                                                    const matchingKey = Object.keys(row).find((k) => k.toLowerCase() === variation);
                                                                    if (matchingKey) {
                                                                        rowValue = row[matchingKey];
                                                                        break;
                                                                    }
                                                                }
                                                            }

                                                            // Fallback normalize
                                                            if (rowValue === undefined) {
                                                                const rowKeys = Object.keys(row);
                                                                const normalizedColNoSpaces = normalizedCol.replace(/[\s\-_]/g, '').replace(/s$/, '');
                                                                const matchingKey = rowKeys.find((k) => {
                                                                    const normalizedKey = k.toLowerCase().replace(/[\s\-_]/g, '').replace(/s$/, '');
                                                                    return normalizedKey === normalizedColNoSpaces;
                                                                });
                                                                if (matchingKey) {
                                                                    rowValue = row[matchingKey];
                                                                }
                                                            }

                                                            // Final fallback
                                                            if (rowValue === undefined) {
                                                                rowValue = row[col] ?? row[col.toLowerCase()] ?? '-';
                                                            }

                                                            return (
                                                                <td
                                                                    key={`${rowIdx}-${col}`}
                                                                    className={`text-xs py-3 px-4 border-0 text-gray-700 ${
                                                                        colIdx < (drilldownPanel.field.drilldown.columns.length - 1) ? 'border-r border-blue-100' : ''
                                                                    }`}
                                                                >
                                                                    {formatValue(rowValue)}
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                            {/* Summary Row - Show comparison result */}
                            <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-300 rounded-lg text-xs">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-sky-700">Comparison:</span>
                                        <span className="inline-flex items-center rounded border bg-white px-3 py-1 border-blue-400 text-xs font-mono text-sky-700">
                      {formatValue(drilldownPanel.field.actual_value)}{' '}
                                            {drilldownPanel.field.validation === 'EQ' ? '=' : drilldownPanel.field.validation || ''}{' '}
                                            {formatValue(drilldownPanel.field.expected_value)}
                    </span>
                                    </div>
                                    <span
                                        className={`inline-flex items-center rounded border text-xs px-2 py-1 ${
                                            drilldownPanel.field.result === 'PASS'
                                                ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                                                : 'bg-red-100 text-red-700 border-red-300'
                                        }`}
                                    >
                    {drilldownPanel.field.result}
                  </span>
                                </div>
                            </div>

                            <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-600 rounded text-xs">
                                <strong className="text-sky-700">Total Detail Records:</strong>{' '}
                                <span className="text-sky-700 font-semibold">{drilldownPanel.field.drilldown?.rows?.length || 0}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TableWiseValidationReport;
