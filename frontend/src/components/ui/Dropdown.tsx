"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface DropdownOption<T> {
  value: T;
  label: string;
}

interface DropdownProps<T> {
  value: T;
  onChange: (value: T) => void;
  options: DropdownOption<T>[];
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
}

export function Dropdown<T extends string | number>({
  value,
  onChange,
  options,
  className = "",
  triggerClassName = "",
  menuClassName = "",
}: DropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex w-full items-center justify-between gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition-all hover:border-veda-orange focus:border-veda-orange focus:outline-none ${triggerClassName}`}
      >
        <span className="truncate">{selectedOption?.label || value}</span>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className={`absolute left-0 right-0 mt-2 z-50 max-h-60 overflow-y-auto rounded-2xl border border-gray-100 bg-white py-1 shadow-lg scrollbar-thin ${menuClassName}`}>
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`block w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors ${
                value === opt.value ? "text-veda-orange bg-orange-50/25 font-semibold" : "text-gray-700"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
