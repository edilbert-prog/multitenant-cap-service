import React, { useReducer } from 'react';
import ProjectSprintSessionDetailsV2 from './ProjectSprintSessionDetailsV2';
import ProjectSprintSessionTestCases from './ProjectSprintSessionTestCases';
import TabNavigation from '../../../utils/TabNavigation';

type TabKey = 'Test Scenarios' | 'Test Cases' | 'Test Procedures';

type Props = {
    children?: React.ReactNode;
    CurrentSectionObj?: object;
    handleCurrentSection?: (fun:any)=>void;
    CurrentSprint?: object;
};

interface State {
    tabs: TabKey[];
    CurrTab: TabKey;
}

export default function ArtifactsMain(_props: Props) {
    const initialState: State = {
        tabs: ['Test Scenarios', 'Test Cases', 'Test Procedures'],
        CurrTab: 'Test Scenarios',
    };

    const [state, setState] = useReducer(
        (s: State, ns: Partial<State>): State => ({ ...s, ...ns }),
        initialState
);

    const handleCurrentTab = (tab: TabKey): void => {
        setState({ CurrTab: tab });
    };

    return (
        <div className=" w-full h-full ">
            <div className="pt-2 pb-3">
                <TabNavigation handleCurrentTab={handleCurrentTab} tabs={state.tabs} />
            </div>
            {state.CurrTab === 'Test Scenarios' && <ProjectSprintSessionDetailsV2 CurrentSession={{}}/>}
            {state.CurrTab === 'Test Cases' && <ProjectSprintSessionTestCases CurrentSession={{}}/>}
        </div>
    );
}
