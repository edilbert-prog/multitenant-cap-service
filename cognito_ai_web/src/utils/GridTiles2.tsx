import { motion } from 'framer-motion';
import {
    FaPlay,
    FaCheckCircle,
    FaFileAlt,
    FaExchangeAlt,
    FaBalanceScale,
    FaAngleRight
} from 'react-icons/fa';
import React from 'react';

interface Tile {
    title: string;
    icon: React.ReactNode;
    position: string;
}

const tiles: Tile[] = [
    {
        title: 'Execution Component',
        icon: <FaPlay />,
        position: 'row-start-1 col-start-1'
    },
    {
        title: 'Data Conversion',
        icon: <FaExchangeAlt />,
        position: 'row-start-2 col-start-1'
    },
    {
        title: 'Validation Component',
        icon: <FaCheckCircle />,
        position: 'row-start-1 row-span-2 col-start-2'
    },
    {
        title: 'Test Cases',
        icon: <FaFileAlt />,
        position: 'row-start-1 col-start-3'
    },
    {
        title: 'Comparators',
        icon: <FaBalanceScale />,
        position: 'row-start-2 col-start-3'
    }
];

const tileVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 }
};

type Props = {
    borderColor?: string;
    textColor?: string;
    children?: React.ReactNode;
};

export default function GridTiles2({
                                       borderColor = '#e7e7e7',
                                       textColor = 'text-[#007f00]'
                                   }: Props) {
    return (
        <div className="h-full flex items-center justify-center  p-6">
            <div className="grid grid-cols-3 grid-rows-2 gap-4 max-w-5xl w-full">
                {tiles.map((tile, index) => (
                    <motion.div
                        key={index}
                        className={`group relative bg-white flex flex-col items-center justify-center p-9 rounded-xl text-center text-lg font-medium ${textColor} ${tile.position} 
                                    shadow-md shadow-gray-200 
                                    hover:shadow-lg hover:scale-105 transition-all duration-300 ease-in-out cursor-pointer`}
                        style={{
                            border: `1px solid ${borderColor}`,
                            minHeight: tile.title === 'Validation Component' ? '100%' : '150px'
                        }}
                        variants={tileVariants}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: index * 0.1 }}
                    >
                        <div className="text-3xl mb-2">{tile.icon}</div>
                        <div>{tile.title}</div>

                        <div className="absolute bottom-3 right-3 text-lg text-gray-700 opacity-80 transition-transform duration-300 ease-in-out group-hover:translate-x-1">
                            <FaAngleRight />
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
