import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';

const ConfigPage = () => {
  const [configData, setConfigData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useSelector(state => state.auth);

  useEffect(() => {
    const fetchConfigData = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get('/api/config', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setConfigData(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load system configuration');
      } finally {
        setLoading(false);
      }
    };

    fetchConfigData();
  }, [token]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">System Configuration</h1>
      
      {configData && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* App Info */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Application</h2>
            <div className="space-y-2">
              <p><span className="font-medium">Name:</span> {configData.app}</p>
              <p><span className="font-medium">Environment:</span> {configData.environment}</p>
              <p><span className="font-medium">Timestamp:</span> {new Date(configData.timestamp).toLocaleString()}</p>
            </div>
          </div>
          
          {/* Database Info */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Database</h2>
            <div className="space-y-2">
              <p>
                <span className="font-medium">Status:</span>
                <span className={`ml-2 px-2 py-1 rounded text-xs ${
                  configData.database.status === 'connected' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {configData.database.status}
                </span>
              </p>
              <p><span className="font-medium">Host:</span> {configData.database.host}</p>
              <p><span className="font-medium">Name:</span> {configData.database.name}</p>
              {configData.database.port && (
                <p><span className="font-medium">Port:</span> {configData.database.port}</p>
              )}
            </div>
          </div>
          
          {/* Statistics */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Statistics</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-blue-600">{configData.statistics.users}</div>
                <div className="text-sm text-gray-600">Users</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-green-600">{configData.statistics.courses}</div>
                <div className="text-sm text-gray-600">Courses</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-purple-600">{configData.statistics.enrollments}</div>
                <div className="text-sm text-gray-600">Enrollments</div>
              </div>
            </div>
          </div>
          
          {/* System Resources */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">System Resources</h2>
            <div className="space-y-2">
              <p><span className="font-medium">Uptime:</span> {configData.system.uptime}</p>
              <p><span className="font-medium">Server Uptime:</span> {configData.system.serverUptime}</p>
              <p><span className="font-medium">Platform:</span> {configData.system.systemInfo.platform}</p>
              <p><span className="font-medium">Architecture:</span> {configData.system.systemInfo.arch}</p>
              <p><span className="font-medium">Node Version:</span> {configData.system.systemInfo.nodeVersion}</p>
              <p><span className="font-medium">CPUs:</span> {configData.system.systemInfo.cpus}</p>
              <p><span className="font-medium">Memory (Total):</span> {configData.system.systemInfo.totalMemory}</p>
              <p><span className="font-medium">Memory (Free):</span> {configData.system.systemInfo.freeMemory}</p>
            </div>
          </div>
          
          {/* Memory Usage */}
          <div className="bg-white shadow rounded-lg p-6 md:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Memory Usage</h2>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500">RSS</h3>
                <p className="text-xl font-semibold">{configData.system.memory.rss}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500">Heap Total</h3>
                <p className="text-xl font-semibold">{configData.system.memory.heapTotal}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500">Heap Used</h3>
                <p className="text-xl font-semibold">{configData.system.memory.heapUsed}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500">External</h3>
                <p className="text-xl font-semibold">{configData.system.memory.external}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfigPage;
