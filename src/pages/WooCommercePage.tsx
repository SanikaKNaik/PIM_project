import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Save,
  Download,
  UploadCloud,
  Check,
  Play
} from 'lucide-react';
import { wooApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const WooCommercePage: React.FC = () => {
  const { canEdit, isAdmin } = useAuth();
  const { success, error, info } = useToast();

  const [config, setConfig] = useState<any>({
    store_url: '',
    consumer_key: '',
    consumer_secret: '',
    is_active: true,
    auto_sync_stock: true,
    connection_status: 'untested'
  });

  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [testResult, setTestResult] = useState<any | null>(null);

  // Form inputs
  const [storeUrlInput, setStoreUrlInput] = useState('');
  const [keyInput, setKeyInput] = useState('');
  const [secretInput, setSecretInput] = useState('');
  const [autoSyncStock, setAutoSyncStock] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [cfgRes, logsRes] = await Promise.all([
        wooApi.getConfig(),
        wooApi.getLogs(),
      ]);
      setConfig(cfgRes.data);
      setStoreUrlInput(cfgRes.data?.store_url || 'https://shop.stitch-artisan.com');
      setKeyInput(cfgRes.data?.consumer_key || '');
      setAutoSyncStock(cfgRes.data?.auto_sync_stock ?? true);
      setLogs(logsRes.data || []);
    } catch (err) {
      error('Failed to load WooCommerce status');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      error('Only administrators can update WooCommerce integration credentials');
      return;
    }

    try {
      const res = await wooApi.updateConfig({
        store_url: storeUrlInput.trim(),
        consumer_key: keyInput.trim(),
        consumer_secret: secretInput.trim(),
        auto_sync_stock: autoSyncStock,
      });
      success(res.data?.message || 'Configuration saved');
      setSecretInput('');
      loadData();
    } catch (err: any) {
      error(err.response?.data?.error || 'Failed to update credentials');
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await wooApi.testConnection();
      setTestResult(res.data);
      success(res.data?.message || 'Connection verified successfully');
      loadData();
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Connection failed';
      setTestResult({
        success: false,
        error: msg
      });
      error(msg);
      loadData();
    } finally {
      setIsTesting(false);
    }
  };

  const handleSyncAll = async () => {
    if (!canEdit) return;
    setIsSyncingAll(true);
    try {
      const res = await wooApi.syncAll();
      success(res.data?.message || 'Successfully queued catalogue sync');
      loadData();
    } catch (err: any) {
      error('Batch sync failed');
    } finally {
      setIsSyncingAll(false);
    }
  };

  const handleImportFromWoo = async () => {
    if (!canEdit) return;
    setIsImporting(true);
    try {
      const res = await wooApi.importFromStore();
      success(res.data?.message || 'Successfully imported products from WooCommerce store');
      loadData();
    } catch (err: any) {
      error('Import from WooCommerce store failed');
    } finally {
      setIsImporting(false);
    }
  };

  const handleRetryLog = async (logId: string) => {
    try {
      const res = await wooApi.retryLog(logId);
      success(res.data?.message || 'Retried operation successfully');
      loadData();
    } catch (err: any) {
      error('Retry attempt failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-[#2A201A]">WooCommerce REST API Integration</h2>
        <p className="text-xs text-[#6B5B52]">
          Bi-directional product catalogue synchronization, webhook listeners, and audit logs
        </p>
      </div>

      {/* Top 2 Columns: Credentials Configuration & Quick Sync Engine */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Card 1: Connection & Credentials */}
        <div className="bg-[#FFFDF8] border border-[#E5DBCE] rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5DBCE] pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-[#49382F] text-white rounded-lg">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-[#2A201A]">Store Connection & Credentials</h3>
                <p className="text-xs text-[#6B5B52]">REST API v3 endpoint credentials</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-semibold">
              {config.connection_status === 'connected' ? (
                <span className="text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Connected</span>
                </span>
              ) : config.connection_status === 'failed' ? (
                <span className="text-red-700 flex items-center gap-1">
                  <XCircle className="w-4 h-4" />
                  <span>Connection Failed</span>
                </span>
              ) : (
                <span className="text-amber-700 flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>Untested</span>
                </span>
              )}
            </div>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-[#49382F] mb-1">
                WooCommerce Store URL *
              </label>
              <input
                type="url"
                required
                disabled={!isAdmin}
                value={storeUrlInput}
                onChange={(e) => setStoreUrlInput(e.target.value)}
                placeholder="https://shop.yourdomain.com"
                className="w-full px-3 py-2 bg-white border border-[#E5DBCE] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#80634D]/30 font-mono"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#49382F] mb-1">
                  Consumer Key (ck_...)
                </label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="ck_..."
                  className="w-full px-3 py-2 bg-white border border-[#E5DBCE] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#80634D]/30 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#49382F] mb-1">
                  Consumer Secret (cs_...)
                </label>
                <input
                  type="password"
                  disabled={!isAdmin}
                  value={secretInput}
                  onChange={(e) => setSecretInput(e.target.value)}
                  placeholder="Leave blank to keep existing"
                  className="w-full px-3 py-2 bg-white border border-[#E5DBCE] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#80634D]/30 font-mono"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 text-[#49382F] cursor-pointer">
                <input
                  type="checkbox"
                  disabled={!isAdmin}
                  checked={autoSyncStock}
                  onChange={(e) => setAutoSyncStock(e.target.checked)}
                  className="rounded border-[#E5DBCE] text-[#80634D] focus:ring-[#80634D]"
                />
                <span>Automatically sync stock count modifications to WooCommerce</span>
              </label>
            </div>

            {/* Test result display */}
            {testResult && (
              <div
                className={`p-3 rounded-lg border text-xs ${
                  testResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}
              >
                <div className="font-semibold">{testResult.message || testResult.error}</div>
                {testResult.store_info && (
                  <div className="mt-1 text-[11px] text-emerald-700">
                    Mode: {testResult.mode} · Version: {testResult.store_info.version || 'REST v3'}
                  </div>
                )}
              </div>
            )}

            <div className="pt-3 border-t border-[#E5DBCE] flex items-center justify-between">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F7F3EC] hover:bg-[#E5DBCE] text-[#49382F] rounded-lg text-xs font-semibold border border-[#E5DBCE] transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                <span>{isTesting ? 'Testing Handshake...' : 'Test Connection'}</span>
              </button>

              {isAdmin && (
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-[#49382F] hover:bg-[#382b24] text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Config</span>
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Card 2: 2-Way Sync Engine */}
        <div className="bg-[#FFFDF8] border border-[#E5DBCE] rounded-xl p-6 shadow-xs space-y-4">
          <div className="border-b border-[#E5DBCE] pb-3">
            <h3 className="font-semibold text-sm text-[#2A201A]">Synchronisation Controls</h3>
            <p className="text-xs text-[#6B5B52]">Trigger manual two-way synchronization workflows</p>
          </div>

          <div className="space-y-4 text-xs">
            {/* Sync Direction 1: PIM -> Woo */}
            <div className="p-4 bg-[#F7F3EC] rounded-lg border border-[#E5DBCE] space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-[#49382F] flex items-center gap-1.5">
                  <UploadCloud className="w-4 h-4 text-[#80634D]" />
                  <span>Push to WooCommerce (PIM → Woo)</span>
                </div>
                <span className="text-[11px] text-[#8F7E73]">Master: PIM</span>
              </div>
              <p className="text-[#6B5B52] leading-relaxed">
                Pushes new and updated products, categories, variants, prices, and stock levels to your online store.
              </p>
              <button
                onClick={handleSyncAll}
                disabled={isSyncingAll || !canEdit}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#49382F] hover:bg-[#382b24] text-white rounded text-xs font-semibold transition-colors disabled:opacity-50"
              >
                <Play className={`w-3.5 h-3.5 ${isSyncingAll ? 'animate-spin' : ''}`} />
                <span>{isSyncingAll ? 'Publishing Catalogue...' : 'Sync All Pending Products'}</span>
              </button>
            </div>

            {/* Sync Direction 2: Woo -> PIM */}
            <div className="p-4 bg-[#F7F3EC] rounded-lg border border-[#E5DBCE] space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-[#49382F] flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-[#80634D]" />
                  <span>Import from WooCommerce (Woo → PIM)</span>
                </div>
                <span className="text-[11px] text-[#8F7E73]">Master: Store</span>
              </div>
              <p className="text-[#6B5B52] leading-relaxed">
                Pulls existing catalogue products created directly in WordPress/WooCommerce into your central PIM system.
              </p>
              <button
                onClick={handleImportFromWoo}
                disabled={isImporting || !canEdit}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#80634D] hover:bg-[#6e533e] text-white rounded text-xs font-semibold transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isImporting ? 'animate-spin' : ''}`} />
                <span>{isImporting ? 'Importing Products...' : 'Import Store Products'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Synchronization Logs & Retry Engine */}
      <div className="bg-[#FFFDF8] border border-[#E5DBCE] rounded-xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5DBCE] flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm text-[#2A201A]">Synchronisation Audit & Error Logs</h3>
            <p className="text-xs text-[#6B5B52]">Full history with payload snapshots and retry actions</p>
          </div>
          <button
            onClick={loadData}
            className="flex items-center gap-1 text-xs text-[#80634D] hover:text-[#49382F] font-medium"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Logs</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F3EC] text-[#6B5B52] border-b border-[#E5DBCE] uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Operation & Direction</th>
                <th className="px-4 py-3">Product / SKU</th>
                <th className="px-4 py-3">Message & Details</th>
                <th className="px-4 py-3 text-right">Retry</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DBCE]/60">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-[#F7F3EC]/50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-[#8F7E73] font-mono text-[11px]">
                    {new Date(log.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {log.status === 'success' ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Success</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-700 font-semibold">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Failed ({log.http_status || 500})</span>
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="font-mono text-[#49382F] font-semibold">{log.operation}</span>
                    <span className="text-[10px] text-[#8F7E73] block">{log.direction}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="font-semibold text-[#2A201A]">{log.product_name || 'Catalogue Batch'}</div>
                    <div className="font-mono text-[10px] text-[#8F7E73]">{log.sku}</div>
                  </td>
                  <td className="px-4 py-3 text-[#6B5B52] max-w-xs">
                    <div className="truncate" title={log.message}>{log.message}</div>
                    {log.error_details && (
                      <div className="text-[10px] text-red-600 truncate mt-0.5" title={log.error_details}>
                        {log.error_details}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {log.status === 'failed' && canEdit && (
                      <button
                        onClick={() => handleRetryLog(log.id)}
                        className="px-2.5 py-1 bg-[#49382F] hover:bg-[#382b24] text-white rounded text-xs font-medium transition-colors"
                      >
                        Retry
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
