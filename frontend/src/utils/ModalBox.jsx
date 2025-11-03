import React from 'react'

export default function ModalBox({ title, children, onClose }) {
  return (
   <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-neutral-lightCard dark:bg-neutral-darkCard text-neutral-lightText dark:text-neutral-darkText rounded-xl shadow-lg w-full max-w-md sm:max-w-lg p-6 relative">
        <h2 className="text-lg sm:text-xl font-semibold mb-4">{title}</h2>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-secondary hover:text-danger transition"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  )
}
