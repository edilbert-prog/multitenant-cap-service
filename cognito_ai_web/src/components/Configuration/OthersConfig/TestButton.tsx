import React, { useState } from 'react';
import { apiRequest } from "../../../utils/helpers/ApiHelper";

interface TransportIdResponse {
    success: boolean;
    testMode: boolean;
    environment: string;
    extractedCount: number;
    transportIds: string[];
    transportIdsString: string;
    rfcResponse: any[];
    rfcMetadata: {
        message: string;
        status: string;
        recordsCount: number;
    };
}

interface ErrorResponse {
    error: string;
    details?: string;
}

const SimpleAPITest: React.FC = () => {
    const [loading, setLoading] = useState<boolean>(false);
    const [response, setResponse] = useState<TransportIdResponse | null>(null);
    const [error, setError] = useState<ErrorResponse | null>(null);
    const [debugInfo, setDebugInfo] = useState<string>('');

    const handleTestAPI = async () => {
        setLoading(true);
        setError(null);
        setResponse(null);
        setDebugInfo('');

        try {
            // Get API URL and handle both string and object responses
            let apiUrl: string;
            try {
                // const apiResult = await apiRequest('/GetWorkspaces', {"WorkspaceId":"WSID-2"});
                const apiResult = await apiRequest('/ExtractTransportIdsFromSAPRFCTest');
                
                // Check if apiResult is a string or an object
                if (typeof apiResult === 'string') {
                    apiUrl = apiResult;
                } else if (typeof apiResult === 'object' && apiResult !== null) {
                    // If it's an object, try to extract the URL property
                    apiUrl = (apiResult as any).url || (apiResult as any).path || JSON.stringify(apiResult);
                    console.warn('apiRequest returned an object instead of a string:', apiResult);
                } else {
                    throw new Error(`Invalid apiRequest response type: ${typeof apiResult}`);
                }

                setDebugInfo(`API URL: ${apiUrl}`);
                console.log('API URL:', apiUrl);
                console.log('API URL type:', typeof apiUrl);
            } catch (err: any) {
                throw new Error(`Failed to get API URL: ${err.message}`);
            }

            // Validate URL before making request
            if (!apiUrl || apiUrl.includes('[object') || apiUrl.includes('undefined')) {
                throw new Error(`Invalid API URL: ${apiUrl}`);
            }

            // Make the API call
            console.log('Making POST request to:', apiUrl);
            const res = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            console.log('Response status:', res.status);
            console.log('Response OK:', res.ok);

            // Get response text first to check if it's valid JSON
            const responseText = await res.text();
            console.log('Response text length:', responseText.length);
            console.log('Response text preview:', responseText.substring(0, 200));

            // Check if response is empty
            if (!responseText || responseText.trim() === '') {
                throw new Error('Empty response from server');
            }

            // Try to parse JSON
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError: any) {
                console.error('JSON Parse Error:', parseError);
                throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}...`);
            }

            if (res.ok) {
                setResponse(data);
                console.log('API Response:', data);
            } else {
                setError(data);
                console.error('API Error:', data);
            }
        } catch (err: any) {
            console.error('Full Error:', err);
            setError({
                error: err.name || 'Network error',
                details: err.message,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleClear = () => {
        setResponse(null);
        setError(null);
        setDebugInfo('');
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h1 style={styles.title}>SAP RFC API Test</h1>
                <p style={styles.subtitle}>Test Transport IDs extraction without file upload</p>

                {debugInfo && (
                    <div style={styles.debugInfo}>
                        <small>{debugInfo}</small>
                    </div>
                )}

                <div style={styles.buttonGroup}>
                    <button
                        onClick={handleTestAPI}
                        disabled={loading}
                        style={{
                            ...styles.button,
                            ...styles.buttonPrimary,
                            ...(loading ? styles.buttonDisabled : {}),
                        }}
                    >
                        {loading ? '⏳ Testing API...' : '🚀 Test API'}
                    </button>

                    {(response || error) && (
                        <button
                            onClick={handleClear}
                            style={{ ...styles.button, ...styles.buttonSecondary }}
                        >
                            🗑️ Clear
                        </button>
                    )}
                </div>

                {/* Error Display */}
                {error && (
                    <div style={styles.alertError}>
                        <strong>❌ Error:</strong> {error.error}
                        {error.details && (
                            <div style={styles.errorDetails}>
                                <strong>Details:</strong> {error.details}
                            </div>
                        )}
                        <div style={styles.errorDetails}>
                            <strong>💡 Tip:</strong> Check your ApiHelper.ts file. The apiRequest function should return a string URL, not an object.
                        </div>
                    </div>
                )}

                {/* Success Display */}
                {response && (
                    <div style={styles.results}>
                        <div style={styles.alertSuccess}>
                            <strong>✅ Success!</strong> Extracted {response.extractedCount} Transport IDs
                            {response.testMode && (
                                <span style={styles.badge}>TEST MODE</span>
                            )}
                        </div>

                        {/* Quick Stats */}
                        <div style={styles.statsGrid}>
                            <div style={styles.statCard}>
                                <div style={styles.statLabel}>Environment</div>
                                <div style={styles.statValue}>{response.environment}</div>
                            </div>
                            <div style={styles.statCard}>
                                <div style={styles.statLabel}>Count</div>
                                <div style={styles.statValue}>{response.extractedCount}</div>
                            </div>
                            <div style={styles.statCard}>
                                <div style={styles.statLabel}>Status</div>
                                <div style={styles.statValue}>{response.rfcMetadata.status}</div>
                            </div>
                        </div>

                        {/* Transport IDs */}
                        <div style={styles.section}>
                            <h3 style={styles.sectionTitle}>Transport IDs:</h3>
                            <div style={styles.transportIds}>
                                {response.transportIds.map((id, index) => (
                                    <span key={index} style={styles.idBadge}>
                                        {id}
                                    </span>
                                ))}
                            </div>
                            <div style={{ marginTop: '1rem' }}>
                                <input
                                    type="text"
                                    readOnly
                                    value={response.transportIdsString}
                                    style={styles.input}
                                />
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(response.transportIdsString);
                                        alert('Copied to clipboard!');
                                    }}
                                    style={{ ...styles.button, ...styles.buttonCopy, marginTop: '0.5rem' }}
                                >
                                    📋 Copy
                                </button>
                            </div>
                        </div>

                        {/* RFC Response */}
                        <div style={styles.section}>
                            <h3 style={styles.sectionTitle}>RFC Response:</h3>
                            <div style={styles.tableWrapper}>
                                <table style={styles.table}>
                                    <thead>
                                        <tr>
                                            <th style={styles.th}>Transport ID</th>
                                            <th style={styles.th}>Object</th>
                                            <th style={styles.th}>Type</th>
                                            <th style={styles.th}>Status</th>
                                            <th style={styles.th}>Count</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {response.rfcResponse.map((item, index) => (
                                            <tr key={index} style={index % 2 === 0 ? styles.trEven : styles.trOdd}>
                                                <td style={styles.td}><strong>{item.TRANSPORT_ID}</strong></td>
                                                <td style={styles.td}>{item.OBJECT_NAME}</td>
                                                <td style={styles.td}>
                                                    <span style={styles.typeBadge}>{item.OBJECT_TYPE}</span>
                                                </td>
                                                <td style={styles.td}>
                                                    <span style={styles.statusBadge}>{item.STATUS}</span>
                                                </td>
                                                <td style={styles.td}>{item.OBJECTS_COUNT}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Raw JSON */}
                        <details style={styles.details}>
                            <summary style={styles.summary}>📄 View Raw JSON Response</summary>
                            <pre style={styles.pre}>
                                {JSON.stringify(response, null, 2)}
                            </pre>
                        </details>
                    </div>
                )}
            </div>
        </div>
    );
};

// Inline styles (same as before)
const styles: { [key: string]: React.CSSProperties } = {
    container: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '2rem',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    card: {
        maxWidth: '1000px',
        margin: '0 auto',
        background: 'white',
        borderRadius: '16px',
        padding: '2.5rem',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    },
    title: {
        margin: '0 0 0.5rem 0',
        color: '#1a202c',
        fontSize: '2rem',
    },
    subtitle: {
        color: '#718096',
        margin: '0 0 1rem 0',
    },
    debugInfo: {
        background: '#edf2f7',
        padding: '0.5rem 1rem',
        borderRadius: '4px',
        marginBottom: '1rem',
        fontSize: '0.875rem',
        color: '#4a5568',
        wordBreak: 'break-all',
    },
    buttonGroup: {
        display: 'flex',
        gap: '1rem',
        marginBottom: '1.5rem',
    },
    button: {
        padding: '1rem 2rem',
        borderRadius: '8px',
        fontWeight: 600,
        fontSize: '1rem',
        border: 'none',
        cursor: 'pointer',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        justifyContent: 'center',
    },
    buttonPrimary: {
        background: '#667eea',
        color: 'white',
        flex: 1,
    },
    buttonSecondary: {
        background: '#e2e8f0',
        color: '#2d3748',
    },
    buttonCopy: {
        background: '#4299e1',
        color: 'white',
    },
    buttonDisabled: {
        background: '#cbd5e0',
        cursor: 'not-allowed',
    },
    alertError: {
        background: '#fed7d7',
        color: '#742a2a',
        padding: '1rem 1.5rem',
        borderRadius: '8px',
        borderLeft: '4px solid #e53e3e',
        marginBottom: '1.5rem',
    },
    alertSuccess: {
        background: '#c6f6d5',
        color: '#22543d',
        padding: '1rem 1.5rem',
        borderRadius: '8px',
        borderLeft: '4px solid #38a169',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.5rem',
    },
    errorDetails: {
        marginTop: '0.5rem',
        fontSize: '0.875rem',
    },
    badge: {
        background: '#fbbf24',
        color: '#78350f',
        padding: '0.25rem 0.75rem',
        borderRadius: '12px',
        fontSize: '0.75rem',
        fontWeight: 700,
    },
    results: {
        animation: 'fadeIn 0.3s ease-in',
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem',
    },
    statCard: {
        background: '#f7fafc',
        padding: '1rem',
        borderRadius: '8px',
        borderLeft: '4px solid #667eea',
    },
    statLabel: {
        fontSize: '0.75rem',
        color: '#718096',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: '0.5rem',
    },
    statValue: {
        fontSize: '1.5rem',
        fontWeight: 700,
        color: '#2d3748',
    },
    section: {
        marginBottom: '1.5rem',
    },
    sectionTitle: {
        margin: '0 0 1rem 0',
        color: '#2d3748',
        fontSize: '1.25rem',
    },
    transportIds: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.5rem',
    },
    idBadge: {
        background: '#667eea',
        color: 'white',
        padding: '0.5rem 1rem',
        borderRadius: '6px',
        fontWeight: 600,
        fontSize: '0.875rem',
    },
    input: {
        width: '100%',
        padding: '0.75rem',
        border: '1px solid #cbd5e0',
        borderRadius: '6px',
        fontFamily: 'monospace',
        fontSize: '0.875rem',
    },
    tableWrapper: {
        overflowX: 'auto',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
    },
    th: {
        background: '#f7fafc',
        padding: '1rem',
        textAlign: 'left',
        fontWeight: 600,
        color: '#2d3748',
        borderBottom: '2px solid #e2e8f0',
    },
    td: {
        padding: '1rem',
        borderBottom: '1px solid #e2e8f0',
        color: '#4a5568',
    },
    trEven: {
        background: '#ffffff',
    },
    trOdd: {
        background: '#f7fafc',
    },
    typeBadge: {
        background: '#bee3f8',
        color: '#2c5282',
        padding: '0.25rem 0.75rem',
        borderRadius: '12px',
        fontSize: '0.75rem',
        fontWeight: 600,
    },
    statusBadge: {
        background: '#c6f6d5',
        color: '#22543d',
        padding: '0.25rem 0.75rem',
        borderRadius: '12px',
        fontSize: '0.75rem',
        fontWeight: 600,
    },
    details: {
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        overflow: 'hidden',
        marginTop: '1.5rem',
    },
    summary: {
        background: '#f7fafc',
        padding: '1rem',
        cursor: 'pointer',
        fontWeight: 600,
        color: '#2d3748',
        userSelect: 'none',
    },
    pre: {
        background: '#1a202c',
        color: '#68d391',
        padding: '1.5rem',
        margin: 0,
        overflowX: 'auto',
        fontSize: '0.875rem',
        lineHeight: 1.5,
    },
};

export default SimpleAPITest;