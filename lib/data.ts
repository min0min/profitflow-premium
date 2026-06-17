export type ExchangeKey = 'all' | 'bitget' | 'mt5' | 'binance'

export const exchanges = [
  { key: 'all', ko: '전체', en: 'All', color: '#f97316' },
  { key: 'bitget', ko: '비트겟', en: 'Bitget', color: '#45f7b2' },
  { key: 'mt5', ko: '메타트레이더', en: 'MetaTrader', color: '#a78bfa' },
  { key: 'binance', ko: '바이낸스', en: 'Binance', color: '#facc15' }
] as const

export const accounts = [
  { key: 'bitget', name: 'Bitget Futures', ko: '비트겟 선물', asset: 2380, today: 84, month: 640, roi: 12.8, winRate: 64, trades: 88 },
  { key: 'mt5', name: 'MetaTrader 5', ko: '메타트레이더 5', asset: 8120, today: 126, month: 1320, roi: 19.4, winRate: 71, trades: 124 },
  { key: 'binance', name: 'Binance Futures', ko: '바이낸스 선물', asset: 1840, today: -22, month: 140, roi: 4.1, winRate: 57, trades: 42 }
]

export const daily = [
  { day: '06/01', bitget: 42, mt5: 80, binance: -12, all: 110 },
  { day: '06/02', bitget: -18, mt5: 45, binance: 11, all: 38 },
  { day: '06/03', bitget: 66, mt5: 120, binance: 30, all: 216 },
  { day: '06/04', bitget: 34, mt5: -70, binance: 18, all: -18 },
  { day: '06/05', bitget: 92, mt5: 160, binance: 22, all: 274 },
  { day: '06/06', bitget: -25, mt5: 60, binance: -8, all: 27 },
  { day: '06/07', bitget: 84, mt5: 126, binance: -22, all: 188 }
]

export const equity = [
  { day: '1일', value: 10000 }, { day: '2일', value: 10110 }, { day: '3일', value: 10148 },
  { day: '4일', value: 10364 }, { day: '5일', value: 10346 }, { day: '6일', value: 10620 },
  { day: '7일', value: 10647 }, { day: '8일', value: 10835 }, { day: '9일', value: 11010 },
  { day: '10일', value: 11290 }, { day: '11일', value: 11960 }, { day: '12일', value: 12340 }
]

export const monthly = [
  { month: '1월', all: 420, bitget: 180, mt5: 260, binance: -20 },
  { month: '2월', all: -140, bitget: -90, mt5: 40, binance: -90 },
  { month: '3월', all: 870, bitget: 220, mt5: 560, binance: 90 },
  { month: '4월', all: 540, bitget: 170, mt5: 310, binance: 60 },
  { month: '5월', all: 1220, bitget: 360, mt5: 720, binance: 140 },
  { month: '6월', all: 2100, bitget: 640, mt5: 1320, binance: 140 }
]

export const trades = [
  { exchange: 'bitget', market: 'BTCUSDT', side: 'Long', pnl: 32.4, roi: 4.2, time: '오늘 09:24', result: 'WIN' },
  { exchange: 'mt5', market: 'XAUUSD', side: 'Short', pnl: 76.8, roi: 2.9, time: '오늘 11:18', result: 'WIN' },
  { exchange: 'binance', market: 'ETHUSDT', side: 'Long', pnl: -22.1, roi: -1.8, time: '오늘 13:02', result: 'LOSS' },
  { exchange: 'bitget', market: 'SOLUSDT', side: 'Short', pnl: 51.6, roi: 7.1, time: '어제 21:45', result: 'WIN' },
  { exchange: 'mt5', market: 'XAUUSD', side: 'Long', pnl: -38.5, roi: -1.4, time: '어제 23:10', result: 'LOSS' },
  { exchange: 'mt5', market: 'XAUUSD', side: 'Short', pnl: 88.2, roi: 3.7, time: '06/15 16:21', result: 'WIN' }
]
