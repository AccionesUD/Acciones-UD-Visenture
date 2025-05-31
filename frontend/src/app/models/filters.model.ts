
export interface FilterOption {
  label: string;
  value: string;
}

export interface SortOption {
  label: string;
  value: string;
  direction: 'asc' | 'desc';
  property: string;
}

export interface PerformanceFilterOption {
  label: string;
  value: string;
  min?: number;
  max?: number;
}