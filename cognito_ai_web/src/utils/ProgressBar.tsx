import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

type Props = {
    value?: number;
    label?: string;
    height?: string;
    showPercentage?: boolean;
};

export default function ProgressBar({
                                        value = 0,
                                        label = "Progress",
                                        height = "h-6",
                                        showPercentage = true,
                                    }: Props) {
    const clampedValue = Math.min(Math.max(value, 0), 100);

    const [shouldAnimate, setShouldAnimate] = useState<boolean>(false);
    const prevValueRef = useRef<number>(clampedValue);
    const isFirstRender = useRef<boolean>(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        if (clampedValue !== prevValueRef.current) {
            setShouldAnimate(true);
        } else {
            setShouldAnimate(false);
        }

        prevValueRef.current = clampedValue;
    }, [clampedValue]);

    return (
        <div className="w-full space-y-1 relative">
            <div
                className={`w-full bg-[#9aaeff] rounded-2xl overflow-hidden ${height}`}
            >
                <motion.div
                    className={`h-full ${
                        clampedValue === 100
                            ? "bg-green-700"
                            : "bg-blue-700 bg-stripes bg-stripe-anim"
                    } rounded-2xl`}
                    initial={false}
                    animate={{ width: `${clampedValue}%` }}
                    transition={
                        shouldAnimate ? { duration: 1, ease: "easeInOut" } : { duration: 0 }
                    }
                />
            </div>

            {showPercentage && (
                <div className="absolute -bottom-5 left-1 text-sm font-semibold text-gray-700">
                    {clampedValue}% Step: 3/3
                </div>
            )}
        </div>
    );
}
