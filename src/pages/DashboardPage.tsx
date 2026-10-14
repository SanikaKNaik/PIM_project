import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Layers,
  ShoppingBag,
  AlertTriangle,
  ArrowUpRight,
  RefreshCw,
  Plus,
  Scan,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { reportsApi, wooApi } from '../api/client';

export const DashboardPage: React.FC = () => {
  const { user, role, canEdit, isAdmin } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [stats, setStats] = useState<any>(null);
  const [syncLogs, setSyncLogs] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, logsRes, actRes] = await Promise.all([
        reportsApi.getOverview(),
        wooApi.getLogs(),
        reportsApi.getActivityLogs()
      ]);
      setStats(statsRes.data);
      setSyncLogs(logsRes.data?.slice(0, 5) || []);
      setActivityLogs(actRes.data?.slice(0, 6) || []);
    } catch (err) {
      console.error('Failed loading dashboard data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleQuickSync = async () => {
    if (!canEdit) return;
    setIsSyncing(true);
    try {
      const res = await wooApi.syncAll();
      success(res.data?.message || 'Synchronized catalogue with WooCommerce store');
      loadData();
    } catch (err: any) {
      error(err.response?.data?.error || 'Sync request failed');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRetryLog = async (logId: string) => {
    try {
      await wooApi.retryLog(logId);
      success('Retried sync operation successfully');
      loadData();
    } catch (err: any) {
      error('Failed to retry operation');
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-[#FFFDF8] border border-[#E5DBCE] rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#B87555]">
            <span>PIM Control Center</span>
            <span>·</span>
            <span className="text-[#8F7E73] capitalize">{role} Workspace</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#2A201A] mt-1">
            Welcome back, {user?.full_name || 'Alexandra'}
          </h2>
          <p className="text-sm text-[#6B5B52] mt-0.5">
            {role === 'admin' && 'Central catalogue management, WooCommerce synchronization, and system configuration.'}
            {role === 'editor' && 'Merchandising catalogue updates, barcode operations, and sync tracking.'}
            {role === 'viewer' && 'Read-only inventory catalogue access and audit reports.'}
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {canEdit && (
            <button
              onClick={() => navigate('/products?action=new')}
              className="flex items-center gap-2 px-3.5 py-2 bg-[#49382F] hover:bg-[#382b24] text-white text-xs font-medium rounded-lg transition-colors shadow-2xs whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Product</span>
            </button>
          )}

          {canEdit && (
            <button
              onClick={handleQuickSync}
              disabled={isSyncing}
              className="flex items-center gap-2 px-3.5 py-2 bg-[#FFFDF8] border border-[#E5DBCE] hover:border-[#80634D] text-[#49382F] text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#80634D] ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync WooCommerce'}</span>
            </button>
          )}

          <button
            onClick={() => navigate('/excel')}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#FFFDF8] border border-[#E5DBCE] hover:border-[#80634D] text-[#49382F] text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#80634D]" />
            <span>Excel Batch</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Products */}
        <div
          onClick={() => navigate('/products')}
          className="bg-[#FFFDF8] border border-[#E5DBCE] rounded-xl p-5 shadow-xs hover:border-[#80634D] transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-[#8F7E73]">
            <span className="text-xs font-medium uppercase tracking-wider">Catalogue Size</span>
            <Package className="w-4 h-4 text-[#80634D]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-[#2A201A] tabular-nums">
            {stats?.totalProducts ?? 0}
          </div>
          <div className="mt-1 text-xs text-[#6B5B52] flex items-center gap-2">
            <span>{stats?.publishedProducts ?? 0} published</span>
            <span>·</span>
            <span>{stats?.draftProducts ?? 0} draft</span>
          </div>
        </div>

        {/* Categories & Variants */}
        <div
          onClick={() => navigate('/categories')}
          className="bg-[#FFFDF8] border border-[#E5DBCE] rounded-xl p-5 shadow-xs hover:border-[#80634D] transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-[#8F7E73]">
            <span className="text-xs font-medium uppercase tracking-wider">Categories / Variants</span>
            <Layers className="w-4 h-4 text-[#80634D]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-[#2A201A] tabular-nums">
            {stats?.totalCategories ?? 0}
          </div>
          <div className="mt-1 text-xs text-[#6B5B52] flex items-center gap-2">
            <span>{stats?.totalVariants ?? 0} active variants</span>
            <span>·</span>
            <span className="text-[#B87555]">5 taxonomies</span>
          </div>
        </div>

        {/* WooCommerce Sync Health */}
        <div
          onClick={() => navigate('/woocommerce')}
          className="bg-[#FFFDF8] border border-[#E5DBCE] rounded-xl p-5 shadow-xs hover:border-[#80634D] transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-[#8F7E73]">
            <span className="text-xs font-medium uppercase tracking-wider">WooCommerce Sync</span>
            <ShoppingBag className="w-4 h-4 text-[#80634D]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-[#2A201A] tabular-nums flex items-baseline gap-2">
            <span>{stats?.syncedCount ?? 0}</span>
            <span className="text-xs font-normal text-[#6B5B52]">/ {stats?.totalProducts ?? 0} synced</span>
          </div>
          <div className="mt-1 text-xs flex items-center gap-2">
            {stats?.failedSyncCount > 0 ? (
              <span className="text-red-700 font-medium">{stats.failedSyncCount} failed</span>
            ) : (
              <span className="text-emerald-700 font-medium">100% nominal</span>
            )}
            <span>·</span>
            <span className="text-[#8F7E73]">{stats?.pendingSyncCount ?? 0} pending</span>
          </div>
        </div>

        {/* Inventory Valuation */}
        <div
          onClick={() => navigate('/reports')}
          className="bg-[#FFFDF8] border border-[#E5DBCE] rounded-xl p-5 shadow-xs hover:border-[#80634D] transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-[#8F7E73]">
            <span className="text-xs font-medium uppercase tracking-wider">Inventory Value</span>
            <AlertTriangle className="w-4 h-4 text-[#B87555]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-[#2A201A] tabular-nums">
            ${Number(stats?.inventoryValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-xs text-[#6B5B52]">
            {stats?.outOfStock > 0 ? (
              <span className="text-red-700 font-medium">{stats.outOfStock} out of stock</span>
            ) : (
              <span className="text-emerald-700 font-medium">All items in stock</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Sync Log Stream & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Synchronization Logs */}
        <div className="lg:col-span-2 bg-[#FFFDF8] border border-[#E5DBCE] rounded-xl shadow-xs overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-[#E5DBCE] flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-[#2A201A]">Recent WooCommerce Sync Stream</h3>
              <p className="text-xs text-[#6B5B52]">Real-time REST API events and error logging</p>
            </div>
            <button
              onClick={() => navigate('/woocommerce')}
              className="text-xs font-medium text-[#80634D] hover:text-[#49382F] flex items-center gap-1 transition-colors"
            >
              <span>View Full History</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F3EC] text-[#6B5B52] border-b border-[#E5DBCE] uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Operation</th>
                  <th className="px-4 py-3 font-semibold">Item / SKU</th>
                  <th className="px-4 py-3 font-semibold">Message</th>
                  <th className="px-4 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5DBCE]/60">
                {syncLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-[#8F7E73]">
                      No sync events recorded yet.
                    </td>
                  </tr>
                ) : (
                  syncLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#F7F3EC]/50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        {log.status === 'success' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Success</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-700 font-medium">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Failed</span>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-[#49382F] font-mono text-[11px]">
                        {log.operation}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-medium text-[#2A201A] max-w-[140px] truncate">{log.product_name}</div>
                        <div className="text-[10px] font-mono text-[#8F7E73]">{log.sku}</div>
                      </td>
                      <td className="px-4 py-3 text-[#6B5B52] max-w-[220px] truncate" title={log.message}>
                        {log.message}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {log.status === 'failed' && canEdit && (
                          <button
                            onClick={() => handleRetryLog(log.id)}
                            className="px-2 py-1 bg-[#F7F3EC] hover:bg-[#E5DBCE] text-[#49382F] rounded text-[11px] font-medium border border-[#E5DBCE] transition-colors"
                          >
                            Retry
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Audit Activity Feed */}
        <div className="bg-[#FFFDF8] border border-[#E5DBCE] rounded-xl shadow-xs overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-[#E5DBCE]">
            <h3 className="font-semibold text-[#2A201A]">Audit Trail</h3>
            <p className="text-xs text-[#6B5B52]">Recent modifications & user actions</p>
          </div>

          <div className="p-4 space-y-3.5 flex-1 overflow-y-auto max-h-[320px]">
            {activityLogs.map((act) => (
              <div key={act.id} className="flex items-start gap-3 text-xs border-b border-[#E5DBCE]/40 pb-3 last:border-0 last:pb-0">
                <div className="w-6 h-6 rounded-full bg-[#E5DBCE] text-[#49382F] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  {act.user_name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-semibold text-[#2A201A] truncate">{act.user_name}</span>
                    <span className="text-[10px] text-[#8F7E73] whitespace-nowrap">
                      {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[#6B5B52] mt-0.5 leading-relaxed">{act.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
