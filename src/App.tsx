import { useState, useRef } from 'react';
import { Upload, FileDown, CheckCircle2, AlertCircle, FileSpreadsheet, Activity, Pill } from 'lucide-react';
import { TimesheetRecord, ServiceLogRecord, MedicineLogRecord, ErrorLog } from './types';
import { readExcelFile, checkDevLogs, exportErrorsToExcel } from './utils';

export default function App() {
  const [timesheetFile, setTimesheetFile] = useState<File | null>(null);
  const [serviceLogFile, setServiceLogFile] = useState<File | null>(null);
  const [medicineLogFile, setMedicineLogFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<ErrorLog[] | null>(null);
  const [toastMessage, setToastMessage] = useState('');

  const tsFileInputRef = useRef<HTMLInputElement>(null);
  const slFileInputRef = useRef<HTMLInputElement>(null);
  const mlFileInputRef = useRef<HTMLInputElement>(null);

  const handleTsFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setTimesheetFile(e.target.files[0]);
      setErrors(null);
    }
  };

  const handleSlFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setServiceLogFile(e.target.files[0]);
      setErrors(null);
    }
  };

  const handleMlFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setMedicineLogFile(e.target.files[0]);
      setErrors(null);
    }
  };

  const handleProcess = async () => {
    if (!timesheetFile || (!serviceLogFile && !medicineLogFile)) {
      setToastMessage('Vui lòng tải lên Bảng chấm công và ít nhất 1 file log (DVKT hoặc Thuốc).');
      setTimeout(() => setToastMessage(''), 3000);
      return;
    }

    setIsProcessing(true);
    setErrors(null);
    
    try {
      const timesheets = await readExcelFile<TimesheetRecord>(timesheetFile);
      const serviceLogs = serviceLogFile ? await readExcelFile<ServiceLogRecord>(serviceLogFile) : [];
      const medicineLogs = medicineLogFile ? await readExcelFile<MedicineLogRecord>(medicineLogFile) : [];
      
      const foundErrors = checkDevLogs(timesheets, serviceLogs, medicineLogs);
      setErrors(foundErrors);
    } catch (err) {
      console.error(err);
      setToastMessage('Có lỗi xảy ra khi đọc file Excel. Vui lòng kiểm tra định dạng.');
      setTimeout(() => setToastMessage(''), 5000);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = () => {
    if (errors && errors.length > 0) {
      exportErrorsToExcel(errors);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center space-x-4">
          <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
            <Activity className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-600">
              Hệ thống Kiểm tra Bảng chấm công & Thời gian DVKT
            </h1>
            <p className="text-slate-500 mt-1 text-sm font-medium">
              Đối chiếu dữ liệu chấm công và log thực hiện dịch vụ y tế để tìm sai lệch.
            </p>
          </div>
        </header>

        {/* Upload Section */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Timesheet Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center space-y-4 hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-emerald-400 opacity-80" />
            <div className="bg-emerald-50 text-emerald-600 p-4 rounded-full group-hover:scale-110 transition-transform">
              <FileSpreadsheet className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-slate-800">1. Bảng chấm công NVYT</h3>
              <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto">
                File Excel chứa thời gian đi làm, nghỉ phép, trực (THANG, NAM, NGAY_1...)
              </p>
            </div>
            
            <input 
               type="file" 
               accept=".xlsx, .xls" 
               className="hidden" 
               ref={tsFileInputRef} 
               onChange={handleTsFileSelect}
            />
            
            <button 
              onClick={() => tsFileInputRef.current?.click()}
              className="px-5 py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 rounded-lg font-medium tracking-wide flex items-center space-x-2 transition-colors border border-emerald-200"
            >
              <Upload className="w-4 h-4" />
              <span>{timesheetFile ? 'Đổi File' : 'Tải lên Bảng Chấm Công'}</span>
            </button>
            
            {timesheetFile && (
              <div className="flex items-center space-x-2 text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200 w-full justify-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span className="truncate">{timesheetFile.name}</span>
              </div>
            )}
          </div>

          {/* Service Logs Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center space-y-4 hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-indigo-400 opacity-80" />
            <div className="bg-indigo-50 text-indigo-600 p-4 rounded-full group-hover:scale-110 transition-transform">
              <Activity className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-slate-800">2. Log Thời Gian DVKT</h3>
              <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto">
                File Excel chứa thời gian chỉ định và thực hiện dịch vụ (NGAY_YL, NGAY_TH_YL...)
              </p>
            </div>
            
            <input 
               type="file" 
               accept=".xlsx, .xls" 
               className="hidden" 
               ref={slFileInputRef} 
               onChange={handleSlFileSelect}
            />
            
            <button 
              onClick={() => slFileInputRef.current?.click()}
              className="px-5 py-2.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 rounded-lg font-medium tracking-wide flex items-center space-x-2 transition-colors border border-indigo-200"
            >
              <Upload className="w-4 h-4" />
              <span>{serviceLogFile ? 'Đổi File' : 'Tải lên Log DVKT'}</span>
            </button>
            
            {serviceLogFile && (
              <div className="flex items-center space-x-2 text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200 w-full justify-center">
                <CheckCircle2 className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                <span className="truncate">{serviceLogFile.name}</span>
              </div>
            )}
          </div>

          {/* Medicine Logs Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center space-y-4 hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-amber-400 opacity-80" />
            <div className="bg-amber-50 text-amber-600 p-4 rounded-full group-hover:scale-110 transition-transform">
              <Pill className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-slate-800">3. Log Chỉ Định Thuốc</h3>
              <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto">
                File Excel chứa thời gian chỉ định thuốc (NGAY_YL, TEN_THUOC...)
              </p>
            </div>
            
            <input 
               type="file" 
               accept=".xlsx, .xls" 
               className="hidden" 
               ref={mlFileInputRef} 
               onChange={handleMlFileSelect}
            />
            
            <button 
              onClick={() => mlFileInputRef.current?.click()}
              className="px-5 py-2.5 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800 rounded-lg font-medium tracking-wide flex items-center space-x-2 transition-colors border border-amber-200"
            >
              <Upload className="w-4 h-4" />
              <span>{medicineLogFile ? 'Đổi File' : 'Tải lên Log Thuốc'}</span>
            </button>
            
            {medicineLogFile && (
              <div className="flex items-center space-x-2 text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200 w-full justify-center">
                <CheckCircle2 className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span className="truncate">{medicineLogFile.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex justify-center mt-6">
          <button
            onClick={handleProcess}
            disabled={!timesheetFile || (!serviceLogFile && !medicineLogFile) || isProcessing}
            className={`px-8 py-3.5 rounded-xl font-semibold shadow-sm flex items-center space-x-2 transition-all ${(!timesheetFile || (!serviceLogFile && !medicineLogFile)) 
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
              : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0'}`}
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Đang kiểm tra dữ liệu...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Bắt Đầu Kiểm Tra</span>
              </>
            )}
          </button>
        </div>

        {/* Results Section */}
        {errors !== null && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50">
              <div className="flex items-center space-x-3 text-rose-600">
                <AlertCircle className="w-6 h-6" />
                <h2 className="text-xl font-semibold text-slate-800">
                  {errors.length === 0 ? 'Dữ liệu Hợp lệ' : `Phát hiện ${errors.length} lỗi vi phạm`}
                </h2>
              </div>
              {errors.length > 0 && (
                <button
                  onClick={handleExport}
                  className="px-4 py-2 bg-slate-800 text-white hover:bg-slate-700 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors sm:w-auto w-full"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Xuất Excel</span>
                </button>
              )}
            </div>

            <div className="p-0">
              {errors.length === 0 ? (
                <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                  <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mb-4">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <p className="text-lg font-medium text-slate-700">Tuyệt vời! Không phát hiện lỗi nào.</p>
                  <p className="text-sm">Tất cả thời gian thực hiện dịch vụ đều khớp với bảng chấm công.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-medium uppercase tracking-wider text-xs border-b border-slate-200">
                        <th className="px-6 py-4 whitespace-nowrap">STT</th>
                        <th className="px-6 py-4 whitespace-nowrap">Nhân Viên</th>
                        <th className="px-6 py-4 whitespace-nowrap">Mã CCHN</th>
                        <th className="px-6 py-4 whitespace-nowrap">Dịch Vụ</th>
                        <th className="px-6 py-4 whitespace-nowrap">Bệnh Nhân</th>
                        <th className="px-6 py-4 whitespace-nowrap">Thành Tiền</th>
                        <th className="px-6 py-4 whitespace-nowrap">Hành Động</th>
                        <th className="px-6 py-4 whitespace-nowrap">Thời Gian</th>
                        <th className="px-6 py-4 min-w-[250px]">Lý Do Cảnh Báo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {errors.map((err, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-slate-500">{idx + 1}</td>
                          <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-700">{err.TEN_NHANVIEN}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-mono text-xs">{err.MACCHN}</td>
                          <td className="px-6 py-4 max-w-xs truncate text-slate-600" title={err.TEN_DICH_VU}>{err.TEN_DICH_VU}</td>
                          <td className="px-6 py-4 max-w-[150px] truncate text-slate-600">
                            <div>{err.HO_TEN}</div>
                            <div className="text-xs text-slate-400 font-mono mt-0.5">{err.MA_BA}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-slate-600 font-medium">
                            {err.THANH_TIEN != null && String(err.THANH_TIEN).trim() !== '' ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(err.THANH_TIEN)) : ''}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium border border-slate-200 whitespace-pre-wrap leading-relaxed inline-block">
                              {err.LOAI_HANH_DONG}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-pre-line text-slate-600 font-mono text-xs leading-relaxed">{err.THOI_GIAN_FORMATTED}</td>
                          <td className="px-6 py-4 text-rose-600 font-medium text-sm leading-relaxed whitespace-pre-line">{err.LOAI_LOI}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Toast Notifs */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 bg-slate-800 text-white px-6 py-3.5 rounded-xl shadow-lg border border-slate-700 font-medium flex items-center space-x-3 animate-in slide-in-from-right-8 z-50">
             <AlertCircle className="w-5 h-5 text-amber-400" />
             <span>{toastMessage}</span>
          </div>
        )}

      </div>
    </div>
  );
}
