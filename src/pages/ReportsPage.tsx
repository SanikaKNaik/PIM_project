import React, { useState, useEffect } from 'react';
import { FileText, Printer, Download, RefreshCw, BarChart2, ShieldCheck, Clock } from 'lucide-react';
import { reportsApi } from '../api/client';
import { useToast } from '../context/ToastContext';

export const ReportsPage: React.FC = () => {
  const { error } = useToast();

  const [stats, setStats] = useState<any>(null);
  const [catDistribution, setCatDistribution] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, distRes, actRes] = await Promise.all([
        reportsApi.getOverview(),
        reportsApi.getCategoriesDistribution(),
        reportsApi.getActivityLogs(),
      ]);
      setStats(statsRes.data);
      setCatDistribution(distRes.data || []);
      setActivityLogs(actRes.data || []);
    } catch (err) {
      error('Failed to load reports data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#2A201A]">Inventory Valuation & Activity Audit</h2>
          <p className="text-xs text-[#6B5B52]">
            Category asset valuation, stock balance reports, and administrative audit trails
          </p>
        </div>
        <button
          onClick={handlePrintReport}
          className="flex items-center gap-2 px-4 py-2 bg-[#49382F] hover:bg-[#382b24] text-white rounded-lg text-xs font-semibold transition-colors shadow-xs self-start sm:self-auto"
        >
          <Printer className="w-4 h-4" />
          <span>Print Inventory Report</span>
        </button>
      </div>

      {/* Valuation Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#FFFDF8] border border-[#E5DBCE] rounded-xl p-5 shadow-xs">
          <span className="text-xs font-semibold text-[#8F7E73] uppercase tracking-wider block">Total Inventory Valuation</span>
          <div className="text-2xl font-bold text-[#2A201A] mt-1 tabular-nums">
            ${Number(stats?.inventoryValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-xs text-[#6B5B52] mt-1 block">Based on active catalogue stock count × retail price</span>
        </div>

        <div className="bg-[#FFFDF8] border border-[#E5DBCE] rounded-xl p-5 shadow-xs">
          <span className="text-xs font-semibold text-[#8F7E73] uppercase tracking-wider block">Stock Integrity Ratio</span>
          <div className="text-2xl font-bold text-emerald-800 mt-1 tabular-nums">
            {stats?.totalProducts ? Math.round(((stats.totalProducts - stats.outOfStock) / stats.totalProducts) * 100) : 100}% In-Stock
          </div>
          <span className="text-xs text-[#6B5B52] mt-1 block">
            {stats?.outOfStock || 0} out of stock · {stats?.lowStock || 0} low stock items
          </span>
        </div>

        <div className="bg-[#FFFDF8] border border-[#E5DBCE] rounded-xl p-5 shadow-xs">
          <span className="text-xs font-semibold text-[#8F7E73] uppercase tracking-wider block">WooCommerce Sync Rate</span>
          <div className="text-2xl font-bold text-[#49382F] mt-1 tabular-nums">
            {stats?.totalProducts ? Math.round((stats.syncedCount / stats.totalProducts) * 100) : 0}%
          </div>
          <span className="text-xs text-[#6B5B52] mt-1 block">
            {stats?.syncedCount || 0} published to live storefront
          </span>
        </div>
      </div>

      {/* Category Breakdown Table */}
      <div className="bg-[#FFFDF8] border border-[#E5DBCE] rounded-xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5DBCE]">
          <h3 className="font-semibold text-sm text-[#2A201A]">Category Asset Breakdown</h3>
          <p className="text-xs text-[#6B5B52]">Product count and total capital invested per category</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F3EC] text-[#6B5B52] border-b border-[#E5DBCE] uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3">Category Name</th>
                <th className="px-4 py-3 text-right">Items in Catalogue</th>
                <th className="px-4 py-3 text-right">Valuation ($)</th>
                <th className="px-4 py-3 text-right">Portfolio Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DBCE]/60">
              {catDistribution.map((cat) => {
                const totalVal = stats?.inventoryValue || 1;
                const share = Math.round((cat.valuation / totalVal) * 100);

                return (
                  <tr key={cat.category_id} className="hover:bg-[#F7F3EC]/50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-[#2A201A]">{cat.category_name}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium">{cat.count} items</td>
                    <td className="px-4 py-3 text-right tabular-nums font-bold text-[#49382F]">
                      ${Number(cat.valuation).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-[#8F7E73]">{share}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Administrative Audit Trail */}
      <div className="bg-[#FFFDF8] border border-[#E5DBCE] rounded-xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5DBCE] flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm text-[#2A201A]">System Activity Audit Trail</h3>
            <p className="text-xs text-[#6B5B52]">Verifiable log of changes made by administrators and editors</p>
          </div>
          <button
            onClick={loadData}
            className="flex items-center gap-1 text-xs text-[#80634D] hover:text-[#49382F] font-medium"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F3EC] text-[#6B5B52] border-b border-[#E5DBCE] uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entity Type</th>
                <th className="px-4 py-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DBCE]/60">
              {activityLogs.map((act) => (
                <tr key={act.id} className="hover:bg-[#F7F3EC]/50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-[#8F7E73] font-mono text-[11px]">
                    {new Date(act.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="font-semibold text-[#2A201A]">{act.user_name}</span>
                    <span className="text-[10px] text-[#8F7E73] block capitalize">{act.user_role}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap font-mono text-[11px] font-semibold text-[#80634D]">
                    {act.action}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap capitalize text-[#6B5B52]">
                    {act.entity_type}
                  </td>
                  <td className="px-4 py-3 text-[#49382F] leading-relaxed">
                    {act.description}
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
