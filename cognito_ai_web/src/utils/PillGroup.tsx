import React from "react";

type PillItem = {
  key: string | number;
  label: React.ReactNode;
};

type PillGroupProps = {
  items?: ReadonlyArray<PillItem>;
  onClick?: (item: any) => void;
  primaryKey?: string | number;
  textSize?: string;
  children?: React.ReactNode;
};

export default function PillGroup({
                                    items = [],
                                    onClick = () => {},
                                    primaryKey = "",
                                    textSize = "",
                                  }: PillGroupProps) {
  return (
      <div className="flex flex-wrap gap-2 p-0">
        {items.map((item, index) => {
          const isPrimary = item.key === primaryKey;

          return (
              <button
                  key={item.key || index}
                  onClick={() => onClick(item)}
                  className={`px-5 py-1 cursor-pointer text-[0.89rem] rounded-full ${textSize?textSize:''}   transition
              ${isPrimary
                      ? 'bg-[#0071E9] text-gray-200  font-semibold'
                      : 'border border-[#0071E9] font-medium text-[#0071E9] hover:bg-gray-100'}`}
              >
                  {item.label}
              </button>
          );
        })}
      </div>
  );
}
