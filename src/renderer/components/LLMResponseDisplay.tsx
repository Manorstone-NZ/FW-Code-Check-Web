import * as React from 'react';
import ReactMarkdown from './ReactMarkdownShim';

interface ThreatDetail {
  title: string;
  summary: string;
  source: string;
  affected_vendors: string[];
  threat_type: string;
  severity: string;
  protocols: string[];
  system_targets: string[];
  tags: string[];
}

interface LLMResponseDisplayProps {
  llmResponse: string;
}

const LLMResponseDisplay: React.FC<LLMResponseDisplayProps> = ({ llmResponse }) => {
  const [parsedData, setParsedData] = React.useState<ThreatDetail[] | null>(null);
  const [parseError, setParseError] = React.useState<string | null>(null);

  React.useEffect(() => {
    try {
      if (!llmResponse || llmResponse.trim() === '') {
        setParsedData(null);
        setParseError(null);
        return;
      }

      const parsed = JSON.parse(llmResponse);
      const dataArray = Array.isArray(parsed) ? parsed : [parsed];
      setParsedData(dataArray);
      setParseError(null);
    } catch (error) {
      setParseError('Raw response data');
      setParsedData(null);
    }
  }, [llmResponse]);

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getThreatTypeColor = (threatType: string) => {
    switch (threatType.toLowerCase()) {
      case 'malware': return 'bg-red-50 text-red-700 border-red-200';
      case 'ransomware': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'vulnerability': 
      case 'protocol vulnerability': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'zero-day exploit': return 'bg-red-50 text-red-700 border-red-200';
      case 'supply chain attack': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default: return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  if (parseError) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="text-sm text-gray-600 mb-2 font-medium">Raw Response Data:</div>
        <div className="text-sm text-gray-700 leading-6 whitespace-pre-wrap font-mono">
          {llmResponse}
        </div>
      </div>
    );
  }

  if (!parsedData || parsedData.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="text-sm text-gray-500 italic">No detailed analysis available</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {parsedData.map((threat, index) => (
        <div key={index} className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <div className="mb-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">{threat.title}</h4>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(threat.severity)}`}>
                {threat.severity}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getThreatTypeColor(threat.threat_type)}`}>
                {threat.threat_type}
              </span>
            </div>
          </div>

          <div className="prose prose-sm max-w-none mb-4">
            <ReactMarkdown>{threat.summary}</ReactMarkdown>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-semibold text-gray-700">Source:</span>
              <div className="text-gray-600 mt-1">{threat.source}</div>
            </div>
            
            <div>
              <span className="font-semibold text-gray-700">Affected Vendors:</span>
              <div className="text-gray-600 mt-1">
                {threat.affected_vendors && threat.affected_vendors.length > 0 
                  ? threat.affected_vendors.join(', ')
                  : 'Not specified'
                }
              </div>
            </div>

            <div>
              <span className="font-semibold text-gray-700">Protocols:</span>
              <div className="text-gray-600 mt-1">
                {threat.protocols && threat.protocols.length > 0 
                  ? threat.protocols.join(', ')
                  : 'Various protocols'
                }
              </div>
            </div>

            <div>
              <span className="font-semibold text-gray-700">System Targets:</span>
              <div className="text-gray-600 mt-1">
                {threat.system_targets && threat.system_targets.length > 0 
                  ? threat.system_targets.join(', ')
                  : 'Not specified'
                }
              </div>
            </div>
          </div>

          {threat.tags && threat.tags.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <span className="font-semibold text-gray-700 text-sm">Tags:</span>
              <div className="flex flex-wrap gap-1 mt-2">
                {threat.tags.map((tag, tagIndex) => (
                  <span
                    key={tagIndex}
                    className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default LLMResponseDisplay;
