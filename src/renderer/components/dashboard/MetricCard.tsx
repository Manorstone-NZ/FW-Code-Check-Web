import * as React from 'react';
import { DashboardMetric } from '../../../types/core';

interface MetricCardProps {
  metric: DashboardMetric;
  onClick?: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({ metric, onClick }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <span className="text-green-600 font-medium text-sm px-2 py-1 bg-green-50 rounded">Good</span>;
      case 'warning': return <span className="text-yellow-600 font-medium text-sm px-2 py-1 bg-yellow-50 rounded">Warning</span>;
      case 'critical': return <span className="text-red-600 font-medium text-sm px-2 py-1 bg-red-50 rounded">Critical</span>;
      default: return null;
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
        bg-white rounded-lg shadow-sm border-2 transition-all duration-200 hover:shadow-md
        ${getStatusColor(metric.status)}
        ${onClick ? 'cursor-pointer hover:scale-105' : ''}
      `}
      onClick={onClick}
    >
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {getStatusIcon(metric.status)}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">{metric.name}</p>
            </div>
          </div>
        </div>
        
        <div className="mt-4">
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
        
        {metric.trend && metric.trend.length > 0 && (
          <div className="mt-4 h-8">
            {/* Simple sparkline could go here */}
            <div className="text-xs text-gray-400">Trend data available</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricCard;
