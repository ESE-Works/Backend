export interface Benefit {
  id: string;
  title: string;
  description: string;
  region: string | null;
  minAge: number | null;
  maxAge: number | null;
  incomeRange: string | null;
  /** 신청 마감일 (YYYY-MM-DD). 상시 모집 등 마감이 없으면 null */
  applicationDeadline: string | null;
  url: string;
  source: string;
}
