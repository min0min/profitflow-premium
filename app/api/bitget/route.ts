import { NextResponse } from 'next/server'
import crypto from 'crypto'

const BASE_URL = 'https://api.bitget.com'

function sign(timestamp: string, method: string, requestPath: string, body = '') {
  const secret = process.env.BITGET_API_SECRET
  if (!secret) throw new Error('BITGET_API_SECRET is missing')
  const prehash = timestamp + method.toUpperCase() + requestPath + body
  return crypto.createHmac('sha256', secret).update(prehash).digest('base64')
}

async function bitgetGet(path: string, query: Record<string, string> = {}) {
  const apiKey = process.env.BITGET_API_KEY
  const passphrase = process.env.BITGET_API_PASSPHRASE
  if (!apiKey || !passphrase) throw new Error('Bitget environment variables are missing')

  const queryString = new URLSearchParams(query).toString()
  const requestPath = queryString ? `${path}?${queryString}` : path
  const timestamp = Date.now().toString()
  const signature = sign(timestamp, 'GET', requestPath)

  const res = await fetch(`${BASE_URL}${requestPath}`, {
    method: 'GET',
    headers: {
      'ACCESS-KEY': apiKey,
      'ACCESS-SIGN': signature,
      'ACCESS-TIMESTAMP': timestamp,
      'ACCESS-PASSPHRASE': passphrase,
      'Content-Type': 'application/json',
      locale: 'en-US',
    },
    cache: 'no-store',
  })

  const data = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, data }
}

export async function GET() {
  try {
    const accounts = await bitgetGet('/api/v2/mix/account/accounts', { productType: 'USDT-FUTURES' })
    const positions = await bitgetGet('/api/v2/mix/position/all-position', { productType: 'USDT-FUTURES', marginCoin: 'USDT' })
    const fills = await bitgetGet('/api/v2/mix/order/fills', { productType: 'USDT-FUTURES', limit: '20' })
    return NextResponse.json({ ok: true, source: 'bitget', accounts, positions, fills })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
