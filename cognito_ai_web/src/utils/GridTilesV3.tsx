import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const patternClass = "bg-[repeating-radial-gradient(circle,#faefcf0d,transparent_10px)] bg-[length:60px_60px]";
void patternClass;

type Props = {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    onClick?: React.MouseEventHandler<HTMLDivElement>;
    index?: number;
    dark?: number;
    GradientFlag?: boolean;
};

export default function GridTileV3({
                                       icon,
                                       title,
                                       subtitle,
                                       onClick,
                                       index = 0,
                                       dark = 0.3,
                                       GradientFlag = true,
                                   }: Props) {
    const navigate = useNavigate();
    void navigate;

    return (
        <motion.div
            initial={{ y: 45, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
                duration: 0.1,
                ease: [0.22, 1, 0.36, 1],
                delay: index * 0.09,
            }}
            whileHover="hover"
            whileTap="tap"
            onClick={onClick}
            variants={{
                rest: {
                    scale: 1,
                    boxShadow: "0 10px 20px rgba(0,0,0,0.2)",
                },
                hover: {
                    scale: 1.011,
                    boxShadow: `0 5px 10px rgba(0,0,0,0.1)`,
                    transition: { type: "tween", duration: 0.1 },
                },
                tap: { scale: 0.97 },
            }}
            className={`relative w-56 h-48 bg-white border p-4  border-[#e9e9e9]  hover:border-[#AA95FF] rounded-2xl overflow-hidden cursor-pointer transition-all duration-300`}
        >
            <div className=" flex items-center justify-center ">{icon}</div>
            <div className={`flex flex-col justify-center  pt-2.5`}>
                <h3 className=" font-semibold text-[#1A1A1A]">{title}</h3>
                <p className="text-xs  font-medium text-[#616161]">{subtitle}</p>
            </div>
        </motion.div>
    );
}
