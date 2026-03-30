import React, { useReducer } from 'react';
import PillGroup from "../../../utils/PillGroup.jsx";
import IntegrationModesMaster from "./IntegrationModesMaster.jsx";
import TestingTechniquesMaster from "./TestingTechniquesMaster.jsx";
import TestingTypesMaster from "./TestingTypesMaster.jsx";
import ProjectTypesMaster from "./ProjectTypesMaster.jsx";
// import TestStepsHeaderMaster from "../SAPModule/SAPObjects/TestStepsHeaderMaster.js";
import ObjectsTypeMaster from "./ObjectsTypeMaster.jsx";
import ComponentTypesMaster from "./ComponentTypesMaster.jsx";
import ComponentKeysMaster from "./ComponentKeysMaster";
import TableFieldKeysMaster from "./TableFieldKeysMaster";
// import ComponentKeyTestCaseMappingMaster from "./ComponentKeyTestCaseMappingMaster";
import ApiValidator from "@/utils/ApiValidator";
// import TestUITemp from "./TestButton.tsx";

type PillKey =
    | "Integration"
    | "TestingTechniquesMaster"
    | "TestingTypesMaster"
    | "Testing Steps"
    | "Object Type"
    | "Component Type"
    | "Component Keys"
    | "Table Field Keys"
    // | "Component Keys Test Case Mapping"
    | "ApiValidator"
    | "ProjectTypesMaster";

interface PillItem {
    key: PillKey;
    label: string;
}

interface State {
    CurrPillActive: PillKey;
    pillItems: PillItem[];
}

type Props = {};

const reducer = (state: State, newState: Partial<State>): State => ({
    ...state,
    ...newState,
});

const initialState: State = {
    CurrPillActive: "Integration",
    pillItems: [
        { key: "Integration", label: "Integrations Modes" },
        { key: "TestingTechniquesMaster", label: "Testing Techniques" },
        { key: "TestingTypesMaster", label: "Testing Types" },
        // { key: "Testing Steps", label: "Test Steps" },
        { key: "Object Type", label: "Object Type" },
        { key: "Component Type", label: "Component Type" },
        { key: "Component Keys", label: "Component Keys" },
        { key: "Table Field Keys", label: "Table Field Keys" },
        // { key: "Component Keys Test Case Mapping", label: "Component Keys Test Case Mapping" },
        { key: "ApiValidator", label: "API Validator" },
        // {key: 'ProjectTypesMaster', label: 'Project Types'},
        // { key: "TestUI", label: "UI Test" },
    ],
};

export default function OthersConfig(_: Props) {
    const [state, setState] = useReducer(reducer, initialState);

    const handlePillClick = (item: PillItem): void => {
        setState({ CurrPillActive: item.key });
    };

    return (
        <div className="pt-0 pb-6 px-6">
            <div className="border-b pb-2 mb-3 border-b-gray-200">
                <PillGroup
                    items={state.pillItems}
                    primaryKey={state.CurrPillActive}
                    onClick={handlePillClick}
                />
            </div>
            {state.CurrPillActive === "Integration" && <IntegrationModesMaster />}
            {state.CurrPillActive === "TestingTechniquesMaster" && <TestingTechniquesMaster />}
            {state.CurrPillActive === "TestingTypesMaster" && <TestingTypesMaster />}
            {state.CurrPillActive === "ProjectTypesMaster" && <ProjectTypesMaster />}
            {/* {state.CurrPillActive === "Testing Steps" && <TestStepsHeaderMaster />} */}
            {state.CurrPillActive === "Object Type" && <ObjectsTypeMaster />}
            {state.CurrPillActive === "Component Type" && <ComponentTypesMaster />}
            {state.CurrPillActive === "Component Keys" && <ComponentKeysMaster />}
            {state.CurrPillActive === "Table Field Keys" && <TableFieldKeysMaster />}
            {/* {state.CurrPillActive === "Component Keys Test Case Mapping" && <ComponentKeyTestCaseMappingMaster />} */}
            {state.CurrPillActive === "ApiValidator" && <ApiValidator />}
            {/* {state.CurrPillActive === "TestUI" && <TestUITemp />} */}
        </div>
    );
}