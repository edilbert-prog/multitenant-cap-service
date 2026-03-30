import React, {useReducer} from 'react';
import PillGroup from "../../../utils/PillGroup";
import BusinessUnitMaster from "../BusinessUnitMaster";
import BusinessProcessMaster from "../BusinessProcessMaster";
import ApplicationMaster from "../ApplicationMaster/ApplicationMaster";
import TransactionsMaster from "../Transactions/TransactionsMaster";
import TablesMaster from "../Tables/TablesMaster";
import IntegrationsMaster from "../Integrations/IntegrationsMaster";
import ProgramsMaster from "../ApplicationMaster/ProgramsMaster";
import FeaturesMaster from "../ApplicationMaster/FeaturesMaster";
import TestStepsGlobal from "../TestStepsGlobal/TestStepsHeaderGlobalMaster.tsx";


const StandardLibraryMain = () => {
    let [state, setState] = useReducer(
        (state, newState) => ({...state, ...newState}),
        {

            CurrPillActive: "BusinessProcess",
            pillItems: [
                // {key: 'BusinessUnits', label: 'Business Units'},
                {key: 'BusinessProcess', label: 'Business Process'},
                {key: 'Applications', label: 'Applications'},
                {key: 'Transactions', label: 'Transactions'},
                {key: 'Tables', label: 'Tables'},
                {key: 'Integrations', label: 'Integrations'},
                {key: 'Programs', label: 'Programs'},
                {key: 'Features', label: 'Features'},
                {key: 'TestStepsGlobal', label: 'Test Steps Global'},
            ],
        });

    const handlePillClick = (item) => {
        setState({CurrPillActive: item.key});
    };
    return (
        <div className="  pt-0 pb-6 px-3 ">
            <div className="border-b pb-2 mb-3 border-b-gray-200">
                <PillGroup
                    items={state.pillItems}
                    primaryKey={state.CurrPillActive}
                    onClick={handlePillClick}
                />
            </div>
            {state.CurrPillActive === "BusinessUnits" && <BusinessUnitMaster/>}
            {state.CurrPillActive === "BusinessProcess" && <BusinessProcessMaster/>}
            {state.CurrPillActive === "Applications" && <ApplicationMaster/>}
            {state.CurrPillActive === "Transactions" && <TransactionsMaster/>}
            {state.CurrPillActive === "Tables" && <TablesMaster/>}
            {state.CurrPillActive === "Integrations" && <IntegrationsMaster/>}
            {state.CurrPillActive === "Programs" && <ProgramsMaster/>}
            {state.CurrPillActive === "Features" && <FeaturesMaster/>}
            {state.CurrPillActive === "TestStepsGlobal" && <TestStepsGlobal/>}

        </div>
    );
};

export default StandardLibraryMain;