import * as React from 'react';

const Dashboard = () => {
  // Placeholder stats and chart data
  return (
    <div className="flex flex-col gap-8 font-sans">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-md p-8 flex flex-col items-center border border-gray-100">
          <div className="text-4xl font-extrabold text-[#0275D8]">119</div>
          <div className="text-gray-500 mt-2 text-base font-medium">Total Analyses</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-8 flex flex-col items-center border border-gray-100">
          <div className="text-4xl font-extrabold text-[#28A745]">5</div>
          <div className="text-gray-500 mt-2 text-base font-medium">Baselines</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-8 flex flex-col items-center border border-gray-100">
          <div className="text-4xl font-extrabold text-[#D9534F]">2</div>
          <div className="text-gray-500 mt-2 text-base font-medium">Vulnerabilities</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-8 flex flex-col items-center border border-gray-100">
          <div className="text-4xl font-extrabold text-[#FFC107]">3</div>
          <div className="text-gray-500 mt-2 text-base font-medium">Alarms</div>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-md p-8 mt-4 border border-gray-100">
        <div className="font-semibold mb-4 text-lg text-[#232B3A]">Most Recent Analyses</div>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600 border-b">
              <th className="py-2">Date</th>
              <th className="py-2">File</th>
              <th className="py-2">Status</th>
              <th className="py-2">Severity</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b hover:bg-gray-50">
              <td className="py-2">2025-06-05</td>
              <td className="py-2">example.l5x</td>
              <td className="py-2">Complete</td>
              <td className="py-2 text-[#D9534F] font-bold">High</td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-2">2025-06-04</td>
              <td className="py-2">test.l5x</td>
              <td className="py-2">Complete</td>
              <td className="py-2 text-[#FFC107] font-bold">Medium</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
