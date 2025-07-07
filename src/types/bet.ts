export interface BetResponseDto {
  id: number;
  amount: number;
  status: string;
  win_amount?: number | null;
  created_at: string;
  completed_at?: string | null;
}

export interface BetDetailResponseDto {
  id: number;
  amount: number;
  status: string;
  win_amount?: number | null;
  created_at: string;
  completed_at?: string | null;
}


export interface BetsListResponse {
  bets: BetResponseDto[];
}

export interface CreateBetRequestDto {
  amount: number;
}

export interface CreateBetResponseDto {
  id: number;
  amount: number;
  status: string;
  created_at: string;
}
