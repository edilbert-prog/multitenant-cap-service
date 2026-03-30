import React, { useReducer } from 'react';
import PillGroup from "../../../utils/PillGroup.jsx";
import CredentialVault from "@/components/ValidationTabView/Credentials-Vault/CredVaultPage/CredentialVault";
import LLMConnections from "./LLMConnections";

type PillKey = "Connections" | "LLM Config";

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
    CurrPillActive: "Connections",
    pillItems: [
        { key: "Connections", label: "Connections" },
        { key: "LLM Config", label: "LLM Config" },
    ],
};

export default function AdaptersConfig(_: Props) {
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
            {state.CurrPillActive === "Connections" && <CredentialVault />}
            {state.CurrPillActive === "LLM Config" && <LLMConnections />}
        </div>
    );
}
