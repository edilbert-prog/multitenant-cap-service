import React, { useReducer } from 'react';
import TabNavigationDefault from "../../utils/TabNavigation";
import ClientInfo from "./ClientMaster/ClientInfo";
import OthersConfig from "./OthersConfig/OthersConfig";
import GrabberPanel from "./GrabberPanel";
import SAPObjectsMaster from "./SAPModule/SAPObjects/SAPObjectsMaster";
import { getDecryptedData } from "@/utils/helpers/storageHelper";
import StandardLibraryMain from "./StandardLibraryMain/StandardLibraryMain";
import AdaptersConfig from "./AdaptersConfig/AdaptersConfig";
import ToskaExecution from "@/components/Configuration/TOSCA/ToskaExecution";

interface Session {
    RoleId?: string;
    [key: string]: unknown;
}

interface State {
    tabs: string[];
    CurrTab: string;
}

interface TabNavigationProps {
    tabs: string[];
    handleCurrentTab: (tab: string) => void;
}

const TabNavigation = TabNavigationDefault as React.ComponentType<TabNavigationProps>;

export default function Configuration(): JSX.Element {
    const loggedInUserSession = (getDecryptedData("UserSession") as unknown) as Session | null;

    const restrictedTabs = [
        'Business Units',
        'Business Process',
        'Applications',
        'Adapters',
        'Others',
    ] as const;

    const allTabs = [
        'Org Details',
        'Standard Library',
        'Objects',
        'Adapters',
        'Grabber',
        'TOSCA',
        'Others',
    ] as const;

    const visibleTabs: string[] = (allTabs as readonly string[]).filter((tab: string) => {
        // if ((restrictedTabs as readonly string[]).includes(tab)) {
        //     return loggedInUserSession?.RoleId === 'RL-0001';
        // }
        return true;
    });
    const [state, setState] = useReducer(
        (s: State, ns: Partial<State>): State => ({ ...s, ...ns }),
        {
            tabs: visibleTabs,
            CurrTab: "Org Details",
        } satisfies State
    );

    const handleCurrentTab = (tab: string): void => {
        setState({ CurrTab: tab });
    };

    return (
        <div className="">
            <div className="cardContainer rounded-lg bg-white ">
                <div className="pt-5 pb-3">
                    <TabNavigation handleCurrentTab={handleCurrentTab} tabs={state.tabs} />
                </div>
                {state.CurrTab === "Org Details" && <ClientInfo />}
                {state.CurrTab === "Standard Library" && <StandardLibraryMain />}
                {state.CurrTab === "Others" && <OthersConfig />}
                {state.CurrTab === "Grabber" && <GrabberPanel />}
                {state.CurrTab === "Adapters" && <AdaptersConfig />}
                {state.CurrTab === "Objects" && <SAPObjectsMaster />}
                {state.CurrTab === "TOSCA" && <ToskaExecution />}
            </div>
        </div>
    );
}
