import React, { useState, useEffect } from 'react';
import { Database, Server, CheckCircle2, AlertTriangle, Code, Copy, RefreshCw, Key } from 'lucide-react';
import { reportsApi } from '../api/client';
import { useToast } from '../context/ToastContext';

export const DatabasePage: React.FC = () => {
  const { success } = useToast();
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSqlSchema, setShowSqlSchema] = useState(false);

  const loadStatus = async () => {
    setIsLoading(true);
    try {
      const res = await reportsApi.getDatabaseStatus();
      setDbStatus(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    success('Copied to clipboard!');
  };

  const envSample = `# MySQL Database Connection Configuration
DB_HOST="localhost"
DB_PORT=3306
DB_USER="stitch_admin"
DB_PASSWORD="your_strong_password"
DB_NAME="stitch_pim"

# API Base URL (default is /api)
VITE_API_BASE_URL="/api"`;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-[#2A201A]">Database Engine & Backend Architecture</h2>
        <p className="text-xs text-[#6B5B52]">
          MySQL 8.0 schema status, table statistics, and environment variable configuration
        </p>
      </div>

      {/* Engine Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Card 1: Active Database Engine */}
        <div className="bg-[#FFFDF8] border border-[#E5DBCE] rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5DBCE] pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-[#49382F] text-white rounded-lg">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-[#2A201A]">Active Storage Engine</h3>
                <p className="text-xs text-[#6B5B52]">{dbStatus?.engine || 'Checking...'}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-semibold">
              {dbStatus?.is_live_mysql ? (
                <span className="text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Live MySQL Instance</span>
                </span>
              ) : (
                <span className="text-[#80634D] flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Resilient Local Store Active</span>
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2 text-xs text-[#6B5B52]">
            <div className="flex justify-between py-1 border-b border-[#E5DBCE]/40">
              <span>Database Name:</span>
              <strong className="font-mono text-[#2A201A]">{dbStatus?.database || 'stitch_pim'}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-[#E5DBCE]/40">
              <span>Host Address:</span>
              <span className="font-mono text-[#2A201A]">{dbStatus?.host || 'localhost'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#E5DBCE]/40">
              <span>Schema Script:</span>
              <span className="font-mono text-[#80634D]">/database/schema.sql</span>
            </div>
          </div>

          {/* Table Record Counts */}
          <div>
            <span className="text-xs font-semibold text-[#49382F] block mb-2">Active Table Record Counts:</span>
            <div className="grid grid-cols-3 gap-2">
              {dbStatus?.table_counts &&
                Object.entries(dbStatus.table_counts).map(([tbl, count]) => (
                  <div key={tbl} className="bg-[#F7F3EC] p-2.5 rounded-lg border border-[#E5DBCE] text-center">
                    <span className="text-[10px] text-[#8F7E73] uppercase font-mono block truncate">{tbl}</span>
                    <strong className="text-sm text-[#2A201A] tabular-nums">{String(count)}</strong>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Card 2: MySQL Connection Setup Instructions */}
        <div className="bg-[#FFFDF8] border border-[#E5DBCE] rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5DBCE] pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-[#80634D] text-white rounded-lg">
                <Server className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-[#2A201A]">Connecting to External MySQL</h3>
                <p className="text-xs text-[#6B5B52]">Instructions for production deployment</p>
              </div>
            </div>
            <button
              onClick={() => copyToClipboard(envSample)}
              className="flex items-center gap-1 text-xs text-[#80634D] hover:text-[#49382F] font-medium"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy .env</span>
            </button>
          </div>

          <div className="space-y-2 text-xs text-[#6B5B52]">
            <p>
              To connect the Node.js backend to a live MySQL 8.0 server:
            </p>
            <ol className="list-decimal list-inside space-y-1.5 pl-1 leading-relaxed">
              <li>
                Execute the full DDL script located at <code className="font-mono text-[#49382F] bg-[#F7F3EC] px-1 py-0.5 rounded">database/schema.sql</code>
              </li>
              <li>
                Create your database credentials and set environment variables:
              </li>
            </ol>
            <pre className="bg-[#2A201A] text-[#F7F3EC] p-3 rounded-lg font-mono text-[11px] overflow-x-auto">
              {envSample}
            </pre>
            <p className="text-[11px] text-[#8F7E73]">
              The backend will detect the MySQL variables at startup and initialize connection pooling using <code className="font-mono">mysql2/promise</code>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
