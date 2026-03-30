import React from 'react';

interface SectionObj {
    Title: string;
    SubTitle: string;
}

interface ExecutionSeleniumProps {
    CurrPillActive: string;
    CurrentSectionObj: SectionObj;
    CurrentTileMenu: string;
    handleCurrentTileMenu: (Menu: string) => void;
    handleCurrentSection: (Title: string, SubTitle: string) => void;
    CurrentSprint: Record<string, unknown>;
}

const ExecutionSelenium: React.FC<ExecutionSeleniumProps> = ({
    CurrPillActive,
    CurrentSectionObj,
    CurrentTileMenu,
    handleCurrentTileMenu,
    handleCurrentSection,
    CurrentSprint
}) => {
    return (
        <div className="execution-selenium-container">
            <div className="header">
                <h2>{CurrentSectionObj.Title}</h2>
                <p>{CurrentSectionObj.SubTitle}</p>
            </div>
            
            <div className="content">
                <div className="execution-details">
                    <h3>Selenium Test Execution</h3>
                    <div className="info-section">
                        <p><strong>Active Pill:</strong> {CurrPillActive}</p>
                        <p><strong>Current Menu:</strong> {CurrentTileMenu}</p>
                        <p><strong>Browser:</strong> Chrome 120.0</p>
                    </div>
                    
                    <div className="test-scenarios">
                        <h4>Selenium Test Scenarios</h4>
                        <div className="scenario-list">
                            <div className="scenario-item passed">
                                <span className="icon">✓</span>
                                <div className="details">
                                    <strong>User Login Flow</strong>
                                    <small>Duration: 45s</small>
                                </div>
                            </div>
                            <div className="scenario-item passed">
                                <span className="icon">✓</span>
                                <div className="details">
                                    <strong>Add to Cart</strong>
                                    <small>Duration: 1m 20s</small>
                                </div>
                            </div>
                            <div className="scenario-item failed">
                                <span className="icon">✗</span>
                                <div className="details">
                                    <strong>Checkout Process</strong>
                                    <small>Duration: 2m 10s</small>
                                </div>
                            </div>
                            <div className="scenario-item passed">
                                <span className="icon">✓</span>
                                <div className="details">
                                    <strong>Profile Update</strong>
                                    <small>Duration: 55s</small>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="browser-compatibility">
                        <h4>Browser Compatibility</h4>
                        <div className="browser-grid">
                            <div className="browser-item">Chrome: 95%</div>
                            <div className="browser-item">Firefox: 92%</div>
                            <div className="browser-item">Safari: 88%</div>
                            <div className="browser-item">Edge: 94%</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExecutionSelenium;