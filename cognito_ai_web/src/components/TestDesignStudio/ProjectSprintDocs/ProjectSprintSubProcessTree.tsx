import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

/* ---------- Types ---------- */

type SelectionState = boolean | "indeterminate";

type ToggleType =
    | "businessprocess"
    | "subprocess"
    | "application"
    | "transaction"
    | "feature"
    | "program"
    | "integration";

interface Transaction {
    TransactionId: string;
    Transaction: string;
    TransactionCode: string;
    selected?: boolean;
    indeterminate?: boolean;
    [key: string]: unknown;
}

interface Feature {
    FeatureId: string;
    Feature: string;
    selected?: boolean;
    indeterminate?: boolean;
    [key: string]: unknown;
}

interface Program {
    ProgramId: string;
    ProgramName: string;
    selected?: boolean;
    indeterminate?: boolean;
    [key: string]: unknown;
}

interface Application {
    ApplicationId: string;
    ApplicationName: string;
    selected?: boolean;
    indeterminate?: boolean;
    Transactions?: Transaction[];
    Features?: Feature[];
    Programs?: Program[];
    [key: string]: unknown;
}

interface Integration {
    IntegrationId: string;
    IntegrationName: string;
    selected?: boolean;
    indeterminate?: boolean;
    [key: string]: unknown;
}

interface BaseNodeState {
    selected?: boolean;
    indeterminate?: boolean;
    Applications?: Application[];
    Integrations?: Integration[];
    SubProcesses?: SubProcessNode[];
    [key: string]: unknown;
}

interface BusinessProcessNode extends BaseNodeState {
    BusinessProcessId: string;
    BusinessProcessName: string;
    BusinessSubProcessId?: never;
}

interface SubProcessNode extends BaseNodeState {
    BusinessSubProcessId: string;
    BusinessSubProcessName: string;
    BusinessProcessId?: string;
}

type TreeDataNode = BusinessProcessNode | SubProcessNode;

interface TreeDataRoot {
    BusinessProcesses?: BusinessProcessNode[];
    [key: string]: unknown;
}

type OnToggleFn = (
    node: TreeDataNode,
    child?: unknown | null,
    type?: ToggleType
) => void;

type OnAddClickFn = (payload: unknown, action: string) => void;

/* ---------- UI bits ---------- */

type CheckboxIconProps = {
    state: SelectionState;
    clr?: string;
};

const CheckboxIcon: React.FC<CheckboxIconProps> = ({ state, clr }) => {
    if (state === true) {
        return (
            <div className={`w-4 h-4 rounded ${clr || "bg-[#0071E9]"} flex items-center justify-center`}>
                <svg viewBox="0 0 24 24" className="w-3 h-3 text-white">
                    <path
                        fill="currentColor"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        d="M9 16.2l-3.5-3.6L4 14l5 5 12-12-1.4-1.4z"
                    />
                </svg>
            </div>
        );
    }

    if (state === "indeterminate") {
        return (
            <div className={`w-4 h-4 rounded ${clr || "bg-[#0071E9]"} flex items-center justify-center`}>
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-white">
                    <rect x="5" y="10" width="14" height="4" fill="currentColor" rx="1" />
                </svg>
            </div>
        );
    }

    return <div className="w-4 h-4 rounded border border-gray-400 bg-white" />;
};

type TreeToggleIconProps = {
    isOpen: boolean;
};

const TreeToggleIcon: React.FC<TreeToggleIconProps> = ({ isOpen }) => (
    <motion.div initial={false} animate={{ rotate: isOpen ? 90 : 0 }} className="text-gray-500">
        <ChevronRight size={16} />
    </motion.div>
);

/* ---------- Tree Node ---------- */

type TreeNodeProps = {
    node: TreeDataNode;
    onToggle: OnToggleFn;
    type: ToggleType;
    onAddClick: OnAddClickFn;
    level?: number;
};

const TreeNode: React.FC<TreeNodeProps> = ({ node, onToggle, type, onAddClick, level = 0 }) => {
    const [isOpen, setIsOpen] = useState<boolean>(
        () =>
            level === 0 &&
            !!(
                node.SubProcesses?.length ||
                node.Applications?.length ||
                node.Integrations?.length
            )
    );

    const handleCheckboxClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggle(node);
    };

    const hasBPId = "BusinessProcessId" in node && typeof node.BusinessProcessId === "string";
    const hasBSPId = "BusinessSubProcessId" in node && typeof node.BusinessSubProcessId === "string";

    const isTopParent = !!hasBPId && !hasBSPId;
    const isSecondParent =
        !!hasBSPId &&
        !!(node.SubProcesses?.length || node.Applications?.length || node.Integrations?.length);

    return (
        <div className="ml-4 mt-2">
            <div
                className={`flex items-center justify-between shadow transition rounded-lg ${
                    isTopParent
                        ? "bg-[#f1f1f1] cursor-pointer p-2.5 hover:bg-gray-100"
                        : isSecondParent
                            ? "bg-[#f0f5ff] p-2 cursor-pointer hover:bg-gray-100"
                            : "bg-white p-2 cursor-pointer"
                }`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2">
          <span
              onClick={(e) => {
                  e.stopPropagation();
                  onToggle(node, null, type);
              }}
          >
            <CheckboxIcon
                state={node.selected ? true : node.indeterminate ? "indeterminate" : false}
            />
          </span>
                    {(node.SubProcesses?.length ||
                        node.Applications?.length ||
                        node.Integrations?.length) && <TreeToggleIcon isOpen={isOpen} />}
                    {isTopParent ? (
                        <div className="text-lg font-semibold text-gray-800">
                            {"BusinessProcessName" in node ? node.BusinessProcessName : ""}
                        </div>
                    ) : (
                        <div className="text-sm font-medium text-gray-800">
                            {"BusinessSubProcessName" in node ? node.BusinessSubProcessName : ""}
                        </div>
                    )}
                </div>
            </div>

            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="pl-4 border-l border-gray-300"
                    >
                        {node.Applications?.length ? (
                            <div className="bg-blue-50 rounded-xl p-3 mt-3 shadow-sm">
                                <div className="font-semibold text-blue-800 text-sm mb-2">Transactions</div>
                                <ul className="ml-4">
                                    {node.Applications.map((app) => (
                                        <li key={app.ApplicationId} className="mt-2">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="text-sm text-gray-700 cursor-pointer hover:underline"
                                                    onClick={() => onAddClick({ app, parentSubProcess: node }, "viewApp")}
                                                >
                                                    {app.ApplicationName}
                                                </div>
                                            </div>

                                            {app.Transactions?.length ? (
                                                <ul className="ml-6 mt-1">
                                                    {app.Transactions.map((txn) => (
                                                        <li key={txn.TransactionId} className="flex items-center gap-2 mt-1">
                              <span
                                  onClick={(e) => {
                                      e.stopPropagation();
                                      onToggle(node, txn, "transaction");
                                  }}
                              >
                                <CheckboxIcon
                                    state={txn.selected ? true : txn.indeterminate ? "indeterminate" : false}
                                    clr="bg-purple-600"
                                />
                              </span>
                                                            <div
                                                                className="text-sm text-gray-700 cursor-pointer hover:underline"
                                                                onClick={() => onAddClick({ txn, parentApp: app }, "viewTransaction")}
                                                            >
                                                                {`${txn.Transaction} (${txn.TransactionCode})`}
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : null}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : null}

                        {node.Applications?.some((app) => app.Features?.length) ? (
                            <div className="bg-indigo-50 rounded-xl p-3 mt-3 shadow-sm">
                                <div className="font-semibold text-indigo-800 text-sm mb-2">Features</div>
                                <ul className="ml-4">
                                    {node.Applications.map(
                                        (app) =>
                                            app.Features?.length && (
                                                <li key={`features-${app.ApplicationId}`} className="mt-2">
                                                    <div
                                                        className="text-sm font-medium text-gray-800 cursor-pointer hover:underline"
                                                        onClick={() => onAddClick({ app, parentSubProcess: node }, "viewApp")}
                                                    >
                                                        {app.ApplicationName}
                                                    </div>
                                                    <ul className="ml-4 mt-1">
                                                        {app.Features.map((feature) => (
                                                            <li key={feature.FeatureId} className="flex items-center gap-2 mt-1">
                                <span
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onToggle(node, feature, "feature");
                                    }}
                                >
                                  <CheckboxIcon
                                      state={
                                          feature.selected
                                              ? true
                                              : feature.indeterminate
                                                  ? "indeterminate"
                                                  : false
                                      }
                                      clr="bg-indigo-600"
                                  />
                                </span>
                                                                <div
                                                                    className="text-sm text-gray-700 cursor-pointer hover:underline"
                                                                    onClick={() => onAddClick({ feature, parentApp: app }, "viewFeature")}
                                                                >
                                                                    {feature.Feature}
                                                                </div>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </li>
                                            )
                                    )}
                                </ul>
                            </div>
                        ) : null}

                        {node.Applications?.some((app) => app.Programs?.length) ? (
                            <div className="bg-purple-50 rounded-xl p-3 mt-3 shadow-sm">
                                <div className="font-semibold text-purple-800 text-sm mb-2">Programs</div>
                                <ul className="ml-4">
                                    {node.Applications.map(
                                        (app) =>
                                            app.Programs?.length && (
                                                <li key={`programs-${app.ApplicationId}`} className="mt-2">
                                                    <div
                                                        className="text-sm font-medium text-gray-800 cursor-pointer hover:underline"
                                                        onClick={() => onAddClick({ app, parentSubProcess: node }, "viewApp")}
                                                    >
                                                        {app.ApplicationName}
                                                    </div>
                                                    <ul className="ml-4 mt-1">
                                                        {app.Programs.map((program) => (
                                                            <li key={program.ProgramId} className="flex items-center gap-2 mt-1">
                                <span
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onToggle(node, program, "program");
                                    }}
                                >
                                  <CheckboxIcon
                                      state={
                                          program.selected
                                              ? true
                                              : program.indeterminate
                                                  ? "indeterminate"
                                                  : false
                                      }
                                      clr="bg-purple-600"
                                  />
                                </span>
                                                                <div
                                                                    className="text-sm text-gray-700 cursor-pointer hover:underline"
                                                                    onClick={() => onAddClick({ program, parentApp: app }, "viewProgram")}
                                                                >
                                                                    {program.ProgramName}
                                                                </div>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </li>
                                            )
                                    )}
                                </ul>
                            </div>
                        ) : null}

                        {node.Integrations?.length ? (
                            <div className="bg-green-50 rounded-xl p-3 mt-3 shadow-sm">
                                <div className="font-semibold text-green-800 text-sm mb-2">Integrations</div>
                                {node.Integrations.map((int) => (
                                    <div key={int.IntegrationId} className="ml-4 mt-2 flex items-center gap-2">
                    <span
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggle(node, int, "integration");
                        }}
                    >
                      <CheckboxIcon
                          state={int.selected ? true : int.indeterminate ? "indeterminate" : false}
                          clr="bg-green-700"
                      />
                    </span>
                                        <div className="text-sm text-gray-700">{int.IntegrationName}</div>
                                    </div>
                                ))}
                            </div>
                        ) : null}

                        {node.SubProcesses?.map((child) => (
                            <TreeNode
                                key={child.BusinessSubProcessId}
                                node={child}
                                level={level + 1}
                                type="subprocess"
                                onToggle={onToggle}
                                onAddClick={onAddClick}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

/* ---------- Root Component ---------- */

type ProjectSprintSubProcessTreeProps = {
    treeData: TreeDataRoot | null | undefined;
    onToggle: OnToggleFn;
    onAddClick: OnAddClickFn;
};

export default function ProjectSprintSubProcessTree({
                                                        treeData,
                                                        onToggle,
                                                        onAddClick,
                                                    }: ProjectSprintSubProcessTreeProps) {
    if (!treeData || !treeData.BusinessProcesses?.length) {
        return <div className="text-center text-gray-500">No Data</div>;
    }
    return (
        <div className="max mx-auto p-6 bg-white rounded-xl shadow-md">
            {treeData.BusinessProcesses.map((bp) => (
                <TreeNode
                    key={bp.BusinessProcessId}
                    node={bp}
                    type="businessprocess"
                    onToggle={onToggle}
                    onAddClick={onAddClick}
                />
            ))}
        </div>
    );
}
