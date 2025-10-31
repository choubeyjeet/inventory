import React from "react";
import { FaSearch } from "react-icons/fa";
import { IoIosClose } from "react-icons/io";

export default function SearchBar({ value, setQuery, onChange, placeholder = "Search..." }) {
  return (
    <div className="mt-3 flex items-center justify-end mb-3 w-full">
      <div className="relative w-full sm:max-w-xs">
        {value && (
          <IoIosClose
            size={24}
            onClick={() => setQuery("")}
            className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
          />
        )}
        <input
          type="text"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg shadow-sm 
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     text-sm sm:text-base"
        />
        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
      </div>
    </div>
  );
}
