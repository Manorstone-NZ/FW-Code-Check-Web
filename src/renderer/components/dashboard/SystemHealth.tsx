import * as React from 'react';

interface SystemHealthProps {}

const SystemHealth: React.FC<SystemHealthProps> = () => {
  const [services, setServices] = React.useState([
    { 
      name: 'LLM Services', 
      status: 'up' as 'up' | 'down' | 'degraded', 
      responseTime: 120,
      label: 'AI',
      lastChecked: new Date().toISOString()
    },
    { 
      name: 'Database', 
      status: 'up' as 'up' | 'down' | 'degraded', 
      responseTime: 5,
      label: 'DB',
      lastChecked: new Date().toISOString()
    },
    { 
      name: 'File System', 
      status: 'up' as 'up' | 'down' | 'degraded', 
      responseTime: 10,
      label: 'FS',
      lastChecked: new Date().toISOString()
    },
    { 
      name: 'Network', 
      status: 'up' as 'up' | 'down' | 'degraded', 
      responseTime: 25,
      label: 'NET',
      lastChecked: new Date().toISOString()
    },
  ]);

  const overallStatus = services.every(s => s.status === 'up') ? 'healthy' : 
                      services.some(s => s.status === 'down') ? 'critical' : 'warning';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-50 border-green-200 text-green-800';
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'critical': return 'bg-red-50 border-red-200 text-red-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getServiceStatusColor = (status: string) => {
    switch (status) {
      case 'up': return 'text-green-500';
      case 'down': return 'text-red-500';
      case 'degraded': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  // Auto-check services (mock implementation)
  React.useEffect(() => {
    const interval = setInterval(() => {
      // In a real implementation, you'd check actual service health here
      setServices(prev => prev.map(service => ({
        ...service,
        lastChecked: new Date().toISOString(),
        responseTime: Math.floor(Math.random() * 200) + 5, // Random response time
      })));
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (overallStatus === 'healthy') {
    return null; // Don't show banner if everything is healthy
  }

  return (
    <div className={`rounded-lg border-2 p-4 ${getStatusColor(overallStatus)}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            {overallStatus === 'critical' ? (
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            ) : (
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
            )}
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium">
              System Status: {overallStatus === 'critical' ? 'Issues Detected' : 'Degraded Performance'}
            </h3>
            <div className="mt-1 text-xs">
              Some services are experiencing issues. Please check individual service status.
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {services.map((service) => {
            return (            <div key={service.name} className="flex items-center space-x-1" title={`${service.name}: ${service.status}`}>
              <span className={`text-sm font-bold ${getServiceStatusColor(service.status)}`}>{service.label}</span>
              <span className="text-xs">{service.responseTime}ms</span>
            </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SystemHealth;
