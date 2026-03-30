import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

type Props = {
    step?: any;
    height?: string;
    children?: React.ReactNode;
};

export default function StepProgressbar({ step = '0/1', height = 'h-6' }: Props) {
    let currentStep = 0;
    let totalSteps = 1;

    try {
        const [curr, total] = step.split('/').map(Number);
        if (!Number.isNaN(curr) && !Number.isNaN(total) && total > 0) {
            currentStep = Math.max(0, Math.min(curr, total));
            totalSteps = total;
        }
    } catch {
        // defaults apply
    }

    const computedValue = (currentStep / totalSteps) * 100;
    const clampedValue = Math.min(Math.max(computedValue, 0), 100);

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
            <div className={`w-full bg-[#9aaeff] rounded-2xl overflow-hidden ${height}`}>
                <motion.div
                    className={`h-full ${
                        clampedValue === 100 ? 'bg-green-700' : 'bg-blue-700 bg-stripes bg-stripe-anim'
                    } rounded-2xl`}
                    initial={false}
                    animate={{ width: `${clampedValue}%` }}
                    transition={shouldAnimate ? { duration: 1, ease: 'easeInOut' } : { duration: 0 }}
                />
            </div>

            <div className="absolute -bottom-5 left-1 text-sm font-semibold text-gray-700">
                Step: {currentStep}/{totalSteps}
            </div>
        </div>
    );
}
