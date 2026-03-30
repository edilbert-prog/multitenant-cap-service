import React from "react";

type ErrorScreenProps = {
    message?: string;
    children?: React.ReactNode;
};

export default function ErrorScreen({
                                        message = "Something went wrong.",
                                    }: ErrorScreenProps) {
    return (
        <div className="flex flex-col justify-center items-center h-40 text-red-600">
            <svg
                className="w-8 h-8 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
            </svg>
            <p className="text-center font-medium">{message}</p>
        </div>
    );
}
