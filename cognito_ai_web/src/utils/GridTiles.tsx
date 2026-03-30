import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type Props = {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    route?: string;
    onClick: () => void;
    index?: number;
    gradientOpacity?: number;
    dark?: number;
    GradientFlag?: boolean;
    children?: React.ReactNode;
};

const gradients = [
    'from-purple-500 via-pink-500 to-red-500',
    'from-green-400 via-blue-500 to-purple-600',
    'from-orange-400 via-rose-500 to-pink-500',
    'from-cyan-500 via-blue-500 to-indigo-600',
    'from-yellow-400 via-red-500 to-pink-500',
    'from-teal-400 via-blue-500 to-indigo-600',
    'from-indigo-500 via-sky-500 to-teal-400',
    'from-fuchsia-500 via-pink-600 to-rose-500',
    'from-lime-400 via-emerald-500 to-green-600',
    'from-amber-400 via-yellow-500 to-orange-500',
    'from-rose-400 via-red-500 to-pink-500',
    'from-violet-500 via-indigo-500 to-blue-500',
    'from-sky-400 via-blue-500 to-indigo-600',
    'from-zinc-500 via-neutral-600 to-stone-700',
    'from-emerald-400 via-teal-500 to-green-600',
    'from-red-400 via-pink-500 to-purple-600',
    'from-blue-400 via-sky-500 to-indigo-600',
    'from-amber-500 via-orange-500 to-red-500',
    'from-lime-400 via-yellow-500 to-amber-600',
    'from-teal-500 via-green-500 to-lime-500',
    'from-rose-500 via-fuchsia-500 to-pink-600',
    'from-indigo-600 via-purple-600 to-pink-600',
    'from-stone-400 via-gray-500 to-neutral-600',
    'from-blue-600 via-indigo-600 to-purple-700',
    'from-cyan-400 via-teal-500 to-green-500',
] as const;

const patternClass = 'bg-[repeating-radial-gradient(circle,#faefcf0d,transparent_10px)] bg-[length:60px_60px]';

export default function GridTile({
                                     icon,
                                     title,
                                     subtitle,
                                     route,
                                     onClick,
                                     index = 0,
                                     gradientOpacity = 1,
                                     dark = 0.3,
                                     GradientFlag = true,
                                 }: Props) {
    const navigate = useNavigate();
    const gradient = gradients[index % gradients.length];

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
                    boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
                },
                hover: {
                    scale: 1.025,
                    boxShadow: `0 12px 24px rgba(0,0,0,0.3)`,
                    transition: { type: 'tween', duration: 0.1 },
                },
                tap: { scale: 0.97 },
            }}
            className={`relative flex w-full h-32 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 ${
                !GradientFlag ? 'bg-white' : ''
            }`}
        >
            {GradientFlag && (
                <div
                    className={`absolute inset-0 bg-gradient-to-r ${gradient} z-0 pointer-events-none`}
                    style={{ opacity: gradientOpacity }}
                />
            )}

            {dark > 0 && GradientFlag && (
                <div
                    className="absolute inset-0 bg-black z-10 pointer-events-none"
                    style={{ opacity: Math.max(0.1, Math.min(dark, 1)) }}
                />
            )}

            <motion.div
                className={`absolute inset-0 ${patternClass} opacity-80 pointer-events-none z-20`}
                variants={{
                    rest: { backgroundPosition: '0px 0px' },
                    hover: {
                        backgroundPosition: '40px 40px',
                        transition: { duration: 2, ease: 'easeInOut' },
                    },
                }}
            />
            <div className="w-1/4 flex items-center justify-center z-30">{icon}</div>
            <div className={`flex flex-col justify-center w-3/4 pr-4 z-30 ${GradientFlag ? 'text-white' : 'text-black'}`}>
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="text-sm opacity-90">{subtitle}</p>
            </div>
            <motion.div
                className={`absolute bottom-3 right-3 z-30 ${GradientFlag ? 'text-white' : 'text-black'}`}
                variants={{
                    rest: { x: 0, opacity: 0.8 },
                    hover: {
                        x: 6,
                        opacity: 1,
                        transition: { type: 'spring', stiffness: 300 },
                    },
                }}
            >
                <ArrowRight size={20} />
            </motion.div>
        </motion.div>
    );
}
