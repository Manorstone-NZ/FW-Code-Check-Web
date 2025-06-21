import React from 'react';

const SectionCard = ({ title, children, highlight, noPadding }: { title: string; children: React.ReactNode; highlight?: boolean; noPadding?: boolean }) => (
  <div className={`bg-white rounded-xl shadow-md border ${highlight ? 'border-[#D9534F]' : 'border-gray-200'} mb-6 p-6`}>
    <div className={`font-bold text-xl mb-3 flex items-center gap-2 ${highlight ? 'text-[#D9534F]' : 'text-[#232B3A]'}`}>
      <span>{title}</span>
    </div>
    <div className="text-gray-700 whitespace-pre-line text-base">{children}</div>
  </div>
);

export default SectionCard;
