import * as XLSX from 'xlsx';
import { TimesheetRecord, ServiceLogRecord, ErrorLog } from './types';

export function parseYmdhm(str?: string | number) {
  if (str == null || str === '') return null;
  const s = String(str).trim();
  if (s.length < 12) return null;
  const year = parseInt(s.substring(0, 4), 10);
  const month = parseInt(s.substring(4, 6), 10);
  const day = parseInt(s.substring(6, 8), 10);
  const hour = parseInt(s.substring(8, 10), 10);
  const minute = parseInt(s.substring(10, 12), 10);
  
  if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hour) || isNaN(minute)) return null;
  
  return { year, month, day, hour, minute };
}

export function formatYmdhm(str?: string | number) {
  const p = parseYmdhm(str);
  if (!p) return String(str || '');
  return `${String(p.hour).padStart(2, '0')}:${String(p.minute).padStart(2, '0')} ${String(p.day).padStart(2, '0')}/${String(p.month).padStart(2, '0')}/${p.year}`;
}

export async function readExcelFile<T>(file: File): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json<T>(worksheet, { defval: '' });
        resolve(json);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export function checkDevLogs(timesheets: TimesheetRecord[], logs: ServiceLogRecord[], medicineLogs: MedicineLogRecord[] = []): ErrorLog[] {
  const errorsMap = new Map<string, ErrorLog>();

  // Create a map for quick timesheet lookup: MACCHN_YEAR_MONTH -> timesheet
  const tsMap = new Map<string, TimesheetRecord>();
  for (const ts of timesheets) {
    if (ts.MACCHN && ts.NAM && ts.THANG) {
      const key = `${String(ts.MACCHN).trim()}_${ts.NAM}_${ts.THANG}`;
      tsMap.set(key.toLowerCase(), ts);
    }
  }

  function checkAction(
    groupId: string,
    itemName: string,
    maBa: string,
    hoTen: string,
    thanhTien: string | number | undefined,
    macchn: string | number | undefined, 
    timeStr: string | number | undefined, 
    actionType: string, 
    isGiuong: boolean, 
    endTimeStr?: string | number | undefined
  ) {
    if (macchn == null || String(macchn).trim() === '') return;
    
    const t1 = timeStr != null && String(timeStr).trim() !== '' ? parseYmdhm(timeStr) : null;
    const t2 = endTimeStr != null && String(endTimeStr).trim() !== '' ? parseYmdhm(endTimeStr) : null;

    if (!t1 && !t2) return;

    const cchn = String(macchn).trim();
    
    let isError = false;
    let loaiLoi = '';

    const checkTime = (time: ReturnType<typeof parseYmdhm>) => {
      if (!time) return false;
      const key = `${cchn}_${time.year}_${time.month}`.toLowerCase();
      const ts = tsMap.get(key);
      if (!ts) return false;

      const dayKey1 = `NGAY_${time.day}`;
      const dayKey2 = `NGAY_${String(time.day).padStart(2, '0')}`;
      let rawDayValue = ts[dayKey1];
      if (rawDayValue == null) rawDayValue = ts[dayKey2];
      const dayValue = (rawDayValue != null ? String(rawDayValue) : '').trim();

      const shouldIgnoreGiuong = isGiuong && ['', 'NB', 'Nb', '-/Nb', 'CT'].includes(dayValue);
      const isErrorFullDayOff = ['TS', 'H', 'P', '', 'CT', 'NB', 'Nb'].includes(dayValue) && !shouldIgnoreGiuong;
      
      if (isErrorFullDayOff) {
        let reason = 'Không rõ';
        if (dayValue === 'TS') reason = 'Thai sản (TS)';
        else if (dayValue === 'H') reason = 'Học (H)';
        else if (dayValue === 'P') reason = 'Phép (P)';
        else if (dayValue === '') reason = 'Nghỉ';
        else if (dayValue === 'CT') reason = 'Công tác (T)';
        else if (dayValue === 'NB') reason = 'Nghỉ bù (NB)';
        else if (dayValue === 'Nb') reason = 'Nghỉ bù (Nb)';
        loaiLoi = `Nghỉ làm [${reason}] nhưng có phát sinh dịch vụ`;
        return true;
      } else if (dayValue === '-/Nb') {
        if (shouldIgnoreGiuong) return false;
        const tMinutes = time.hour * 60 + time.minute;
        if (tMinutes >= 13 * 60 + 30 && tMinutes <= 17 * 60) {
          loaiLoi = `Nghỉ bù buổi chiều [-/Nb] nhưng có phát sinh dịch vụ`;
          return true;
        }
      }
      return false;
    };

    const err1 = checkTime(t1);
    const err2 = checkTime(t2);

    if (err1 || err2) {
      const validatedTime = t1 || t2;
      const keyForName = validatedTime ? `${cchn}_${validatedTime.year}_${validatedTime.month}`.toLowerCase() : '';
      const ts = tsMap.get(keyForName);
      const tenNhanVien = ts?.TEN_NHANVIEN ? String(ts.TEN_NHANVIEN) : cchn;

      const groupKey = `${groupId}_${cchn}`;
      let timeFormatted = t1 ? formatYmdhm(timeStr) : '';
      if (t2) {
         timeFormatted += timeFormatted ? ` - ${formatYmdhm(endTimeStr)}` : formatYmdhm(endTimeStr);
      }
      
      if (errorsMap.has(groupKey)) {
        const existing = errorsMap.get(groupKey)!;
        if (!existing.LOAI_HANH_DONG.includes(actionType)) {
          existing.LOAI_HANH_DONG += `, ${actionType}`;
        }
        existing.THOI_GIAN_FORMATTED += `\n- ${actionType}: ${timeFormatted}`;
        if (!existing.LOAI_LOI.includes(loaiLoi)) {
          existing.LOAI_LOI += `\n- ${loaiLoi}`;
        }
      } else {
        errorsMap.set(groupKey, {
          TEN_NHANVIEN: tenNhanVien,
          MACCHN: cchn,
          TEN_DICH_VU: itemName,
          MA_BA: maBa,
          HO_TEN: hoTen,
          THANH_TIEN: thanhTien,
          LOAI_HANH_DONG: actionType,
          THOI_GIAN: String(timeStr || endTimeStr || ''),
          THOI_GIAN_FORMATTED: `- ${actionType}: ${timeFormatted}`,
          LOAI_LOI: `- ${loaiLoi}`,
        });
      }
    }
  }

  for (let i = 0; i < logs.length; i++) {
    const log = logs[i];
    const isGiuong = log.TEN_DICH_VU != null && String(log.TEN_DICH_VU).toLowerCase().includes('giường');
    const itemName = String(log.TEN_DICH_VU || '');
    const maBa = String(log.MA_BA || '');
    const hoTen = String(log.HO_TEN || '');
    const thanhTien = log.THANH_TIEN_BV;
    const groupId = `S_${i}`;

    checkAction(groupId, itemName, maBa, hoTen, thanhTien, log.MA_BAC_SI, log.NGAY_YL, 'Chỉ định DVKT', isGiuong);

    if (!isGiuong) {
      checkAction(groupId, itemName, maBa, hoTen, thanhTien, log.NGUOI_THUC_HIEN, log.NGAY_TH_YL, 'Thực hiện DVKT', isGiuong, log.NGAY_KQ);
    }
  }

  for (let i = 0; i < medicineLogs.length; i++) {
    const mLog = medicineLogs[i];
    const itemName = String(mLog.TEN_THUOC || '');
    const maBa = String(mLog.MA_BA || '');
    const hoTen = String(mLog.HO_TEN || '');
    const thanhTien = mLog.THANH_TIEN_BV;
    const groupId = `M_${i}`;

    checkAction(groupId, itemName, maBa, hoTen, thanhTien, mLog.MA_BAC_SI, mLog.NGAY_YL, 'Chỉ định thuốc', false);
  }

  return Array.from(errorsMap.values());
}

export function exportErrorsToExcel(errors: ErrorLog[]) {
  const wsData = errors.map((err, idx) => ({
    'STT': idx + 1,
    'Tên Nhân Viên': err.TEN_NHANVIEN,
    'Mã CCHN': err.MACCHN,
    'Tên Dịch Vụ': err.TEN_DICH_VU,
    'Họ Tên Bệnh Nhân': err.HO_TEN,
    'Mã Bệnh Án': err.MA_BA,
    'Thành Tiền': err.THANH_TIEN,
    'Loại Hành Động': err.LOAI_HANH_DONG,
    'Thời Gian Ghi Nhận': err.THOI_GIAN_FORMATTED,
    'Cảnh Báo Lỗi': err.LOAI_LOI
  }));

  const worksheet = XLSX.utils.json_to_sheet(wsData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh Sach Loi');
  
  XLSX.writeFile(workbook, 'Danh_Sach_Canh_Bao_Loi.xlsx');
}
