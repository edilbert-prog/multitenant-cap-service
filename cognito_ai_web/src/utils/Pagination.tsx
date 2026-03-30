import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type PaginationProps = {
  total: number;
  pageSize?: number;
  current?: number;
  onChange?: (page: number, pageSize: number) => void;
  showSizeChanger?: boolean;
  pageSizeOptions?: number[];
  children?: React.ReactNode;
};

export default function Pagination({
                                     total,
                                     pageSize = 10,
                                     current = 1,
                                     onChange,
                                     showSizeChanger = false,
                                     pageSizeOptions = [10, 20, 50, 100],
                                   }: PaginationProps) {
  const [page, setPage] = useState<number>(current);
  const [size, setSize] = useState<number>(pageSize);
  const [inputValue, setInputValue] = useState<string>("");

  const totalPages = Math.ceil(total / size);

  useEffect(() => {
    setPage(current);
    setInputValue("");
  }, [current]);

  const changePage = (newPage: number): void => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    setInputValue("");
    onChange?.(newPage, size);
  };

  const changeSize = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    const newSize = parseInt(e.target.value, 10);
    const newPage = 1;
    setSize(newSize);
    setPage(newPage);
    setInputValue("");
    onChange?.(newPage, newSize);
  };

  const handleGoInput = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setInputValue(e.target.value);
  };

  const submitGoTo = (): void => {
    const num = parseInt(inputValue, 10);
    if (!isNaN(num) && num >= 1 && num <= totalPages) {
      changePage(num);
    } else {
      setInputValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter") {
      submitGoTo();
    }
  };

  const createBtn = (p: number): React.ReactNode => (
      <button
          key={p}
          onClick={() => changePage(p)}
          className={`px-4 py-1.5 cursor-pointer ${
              page === p
                  ? "bg-[#D0E8FB] rounded-md border text-black font-medium border-[#D0E8FB]"
                  : "hover:bg-gray-100"
          }`}
      >
        {p}
      </button>
  );

  const renderPageNumbers = (): React.ReactNode[] => {
    const pages: React.ReactNode[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(createBtn(i));
    } else {
      if (page <= 5) {
        for (let i = 1; i <= 5; i++) pages.push(createBtn(i));
        pages.push(<span key="ellipsis-right">...</span>);
        pages.push(createBtn(totalPages));
      } else if (page > 5 && page < totalPages - 3) {
        pages.push(createBtn(1));
        pages.push(<span key="ellipsis-left">...</span>);
        for (let i = page - 1; i <= page + 2 && i < totalPages; i++) {
          pages.push(createBtn(i));
        }
        pages.push(<span key="ellipsis-right">...</span>);
        pages.push(createBtn(totalPages));
      } else {
        pages.push(createBtn(1));
        pages.push(<span key="ellipsis-left">...</span>);
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(createBtn(i));
        }
      }
    }

    return pages;
  };

  return (
      <div className="flex items-center gap-2 flex-wrap">
        <button
            onClick={() => changePage(page - 1)}
            disabled={page === 1}
            className="px-3 py-1 cursor-pointer hover:bg-gray-100 disabled:opacity-50"
        >
          <ChevronLeft />
        </button>

        {renderPageNumbers()}

        <button
            onClick={() => changePage(page + 1)}
            disabled={page === totalPages}
            className="px-3 py-1 cursor-pointer hover:bg-gray-100 disabled:opacity-50"
        >
          <ChevronRight />
        </button>

        {showSizeChanger && (
            <select
                value={size}
                onChange={changeSize}
                className="ml-4 px-2 py-1 border rounded"
            >
              {pageSizeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt} / page
                  </option>
              ))}
            </select>
        )}

        <div className="flex items-center gap-1 ml-4">
          <span>Go to</span>
          <input
              type="number"
              placeholder=""
              value={inputValue}
              onChange={handleGoInput}
              onBlur={submitGoTo}
              onKeyDown={handleKeyDown}
              className="w-16 px-2 py-1 outline-0 border border-gray-400 rounded-md"
          />
        </div>
      </div>
  );
}
