export interface Benefit {
  id: string;
  title: string;
  description: string;
  region: string | null;
  minAge: number | null;
  maxAge: number | null;
  incomeRange: string | null;
  url: string;
  source: string;
}
