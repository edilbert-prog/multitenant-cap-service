import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Configuration from "../../components/Configuration/Configuration";
import TestAutomation from "../../components/TestAutomation/TestAutomation.js";
import TestExecution from "../../components/TestExecution/TestExecution";
import ImpactAnalysis from "../../components/ImpactAnalysis/ImpactAnalysis";
import Dashboard from "../../components/Dashboard/Dashboard";
import TestDesignStudioV2 from "../../components/TestDesignStudio/ProjectSprintDocs/TestDesignStudioV2";
import ExecutionComponentMain from "../../components/TestExecution/ExecutionComponentMain";
import UserMain from "../../components/UserModule/UserMain.jsx";
import ValidationComponentMain from "../../components/ValidationTabView/ValidationListPage/ValidationComponentMain";

// Validation pages
import ValidationDashboard from "../../pages/validation/Dashboard";
import ValidationSAPTables from "../../pages/validation/SAPTables";
import ValidationList from "../../pages/validation/Validations";
import ValidationEditor from "../../pages/validation/ValidationEditor";
import ValidationRunPage from "../../pages/validation/RunValidation";
import ValidationResults from "../../pages/validation/Results";
import ValidationResultDetails from "../../pages/validation/ResultDetails";
import ValidationSettings from "../../pages/validation/Settings";

type Props = {};

export default function AppRoutes(_: Props) {  
    return ( 
        <Routes>
              <Route
                path="/"
                element={<Dashboard />}
            />

            <Route
                path="/Settings"
                element={<Configuration />}
            />

            <Route
                path="/TestAutomation"
                element={<TestAutomation />}
            />

            <Route
                path="/TestExecution"
                element={<TestExecution />}
            />
            <Route
                path="/ImpactAnalysis"
                element={<ImpactAnalysis />}
            />
            <Route
                path="/ProjectDetails"
                element={<TestDesignStudioV2 />}
            />
            <Route
                path="/UserManagement"
                element={<UserMain />}
            />
            <Route
                path="/ValidationComponents"
                element={<ValidationComponentMain />}
            />
            <Route
                path="/ExecutionComponent"
                element={<ExecutionComponentMain />}
            />
            {/* <Route
                path="/connection-vault/connectors"
                element={<CredConnectors />}
            />
            <Route
                path="/connection-vault/create/:selectedConnectorId"
                element={<CreateCredVault />}
            /> */}


            {/* Validation Routes */}
            <Route
                path="/validation/dashboard"
                element={<ValidationDashboard />}
            />
            <Route
                path="/validation/sap-tables"
                element={<ValidationSAPTables />}
            />
            <Route
                path="/validation/workflows/:id/edit"
                element={<ValidationEditor />}
            />
            <Route
                path="/validation/run"
                element={<ValidationRunPage />}
            />
            <Route
                path="/validation/results"
                element={<ValidationResults />}
            />
            <Route
                path="/validation/results/:id"
                element={<ValidationResultDetails />}
            />
            <Route
                path="/validation/settings"
                element={<ValidationSettings />}
            />




            <Route
                path="*"
                element={
                    <Navigate to="/" replace />
                }
            />
        </Routes>
    );
}
