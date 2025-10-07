import React from "react";

export default function PillTabs({ tabs, active, onChange }) {
  return (
    <div className="w-full bg-white rounded-xl shadow-sm border">
      <div className="grid grid-cols-3 text-center">
        {tabs.map((tab, idx) => {
          const isActive = active === idx;
          return (
            <button
              key={tab.key || idx}
              type="button"
              onClick={() => onChange(idx)}
              className={`py-3 text-sm md:text-base font-medium transition rounded-xl m-1 ${
                isActive
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-500 hover:text-gray-800"
              }`}
              role="tab"
              aria-selected={isActive}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
