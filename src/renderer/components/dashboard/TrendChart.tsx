import * as React from 'react';

interface TrendChartProps {
  data: any[];
  timeRange: '24h' | '7d' | '30d';
  height?: number;
}

const TrendChart: React.FC<TrendChartProps> = ({ data, timeRange, height = 200 }) => {
  // This is a simplified version - in production you'd use a proper charting library like Chart.js or D3
  const chartData = React.useMemo(() => {
    // Group data by time periods
    const now = new Date();
    const timeRangeMs = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    }[timeRange];

    const periods = timeRange === '24h' ? 24 : timeRange === '7d' ? 7 : 30;
    const periodMs = timeRangeMs / periods;
    
    const buckets = Array.from({ length: periods }, (_, i) => {
      const bucketStart = now.getTime() - (periods - i) * periodMs;
      const bucketEnd = bucketStart + periodMs;
      
      const bucketData = data.filter(item => {
        const itemTime = new Date(item.date).getTime();
        return itemTime >= bucketStart && itemTime < bucketEnd;
      });
      
      return {
        period: i,
        count: bucketData.length,
        timestamp: new Date(bucketStart).toISOString(),
      };
    });
    
    return buckets;
  }, [data, timeRange]);

  const maxCount = Math.max(...chartData.map(d => d.count), 1);

  return (
    <div className="w-full" style={{ height }}>
      <div className="flex items-end justify-between h-full space-x-1">
        {chartData.map((bucket, index) => (
          <div
            key={index}
            className="flex-1 bg-blue-200 hover:bg-blue-300 transition-colors rounded-t"
            style={{
              height: `${(bucket.count / maxCount) * 100}%`,
              minHeight: bucket.count > 0 ? '2px' : '0',
            }}
            title={`${bucket.count} analyses at ${new Date(bucket.timestamp).toLocaleString()}`}
          />
        ))}
      </div>
      
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        <span>
          {timeRange === '24h' ? '24h ago' : 
           timeRange === '7d' ? '7d ago' : '30d ago'}
        </span>
        <span>Now</span>
      </div>
    </div>
  );
};

export default TrendChart;
