import React from 'react';

interface SectionObj {
    Title: string;
    SubTitle: string;
}

interface ExecutionToscaProps {
    CurrPillActive: string;
    CurrentSectionObj: SectionObj;
    CurrentTileMenu: string;
    handleCurrentTileMenu: (Menu: string) => void;
    handleCurrentSection: (Title: string, SubTitle: string) => void;
    CurrentSprint: Record<string, unknown>;
}

const ExecutionTosca: React.FC<ExecutionToscaProps> = ({
    CurrPillActive,
    CurrentSectionObj,
    CurrentTileMenu,
    handleCurrentTileMenu,
    handleCurrentSection,
    CurrentSprint
}) => {
    return (
        <div className="execution-tosca-container">
            <div className="header">
                <h2>{CurrentSectionObj.Title}</h2>
                <p>{CurrentSectionObj.SubTitle}</p>
            </div>
            
            <div className="content">
                <div className="execution-details">
                    <h3>Tosca Test Execution</h3>
                    <div className="info-section">
                        <p><strong>Active Pill:</strong> {CurrPillActive}</p>
                        <p><strong>Current Menu:</strong> {CurrentTileMenu}</p>
                    </div>
                    
                    <div className="test-suites">
                        <h4>Tosca Test Suites</h4>
                        <table>
                            <thead>
                                <tr>
                                    <th>Test Suite</th>
                                    <th>Status</th>
                                    <th>Duration</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Login Module</td>
                                    <td>Passed</td>
                                    <td>2m 30s</td>
                                </tr>
                                <tr>
                                    <td>User Management</td>
                                    <td>Passed</td>
                                    <td>5m 15s</td>
                                </tr>
                                <tr>
                                    <td>Payment Processing</td>
                                    <td>Failed</td>
                                    <td>3m 45s</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    
                    <div className="execution-summary">
                        <h4>Execution Summary</h4>
                        <p>Total Test Cases: 156</p>
                        <p>Passed: 142</p>
                        <p>Failed: 14</p>
                        <p>Success Rate: 91%</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExecutionTosca;