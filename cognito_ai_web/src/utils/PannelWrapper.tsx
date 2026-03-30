import React from "react";
import { motion, type Variants } from "framer-motion";

const anim: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number = 0) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.2, duration: 0.6 },
    }),
};

type Props = {
    className?: string;
    id?: number;
    children?: React.ReactNode;
};


export default function PannelWrapper({ className = "", id = 0, children }: Props) {
    return (
        <motion.div
            className={className}
            variants={anim}
            initial="hidden"
            animate="visible"
            custom={id}
        >
            {children}
        </motion.div>
    );
}
