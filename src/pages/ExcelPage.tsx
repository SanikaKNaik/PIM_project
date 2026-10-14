import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Play,
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import { excelApi, productsApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const ExcelPage: React.FC = () => {
  const { canEdit } = useAuth();
  const { success, error, info } = useToast();

  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationReport, setValidationReport] = useState<any | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<any | null>(null);

  const handleDownloadTemplate = () => {
    window.location.href = excelApi.getTemplateUrl();
  };

  const handleExportXLSX = () => {
    window.location.href = excelApi.getExportUrl('xlsx');
  };

  const handleExportCSV = () => {
    window.location.href = excelApi.getExportUrl('csv');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setValidationReport(null);
    setImportResult(null);
    setIsValidating(true);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonRows = XLSX.utils.sheet_to_json(worksheet);

        if (!jsonRows || jsonRows.length === 0) {
          error('Uploaded spreadsheet appears to be empty.');
          setIsValidating(false);
          return;
        }

        // Validate rows through backend validation service
        const valRes = await excelApi.validate(jsonRows);
        setValidationReport(valRes.data);
        success(`Validated ${jsonRows.length} rows: ${valRes.data.valid_count} valid, ${valRes.data.invalid_count} issues.`);
      } catch (err: any) {
        error(err.message || 'Failed to parse Excel file. Ensure valid format (.xlsx or .csv).');
      } finally {
        setIsValidating(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleCommitImport = async () => {
    if (!validationReport || validationReport.valid_count === 0) return;
    setIsImporting(true);

    try {
      const res = await excelApi.importValidated(validationReport.valid_rows);
      setImportResult(res.data);
      success(res.data.message || `Imported ${res.data.imported_count} products.`);
      setValidationReport(null);
    } catch (err: any) {
      error(err.response?.data?.error || 'Failed to commit import');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-[#2A201A]">Excel & CSV Bulk Operations</h2>
        <p className="text-xs text-[#6B5B52]">
          Bulk import products with duplicate checking, preview reports, and instant catalogue export
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Import Workspace */}
        <div className="lg:col-span-2 bg-[#FFFDF8] border border-[#E5DBCE] rounded-xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-[#E5DBCE] pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-[#49382F] text-white rounded-lg">
                <Upload className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-[#2A201A]">Bulk Product Import</h3>
                <p className="text-xs text-[#6B5B52]">Supports Microsoft Excel (.xlsx, .xls) and CSV</p>
              </div>
            </div>

            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F7F3EC] hover:bg-[#E5DBCE] text-[#49382F] rounded-lg text-xs font-semibold border border-[#E5DBCE] transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-[#80634D]" />
              <span>Download Template</span>
            </button>
          </div>

          {/* Upload Drop Zone */}
          <div className="border-2 border-dashed border-[#E5DBCE] rounded-xl p-8 text-center hover:border-[#80634D] transition-colors bg-[#F7F3EC]/30">
            <input
              type="file"
              id="excel-file-upload"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label
              htmlFor="excel-file-upload"
              className="cursor-pointer flex flex-col items-center justify-center space-y-2"
            >
              <div className="w-12 h-12 rounded-full bg-[#FFFDF8] border border-[#E5DBCE] flex items-center justify-center text-[#80634D] shadow-xs">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div className="text-sm font-semibold text-[#2A201A]">
                {uploadedFileName ? uploadedFileName : 'Click to select or drop an Excel spreadsheet'}
              </div>
              <p className="text-xs text-[#8F7E73]">
                Evaluates SKU uniqueness, price numbers, and category references before committing
              </p>
            </label>
          </div>

          {/* Validation Status / Results */}
          {isValidating && (
            <div className="p-4 bg-[#F7F3EC] border border-[#E5DBCE] rounded-lg flex items-center gap-3 text-xs text-[#49382F]">
              <RefreshCw className="w-4 h-4 animate-spin text-[#80634D]" />
              <span>Running schema verification, SKU uniqueness check, and barcode verification...</span>
            </div>
          )}

          {/* Validation Report View */}
          {validationReport && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between p-3.5 bg-[#F7F3EC] border border-[#E5DBCE] rounded-lg text-xs">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{validationReport.valid_count} Valid Rows</span>
                  </div>
                  {validationReport.invalid_count > 0 && (
                    <div className="flex items-center gap-1.5 text-red-800 font-semibold">
                      <XCircle className="w-4 h-4 text-red-600" />
                      <span>{validationReport.invalid_count} Invalid / Duplicates</span>
                    </div>
                  )}
                </div>

                {validationReport.valid_count > 0 && canEdit && (
                  <button
                    onClick={handleCommitImport}
                    disabled={isImporting}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-[#49382F] hover:bg-[#382b24] text-white rounded text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>{isImporting ? 'Importing...' : `Commit ${validationReport.valid_count} Products`}</span>
                  </button>
                )}
              </div>

              {/* Invalid Rows Diagnostic */}
              {validationReport.invalid_rows?.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-red-800 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span>Rejected Rows (will be skipped):</span>
                  </div>
                  <div className="max-h-44 overflow-y-auto space-y-1.5">
                    {validationReport.invalid_rows.map((row: any, i: number) => (
                      <div key={i} className="p-2.5 bg-red-50 border border-red-200 rounded text-xs text-red-900">
                        <div className="font-semibold flex items-center justify-between">
                          <span>Row {row.row_number}: {row.name || 'Unnamed'} (SKU: {row.sku || 'N/A'})</span>
                        </div>
                        <ul className="list-disc list-inside mt-1 text-[11px] text-red-700 space-y-0.5">
                          {row.errors?.map((err: string, eIdx: number) => (
                            <li key={eIdx}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Import Complete Notice */}
          {importResult && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 space-y-1">
              <div className="font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{importResult.message}</span>
              </div>
              <p className="text-emerald-700">
                Products are now live in the central PIM catalogue and ready for WooCommerce synchronization.
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Export Catalogue */}
        <div className="bg-[#FFFDF8] border border-[#E5DBCE] rounded-xl p-6 shadow-xs space-y-4">
          <div className="border-b border-[#E5DBCE] pb-3">
            <h3 className="font-semibold text-sm text-[#2A201A]">Export Catalogue</h3>
            <p className="text-xs text-[#6B5B52]">Generate complete inventory and barcode spreadsheets</p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-4 bg-[#F7F3EC] rounded-lg border border-[#E5DBCE] space-y-2">
              <span className="font-semibold text-[#49382F] block">Excel Workbook (.xlsx)</span>
              <p className="text-[#6B5B52] leading-relaxed">
                Formatted spreadsheet with barcodes, prices, category names, stock counts, and WooCommerce IDs.
              </p>
              <button
                onClick={handleExportXLSX}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#49382F] hover:bg-[#382b24] text-white rounded text-xs font-semibold transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export XLSX</span>
              </button>
            </div>

            <div className="p-4 bg-[#F7F3EC] rounded-lg border border-[#E5DBCE] space-y-2">
              <span className="font-semibold text-[#49382F] block">Standard CSV (.csv)</span>
              <p className="text-[#6B5B52] leading-relaxed">
                Comma-separated values format for warehouse ERP systems and third-party inventory tools.
              </p>
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#80634D] hover:bg-[#6e533e] text-white rounded text-xs font-semibold transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
