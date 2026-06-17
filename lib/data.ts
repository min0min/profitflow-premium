export type ExchangeKey = 'all' | 'bitget' | 'mt5' | 'orangex'

export type Account = {
  key: Exclude<ExchangeKey, 'all'>
  ko: string
  en: string
  mode: 'api' | 'manual'
  asset: number
  today: number
  month: number
  trades: number
  winRate: number
}

export type DepositRecord = {
  exchange: Exclude<ExchangeKey, 'all'>
  type: '입금' | '출금'
  amount: number
  time: string
  memo: string
}

export const exchanges: { key: ExchangeKey; ko: string; en: string; mode?: 'api' | 'manual' }[] = [
  { key: 'all', ko: '전체', en: 'All' },
  { key: 'bitget', ko: '비트겟', en: 'Bitget', mode: 'api' },
  { key: 'mt5', ko: '메타트레이더', en: 'MetaTrader', mode: 'manual' },
  { key: 'orangex', ko: '오렌지X', en: 'OrangeX', mode: 'manual' },
]

export const accounts: Account[] = [
  { key: 'bitget', ko: '비트겟 API 계좌', en: 'Bitget API Account', mode: 'api', asset: 2380, today: 42, month: 318, trades: 48, winRate: 64 },
  { key: 'mt5', ko: '메타트레이더 수동 계좌', en: 'MetaTrader Manual Account', mode: 'manual', asset: 5120, today: 126, month: 980, trades: 76, winRate: 71 },
  { key: 'orangex', ko: '오렌지X 수동 계좌', en: 'OrangeX Manual Account', mode: 'manual', asset: 620, today: -18, month: 74, trades: 22, winRate: 59 },
]

export const equity = Array.from({ length: 90 }, (_, i) => {
  const bitget = 1850 + i * 6 + Math.sin(i / 4) * 70 + (i > 58 ? 130 : 0)
  const mt5 = 3900 + i * 18 + Math.sin(i / 6) * 130 + (i > 42 ? 310 : 0)
  const orangex = 520 + i * 2 + Math.cos(i / 5) * 26
  return {
    day: `${i + 1}`,
    bitget: Math.round(bitget),
    mt5: Math.round(mt5),
    orangex: Math.round(orangex),
    all: Math.round(bitget + mt5 + orangex),
  }
})

export const daily = Array.from({ length: 30 }, (_, i) => {
  const bitget = Math.round(Math.sin(i / 2) * 28 + 18)
  const mt5 = Math.round(Math.cos(i / 3) * 55 + 42)
  const orangex = Math.round(Math.sin(i / 4) * 14 + 3)
  return {
    day: `${i + 1}`,
    bitget,
    mt5,
    orangex,
    all: bitget + mt5 + orangex,
  }
})

export const monthly = [
  { month: '1월', bitget: 210, mt5: 420, orangex: 40, all: 670 },
  { month: '2월', bitget: -90, mt5: 360, orangex: 25, all: 295 },
  { month: '3월', bitget: 310, mt5: 510, orangex: 68, all: 888 },
  { month: '4월', bitget: 180, mt5: 690, orangex: -34, all: 836 },
  { month: '5월', bitget: 440, mt5: 980, orangex: 74, all: 1494 },
  { month: '6월', bitget: 318, mt5: 980, orangex: 74, all: 1372 },
]

// 하단 매매내역은 비트겟만 표기합니다. MT5/오렌지X 자동매매 내역은 의도적으로 제외.
export const bitgetTrades = [
  { market: 'BTCUSDT', side: 'Long', time: '오늘 14:20', pnl: 36, result: 'WIN' },
  { market: 'ETHUSDT', side: 'Short', time: '어제 23:18', pnl: -12, result: 'LOSS' },
  { market: 'SOLUSDT', side: 'Long', time: '어제 19:05', pnl: 24, result: 'WIN' },
]

// 비트겟 입출금은 API로만 불러옵니다. 아래 기본값은 MT5/오렌지X 수동 기록 예시입니다.
export const depositRecords: DepositRecord[] = [
  { exchange: 'mt5', type: '입금', amount: 3000, time: '6월 10일', memo: '금 자동매매 증거금' },
  { exchange: 'mt5', type: '출금', amount: -400, time: '6월 17일', memo: '월간 수익 일부 회수' },
  { exchange: 'orangex', type: '입금', amount: 700, time: '6월 12일', memo: '봇 테스트 자금' },
]
