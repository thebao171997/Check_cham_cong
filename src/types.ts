export interface TimesheetRecord {
  ID?: string;
  TEN_NHANVIEN?: string;
  MACCHN?: string;
  THANG?: number;
  NAM?: number;
  [key: string]: any; // To allow NGAY_1 to NGAY_31
}

export interface ServiceLogRecord {
  TEN_DICH_VU?: string;
  MA_KHOA?: string;
  MA_BAC_SI?: string;
  NGUOI_THUC_HIEN?: string;
  NGAY_YL?: string;
  NGAY_TH_YL?: string;
  NGAY_KQ?: string;
  MA_BA?: string;
  HO_TEN?: string;
  THANH_TIEN_BV?: string | number;
}

export interface MedicineLogRecord {
  TEN_THUOC?: string;
  THANH_TIEN_BV?: string | number;
  MA_BAC_SI?: string;
  NGAY_YL?: string;
  MA_BA?: string;
  HO_TEN?: string;
}

export interface ErrorLog {
  TEN_NHANVIEN: string;
  MACCHN: string;
  TEN_DICH_VU: string;
  MA_BA: string;
  HO_TEN: string;
  THANH_TIEN?: string | number;
  LOAI_HANH_DONG: string;
  THOI_GIAN: string; // original
  THOI_GIAN_FORMATTED: string;
  LOAI_LOI: string;
}
