import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PROFITFLOW AI',
  description: 'Korean trading asset dashboard for Bitget, MT5 and Binance'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
