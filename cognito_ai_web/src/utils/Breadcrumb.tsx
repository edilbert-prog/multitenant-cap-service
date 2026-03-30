import React from "react";

type BreadcrumbItem = {
    id: string | number;
    label: React.ReactNode;
    icon?: React.ReactNode;
    show?: boolean;
};

type BreadcrumbProps = {
    data: ReadonlyArray<BreadcrumbItem>;
    activeItem: string | number;
    onItemClick: (id:  any) => void;
    children?: React.ReactNode;
};

export default function Breadcrumb({ data, activeItem, onItemClick }: BreadcrumbProps) {
    return (
        <nav
            className="flex items-center text-sm text-gray-600"
            aria-label="Breadcrumb"
        >
            {data.map((item, index) => {
                if (!item.show) return null;

                const isActive = item.id === activeItem;

                return (
                    <div key={item.id} className="flex items-center">
                        {index !== 0 && <span className="mx-2 text-gray-400">/</span>}
                        <button
                            onClick={isActive ? undefined : () => onItemClick(item.id)}
                            className={`flex items-center gap-1 cursor-pointer ${
                                isActive
                                    ? "text-blue-600 font-medium"
                                    : "hover:text-blue-500"
                            }`}
                        >
                            {item.icon && <span className="text-lg">{item.icon}</span>}
                            <span>{item.label}</span>
                        </button>
                    </div>
                );
            })}
        </nav>
    );
}
