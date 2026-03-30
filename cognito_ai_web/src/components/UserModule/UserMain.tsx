import React, { useReducer } from "react";
import TabNavigation from "../../utils/TabNavigation";
import UserManagement from "./UserManagement";
import MyProfile from "./MyProfile";
import { getDecryptedData } from "../../utils/helpers/storageHelper";

type UserSession = {
  RoleId?: string;
};

type State = {
  tabs: string[];
  CurrTab: "MyProfile" | "UserManagement";
};

type Action = Partial<State>;

export default function UserMain() {
  const loggedInUserSession = getDecryptedData("UserSession") as UserSession | null;

  const [state, setState] = useReducer(
    (prev: State, next: Action): State => ({ ...prev, ...next }),
    {
      tabs: [
        "MyProfile",
        ...(loggedInUserSession?.RoleId === "RL-0001" ? ["UserManagement"] : []),
      ],
      CurrTab: "MyProfile",
    }
  );

  const handleCurrentTab = (tab: State["CurrTab"]): void => {
    setState({ CurrTab: tab });
  };

  return (
    <div className="p-4 ">
      <div className="cardContainer rounded-lg bg-white ">
        <div className="pt-5 pb-3">
          <TabNavigation handleCurrentTab={handleCurrentTab} tabs={state.tabs} />
        </div>
        {state.CurrTab === "MyProfile" && <MyProfile />}
        {state.CurrTab === "UserManagement" && <UserManagement />}
      </div>
    </div>
  );
}
