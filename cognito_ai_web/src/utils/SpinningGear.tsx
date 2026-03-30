import React from 'react';
import { Settings } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
    size?: number;
    className?: string;
    children?: React.ReactNode;
}

export default function SpinningGear(props: Props) {
    const { size = 16, className = '' } = props;

    return (
        <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 5, ease: 'linear' }}
            style={{ display: 'inline-block' }}
        >
            <Settings size={size} className={className} strokeWidth={2} />
        </motion.div>
    );
}
