import React from 'react';

interface SpinnerV2Props {
    size?: number;
    strokeWidth?: number;
    colors?: [string, string, string];
    label?: string;
    children?: React.ReactNode;
    text?: string
}

export default function SpinnerV2({
                                      size = 48,
                                      strokeWidth = 8,
                                      colors = ["#0071E9", "#00e104", "#f400e8"],
                                      label = "",
                                  }: SpinnerV2Props){
    return (
        <div className="flex flex-col items-center justify-center">
            <svg
                width={size}
                height={size}
                viewBox="0 0 100 100"
                className="animate-spin"
                style={{ animationDuration: '1.2s' }}
            >
                <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                >
                    <animate
                        attributeName="stroke"
                        values={`${colors[0]};${colors[1]};${colors[2]};${colors[0]}`}
                        dur="1.5s"
                        repeatCount="indefinite"
                    />
                    <animate
                        attributeName="stroke-dasharray"
                        values="62.83 188.5;201.06 50.27;62.83 188.5"
                        dur="1.5s"
                        repeatCount="indefinite"
                    />
                    <animate
                        attributeName="stroke-dashoffset"
                        values="0;-251.33"
                        dur="1.5s"
                        repeatCount="indefinite"
                    />
                </circle>
            </svg>
            {label && <span className="mt-2 text-sm text-gray-600">{label}</span>}
        </div>
    );
}
