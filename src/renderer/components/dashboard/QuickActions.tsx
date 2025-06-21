import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  DocumentArrowUpIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

interface QuickAction {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  onClick: () => void;
  color: string;
  disabled?: boolean;
}

const QuickActions: React.FC = () => {
  const navigate = useNavigate();

  const quickActions: QuickAction[] = [
    {
      id: 'upload-file',
      name: 'Upload PLC File',
      description: 'Analyze new PLC code file',
      icon: DocumentArrowUpIcon,
      onClick: () => navigate('/upload'),
      color: 'text-blue-600 hover:text-blue-700',
    },
    {
      id: 'create-baseline',
      name: 'Create Baseline',
      description: 'Establish security baseline',
      icon: PlusIcon,
      onClick: () => navigate('/baselines'),
      color: 'text-green-600 hover:text-green-700',
    },
    {
      id: 'run-comparison',
      name: 'Run Comparison',
      description: 'Compare analysis to baseline',
      icon: ChartBarIcon,
      onClick: () => navigate('/comparisons'),
      color: 'text-purple-600 hover:text-purple-700',
    },
    {
      id: 'view-threat-intel',
      name: 'Threat Intelligence',
      description: 'Browse OT security threats',
      icon: DocumentTextIcon,
      onClick: () => navigate('/ot-threat-intel'),
      color: 'text-orange-600 hover:text-orange-700',
    },
    {
      id: 'sync-threats',
      name: 'Sync Threats',
      description: 'Update threat database',
      icon: ArrowPathIcon,
      onClick: () => {
        // @ts-ignore
        window.electron?.invoke('bulk-ot-threat-intel');
      },
      color: 'text-indigo-600 hover:text-indigo-700',
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h3>
        
        <div className="space-y-3">
          {quickActions.map((action) => {
            const IconComponent = action.icon;
            
            return (
              <button
                key={action.id}
                onClick={action.onClick}
                disabled={action.disabled}
                className={`
                  w-full flex items-center p-3 rounded-lg border border-gray-200 
                  hover:border-gray-300 hover:shadow-sm transition-all duration-200
                  ${action.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  group
                `}
              >
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-lg bg-gray-50 
                  group-hover:bg-gray-100 transition-colors
                  ${action.disabled ? '' : action.color}
                `}>
                  <IconComponent className="w-5 h-5" />
                </div>
                
                <div className="ml-4 flex-1 text-left">
                  <div className="text-sm font-medium text-gray-900">
                    {action.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {action.description}
                  </div>
                </div>
                
                <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            );
          })}
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            Need help? <button className="text-blue-600 hover:text-blue-700 underline">View Documentation</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickActions;
