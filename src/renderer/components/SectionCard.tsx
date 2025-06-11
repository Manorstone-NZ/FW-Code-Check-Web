import React from 'react';

const SectionCard = ({ title, children, highlight }: { title: string; children: React.ReactNode; highlight?: boolean }) => (
  <div className={`bg-white rounded-xl shadow-md p-6 border ${highlight ? 'border-[#D9534F]' : 'border-gray-100'} mb-4`}>
    <div className={`font-bold text-lg mb-2 ${highlight ? 'text-[#D9534F]' : 'text-[#232B3A]'}`}>{title}</div>
    <div className="text-gray-700 whitespace-pre-line text-base">{children}</div>
  </div>
);

export default SectionCard;
