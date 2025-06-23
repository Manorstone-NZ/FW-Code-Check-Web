import * as React from 'react';
import { DashboardMetric } from '../../../types/core';

interface MetricCardProps {
  metric: DashboardMetric;
  onClick?: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({ metric, onClick }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-gray-900 bg-white border-gray-200';
      case 'warning': return 'text-gray-900 bg-white border-yellow-300';
      case 'critical': return 'text-gray-900 bg-white border-red-300';
      default: return 'text-gray-900 bg-white border-gray-200';
    }
  };

  const getChangeIcon = (changeType: string) => {
    if (changeType === 'increase') {
      return <span className="text-green-500 font-medium text-sm px-2 py-1 bg-green-50 rounded">Up</span>;
    }
    if (changeType === 'decrease') {
      return <span className="text-red-500 font-medium text-sm px-2 py-1 bg-red-50 rounded">Down</span>;
    }
    return null;
  };

  return (
    <div
      className={`
        bg-white rounded-lg shadow-sm border transition-all duration-200 hover:shadow-md
        ${getStatusColor(metric.status)}
        ${onClick ? 'cursor-pointer hover:scale-105' : ''}
      `}
      onClick={onClick}
    >
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-2">{metric.name}</p>
            <div className="flex items-baseline">
              <p className="text-2xl font-semibold text-gray-900">
                {metric.value}
                {metric.unit && <span className="text-sm ml-1">{metric.unit}</span>}
              </p>
              
              {metric.change !== undefined && (
                <div className="ml-2 flex items-center">
                  {getChangeIcon(metric.changeType)}
                  <span className={`text-sm font-medium ml-1 ${
                    metric.changeType === 'increase' ? 'text-green-600' : 
                    metric.changeType === 'decrease' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {Math.abs(metric.change)}
                  </span>
                </div>
              )}
            </div>
            
            {metric.previousValue !== undefined && (
              <p className="text-xs text-gray-500 mt-1">
                Previous: {metric.previousValue}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricCard;
