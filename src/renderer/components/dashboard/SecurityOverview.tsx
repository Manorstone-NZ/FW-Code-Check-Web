import * as React from 'react';

interface SecurityOverviewProps {
  distribution: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  timeRange: string;
}

const SecurityOverview: React.FC<SecurityOverviewProps> = ({ distribution, timeRange }) => {
  const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
  
  const severityConfig = [
    { key: 'critical', label: 'Critical', color: 'bg-red-500', textColor: 'text-red-700' },
    { key: 'high', label: 'High', color: 'bg-orange-500', textColor: 'text-orange-700' },
    { key: 'medium', label: 'Medium', color: 'bg-yellow-500', textColor: 'text-yellow-700' },
    { key: 'low', label: 'Low', color: 'bg-green-500', textColor: 'text-green-700' },
  ];

  const getPercentage = (count: number) => {
    return total > 0 ? (count / total) * 100 : 0;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Security Overview</h3>
          <div className="flex items-center text-sm text-gray-500">
            Security | Last {timeRange}
          </div>
        </div>

        {total === 0 ? (
          <div className="text-center py-8">
            <div className="text-green-600 text-2xl font-bold mb-4">SECURE</div>
            <p className="text-gray-600">No security issues detected</p>
          </div>
        ) : (
          <>
            {/* Severity Distribution Bar */}
            <div className="mb-6">
              <div className="flex h-4 bg-gray-200 rounded-full overflow-hidden">
                {severityConfig.map((severity) => (
                  <div
                    key={severity.key}
                    className={severity.color}
                    style={{ width: `${getPercentage(distribution[severity.key as keyof typeof distribution])}%` }}
                    title={`${severity.label}: ${distribution[severity.key as keyof typeof distribution]} (${getPercentage(distribution[severity.key as keyof typeof distribution]).toFixed(1)}%)`}
                  />
                ))}
              </div>
            </div>

            {/* Severity Breakdown */}
            <div className="grid grid-cols-2 gap-4">
              {severityConfig.map((severity) => {
                const count = distribution[severity.key as keyof typeof distribution];
                const percentage = getPercentage(count);
                
                return (
                  <div key={severity.key} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full ${severity.color} mr-3`} />
                      <span className="text-sm font-medium text-gray-700">{severity.label}</span>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-semibold ${severity.textColor}`}>{count}</div>
                      <div className="text-xs text-gray-500">{percentage.toFixed(1)}%</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary Stats */}
            <div className="mt-6 grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{total}</div>
                <div className="text-sm text-gray-500">Total Analyses</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {distribution.critical + distribution.high}
                </div>
                <div className="text-sm text-gray-500">High Priority</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {total > 0 ? ((distribution.low / total) * 100).toFixed(0) : 0}%
                </div>
                <div className="text-sm text-gray-500">Low Risk</div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SecurityOverview;
