'use client'

import { useEffect, useMemo, useState } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { accounts as baseAccounts, bitgetTrades, daily, depositRecords, equity, exchanges, monthly, type Account, type DepositRecord, type ExchangeKey } from '../lib/data'

type Lang = 'ko' | 'en'
type Period = '7D' | '30D' | '90D' | 'ALL'
type ManualState = Record<'mt5' | 'orangex', { asset: string; today: string; month: string; winRate: string; trades: string }>
type ManualDepositDraft = Record<'bitget' | 'mt5' | 'orangex', { type: '입금' | '출금'; amount: string; time: string; memo: string }>
type BitgetState = {
  status: '연결 전' | '연결 중' | '연결 완료' | '연결 오류'
  asset: number | null
  message: string
  positions: any[]
  fills: any[]
}

const money = (n: number) => `${n < 0 ? '-' : ''}$${Math.abs(Math.round(n)).toLocaleString()}`
const signed = (n: number) => `${n >= 0 ? '+' : '-'}$${Math.abs(Math.round(n)).toLocaleString()}`
const pct = (profit: number, asset: number) => `${profit >= 0 ? '+' : '-'}${asset > 0 ? ((Math.abs(profit) / asset) * 100).toFixed(2) : '0.00'}%`
const toNum = (v: string | number | undefined | null, fallback = 0) => {
  const n = Number(String(v ?? '').replaceAll(',', ''))
  return Number.isFinite(n) ? n : fallback
}

const defaultManual: ManualState = {
  mt5: { asset: '5120', today: '126', month: '980', winRate: '71', trades: '76' },
  orangex: { asset: '620', today: '-18', month: '74', winRate: '59', trades: '22' },
}

const defaultBitget: BitgetState = {
  status: '연결 전',
  asset: null,
  message: 'Vercel 환경변수 기반으로 조회합니다.',
  positions: [],
  fills: [],
}

const defaultDepositDrafts: ManualDepositDraft = {
  bitget: { type: '입금', amount: '', time: '', memo: '' },
  mt5: { type: '입금', amount: '', time: '', memo: '' },
  orangex: { type: '입금', amount: '', time: '', memo: '' },
}

function readBitgetAsset(payload: any) {
  const rows = payload?.accounts?.data?.data
  if (!Array.isArray(rows)) return null
  const usdt = rows.find((r: any) => String(r.marginCoin || r.coin || '').toUpperCase() === 'USDT') || rows[0]
  if (!usdt) return null
  const candidates = [usdt.usdtEquity, usdt.equity, usdt.accountEquity, usdt.marginBalance, usdt.available, usdt.availableBalance]
  for (const value of candidates) {
    const n = Number(value)
    if (Number.isFinite(n)) return n
  }
  return null
}

function readPositions(payload: any) {
  const rows = payload?.positions?.data?.data
  if (!Array.isArray(rows)) return []
  return rows.filter((p: any) => Math.abs(toNum(p.total ?? p.available ?? p.holdSideSize ?? p.size, 0)) > 0)
}

function readFills(payload: any) {
  const rows = payload?.fills?.data?.data
  if (Array.isArray(rows)) return rows.slice(0, 12)
  return []
}

export default function Page() {
  const [selected, setSelected] = useState<ExchangeKey>('all')
  const [lang, setLang] = useState<Lang>('ko')
  const [period, setPeriod] = useState<Period>('30D')
  const [manual, setManual] = useState<ManualState>(defaultManual)
  const [bitget, setBitget] = useState<BitgetState>(defaultBitget)
  const [journal, setJournal] = useState('')
  const [manualDeposits, setManualDeposits] = useState<DepositRecord[]>(depositRecords)
  const [depositDrafts, setDepositDrafts] = useState<ManualDepositDraft>(defaultDepositDrafts)

  const fetchBitget = async () => {
    try {
      setBitget((prev) => ({ ...prev, status: '연결 중', message: '비트겟 자산/포지션/체결을 불러오는 중입니다.' }))
      const res = await fetch('/api/bitget', { cache: 'no-store' })
      const payload = await res.json()

      if (!res.ok || !payload?.ok || !payload?.accounts?.ok) {
        setBitget({ status: '연결 오류', asset: null, message: payload?.accounts?.data?.msg || payload?.error || 'Bitget API 응답 오류', positions: [], fills: [] })
        return
      }

      const asset = readBitgetAsset(payload)
      const positions = readPositions(payload)
      const fills = readFills(payload)
      setBitget({
        status: '연결 완료',
        asset,
        positions,
        fills,
        message: `비트겟 조회 완료 · 포지션 ${positions.length}개 · 체결 ${fills.length}건`,
      })
    } catch (error) {
      setBitget({ status: '연결 오류', asset: null, message: error instanceof Error ? error.message : '알 수 없는 오류', positions: [], fills: [] })
    }
  }

  useEffect(() => {
    const savedManual = window.localStorage.getItem('profitflow-manual')
    const savedJournal = window.localStorage.getItem('profitflow-journal')
    const savedDeposits = window.localStorage.getItem('profitflow-manual-deposits')
    if (savedManual) setManual(JSON.parse(savedManual))
    if (savedJournal) setJournal(savedJournal)
    if (savedDeposits) setManualDeposits(JSON.parse(savedDeposits))
    fetchBitget()
  }, [])

  const accounts = useMemo<Account[]>(() => {
    return baseAccounts.map((a) => {
      if (a.key === 'bitget') return { ...a, asset: bitget.asset ?? a.asset }
      if (a.key === 'mt5' || a.key === 'orangex') {
        const m = manual[a.key]
        return { ...a, asset: toNum(m.asset, a.asset), today: toNum(m.today, a.today), month: toNum(m.month, a.month), winRate: toNum(m.winRate, a.winRate), trades: toNum(m.trades, a.trades) }
      }
      return a
    })
  }, [manual, bitget.asset])

  const selectedAccounts = selected === 'all' ? accounts : accounts.filter((a) => a.key === selected)
  const totalAsset = selectedAccounts.reduce((s, a) => s + a.asset, 0)
  const today = selectedAccounts.reduce((s, a) => s + a.today, 0)
  const month = selectedAccounts.reduce((s, a) => s + a.month, 0)
  const tradesCount = selectedAccounts.reduce((s, a) => s + a.trades, 0)
  const avgWin = Math.round(selectedAccounts.reduce((s, a) => s + a.winRate, 0) / selectedAccounts.length)
  const equityData = period === '7D' ? equity.slice(-7) : period === '30D' ? equity.slice(-30) : period === '90D' ? equity.slice(-90) : equity
  const dailyData = period === '7D' ? daily.slice(-7) : daily
  const key = selected

  const aiList = useMemo(() => {
    const map = {
      bitget: `비트겟은 API 계좌입니다. 현재 ${bitget.status}이며, 실제 포지션 ${bitget.positions.length}개와 최근 체결 ${bitget.fills.length}건을 하단에서 분리해 확인합니다.`,
      mt5: `메타트레이더는 수동 입력 계좌입니다. 오늘 손익률은 ${pct(toNum(manual.mt5.today), toNum(manual.mt5.asset))}, 월간 손익률은 ${pct(toNum(manual.mt5.month), toNum(manual.mt5.asset))}입니다.`,
      orangex: `오렌지X는 자동매매 수동 기록 계좌입니다. 오늘 손익률은 ${pct(toNum(manual.orangex.today), toNum(manual.orangex.asset))}, 월간 손익률은 ${pct(toNum(manual.orangex.month), toNum(manual.orangex.asset))}입니다.`,
    }
    return selected === 'all' ? [map.bitget, map.mt5, map.orangex] : [map[selected as 'bitget' | 'mt5' | 'orangex']]
  }, [selected, manual, bitget.status, bitget.positions.length, bitget.fills.length])

  const saveManual = () => {
    window.localStorage.setItem('profitflow-manual', JSON.stringify(manual))
    window.localStorage.setItem('profitflow-manual-deposits', JSON.stringify(manualDeposits))
    alert('수동 계좌 입력값 저장 완료')
  }

  const saveJournal = () => {
    window.localStorage.setItem('profitflow-journal', journal)
    alert('매매일지 저장 완료')
  }

  const addManualDeposit = (exchange: 'bitget' | 'mt5' | 'orangex') => {
    const draft = depositDrafts[exchange]
    const raw = toNum(draft.amount)
    if (!raw) {
      alert('금액을 입력해줘')
      return
    }
    const row: DepositRecord = {
      exchange,
      type: draft.type,
      amount: draft.type === '출금' ? -Math.abs(raw) : Math.abs(raw),
      time: draft.time || new Date().toLocaleDateString('ko-KR'),
      memo: draft.memo || `${draft.type} 기록`,
    }
    const next = [row, ...manualDeposits]
    setManualDeposits(next)
    window.localStorage.setItem('profitflow-manual-deposits', JSON.stringify(next))
    setDepositDrafts({ ...depositDrafts, [exchange]: { ...defaultDepositDrafts[exchange] } })
  }

  const removeManualDeposit = (index: number) => {
    const next = manualDeposits.filter((_, i) => i !== index)
    setManualDeposits(next)
    window.localStorage.setItem('profitflow-manual-deposits', JSON.stringify(next))
  }

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <main className="shell">
      <div className="orb orbA" />
      <div className="orb orbB" />
      <nav className="nav glass">
        <button className="brand" onClick={() => scrollTo('dashboard')}><span>PROFITFLOW</span><b>AI</b></button>
        <div className="navLinks">
          <button onClick={() => scrollTo('dashboard')}>대시보드</button>
          <button onClick={() => scrollTo('accounts')}>계좌</button>
          <button onClick={() => scrollTo('records')}>기록관리</button>
          <button onClick={() => scrollTo('analysis')}>분석</button>
        </div>
        <button className="lang" onClick={() => setLang(lang === 'ko' ? 'en' : 'ko')}>{lang === 'ko' ? '한국어' : 'EN'}</button>
      </nav>

      <section className="hero" id="dashboard">
        <div className="heroText">
          <p className="eyebrow">BITGET API · MT5 MANUAL · ORANGEX MANUAL</p>
          <h1>{lang === 'ko' ? '통합 트레이딩 자산관리' : 'Trading Portfolio OS'}</h1>
          <p className="sub">비트겟은 API로 실제 자산/포지션/체결내역을 확인하고, 메타트레이더와 오렌지X는 자산·손익·입출금을 수동 관리합니다.</p>
          <div className="actions"><button onClick={() => scrollTo('connect')}>계좌 연결/입력</button><button className="ghost" onClick={() => scrollTo('records')}>기록관리 보기</button></div>
        </div>
        <div className="phone glass">
          <div className="phoneTop"><span /> <b>{money(totalAsset)}</b></div>
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={equityData}>
              <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#48ffb6" stopOpacity={0.75}/><stop offset="95%" stopColor="#48ffb6" stopOpacity={0}/></linearGradient></defs>
              <Area type="monotone" dataKey={key} stroke="#48ffb6" fill="url(#g)" strokeWidth={3}/><Tooltip contentStyle={{background:'#0b1110',border:'1px solid #24443a',borderRadius:16}}/>
            </AreaChart>
          </ResponsiveContainer>
          <div className="miniGrid"><span>오늘 {signed(today)} · {pct(today, totalAsset)}</span><span>월간 {pct(month, totalAsset)}</span></div>
        </div>
      </section>

      <section className="tabs glass">
        {exchanges.map((ex) => <button key={ex.key} className={selected === ex.key ? 'active' : ''} onClick={() => setSelected(ex.key)}>{lang === 'ko' ? ex.ko : ex.en}</button>)}
      </section>

      <section className="cards">
        <Stat title="총 자산" value={money(totalAsset)} hint="선택 계좌 합산" />
        <Stat title="오늘 손익" value={signed(today)} hint={`자산 대비 ${pct(today, totalAsset)}`} good={today >= 0} />
        <Stat title="이번달 손익" value={signed(month)} hint={`자산 대비 ${pct(month, totalAsset)}`} good={month >= 0} />
        <Stat title="승률" value={`${avgWin}%`} hint={`${tradesCount}회 거래 기준`} />
      </section>

      <section className="grid" id="analysis">
        <div className="panel big glass">
          <div className="panelHead">
            <div><p>ASSET CURVE</p><h2>자산곡선</h2></div>
            <div className="periods">{(['7D','30D','90D','ALL'] as Period[]).map((p) => <button key={p} className={period === p ? 'on' : ''} onClick={() => setPeriod(p)}>{p}</button>)}</div>
          </div>
          <ResponsiveContainer width="100%" height={285}>
            <AreaChart data={equityData}><CartesianGrid strokeDasharray="3 3" stroke="#1e2a2f"/><XAxis dataKey="day" stroke="#79838a"/><YAxis stroke="#79838a"/><Tooltip contentStyle={{background:'#09100f',border:'1px solid #253b35',borderRadius:16}}/><Area type="monotone" dataKey={key} stroke="#f97316" fill="#f9731630" strokeWidth={3}/></AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="panel glass">
          <div className="panelHead"><div><p>AI INSIGHT</p><h2>AI 분석</h2></div><span className="badge">3 ACCOUNTS</span></div>
          <div className="insightList">{aiList.map((text, i) => <div className="insight" key={i}><b>{selected === 'all' ? exchanges[i + 1].ko : exchanges.find(e => e.key === selected)?.ko}</b><p>{text}</p></div>)}</div>
        </div>
      </section>

      <section className="grid second">
        <div className="panel glass">
          <div className="panelHead"><div><p>DAILY PNL</p><h2>일간 손익</h2></div><span className="badge">{period}</span></div>
          <ResponsiveContainer width="100%" height={245}><BarChart data={dailyData}><XAxis dataKey="day" stroke="#79838a"/><YAxis stroke="#79838a"/><Tooltip contentStyle={{background:'#09100f',border:'1px solid #253b35',borderRadius:16}}/><Bar dataKey={key} fill="#48ffb6" radius={[10,10,0,0]}/></BarChart></ResponsiveContainer>
        </div>
        <div className="panel glass">
          <div className="panelHead"><div><p>MONTHLY PNL</p><h2>월간 손익</h2></div></div>
          <ResponsiveContainer width="100%" height={245}><AreaChart data={monthly}><XAxis dataKey="month" stroke="#79838a"/><YAxis stroke="#79838a"/><Tooltip contentStyle={{background:'#09100f',border:'1px solid #253b35',borderRadius:16}}/><Area type="monotone" dataKey={key} stroke="#a78bfa" fill="#a78bfa30" strokeWidth={3}/></AreaChart></ResponsiveContainer>
        </div>
      </section>

      <section className="accounts" id="accounts">
        {selectedAccounts.map((a) => <div className="account glass" key={a.key}><div><p>{a.ko}</p><h3>{money(a.asset)}</h3></div><span className={a.today >= 0 ? 'green' : 'red'}>{signed(a.today)} · {pct(a.today, a.asset)}</span><small>{a.mode === 'api' ? bitget.status : '수동 입력 계좌'} · 월간 {signed(a.month)} · {pct(a.month, a.asset)} · 승률 {a.winRate}%</small></div>)}
      </section>

      <section className="grid second" id="connect">
        <div className="panel glass connectBox">
          <div className="panelHead"><div><p>BITGET API</p><h2>비트겟 API 연결</h2></div><span className="badge">{bitget.status}</span></div>
          <div className="apiStatus"><b>{bitget.asset !== null ? money(bitget.asset) : '자산 대기중'}</b><p>{bitget.message}</p></div>
          <button onClick={fetchBitget}>비트겟 자산/포지션/체결 새로고침</button>
          <small>API Key는 화면에 입력하지 않습니다. Vercel 환경변수에 저장된 키로 서버에서만 조회합니다.</small>
        </div>
        <div className="panel glass connectBox">
          <div className="panelHead"><div><p>MANUAL ACCOUNTS</p><h2>MT5 / 오렌지X 수동 입력</h2></div></div>
          {(['mt5','orangex'] as const).map((k) => {
            const asset = toNum(manual[k].asset)
            const todayPnl = toNum(manual[k].today)
            const monthPnl = toNum(manual[k].month)
            return <div className="manualGroup" key={k}>
              <b>{k === 'mt5' ? '메타트레이더' : '오렌지X'}</b>
              <div className="manualGrid">
                <input placeholder="자산" value={manual[k].asset} onChange={(e) => setManual({...manual, [k]: {...manual[k], asset: e.target.value}})} />
                <input placeholder="오늘 손익" value={manual[k].today} onChange={(e) => setManual({...manual, [k]: {...manual[k], today: e.target.value}})} />
                <input placeholder="월간 손익" value={manual[k].month} onChange={(e) => setManual({...manual, [k]: {...manual[k], month: e.target.value}})} />
                <input placeholder="승률" value={manual[k].winRate} onChange={(e) => setManual({...manual, [k]: {...manual[k], winRate: e.target.value}})} />
              </div>
              <div className="calcLine">오늘 수익률 {pct(todayPnl, asset)} · 월간 수익률 {pct(monthPnl, asset)}</div>
            </div>
          })}
          <button onClick={saveManual}>수동 입력 저장</button>
        </div>
      </section>

      <section className="grid second records" id="records">
        <div className="panel glass">
          <div className="panelHead"><div><p>BITGET POSITIONS</p><h2>실제 포지션</h2></div><span className="badge">BITGET ONLY</span></div>
          {bitget.positions.length === 0 ? <p className="empty">현재 표시할 비트겟 포지션이 없습니다.</p> : bitget.positions.map((p, i) => <div className="record" key={i}><div><b>{p.symbol || p.instId || 'USDT-FUTURES'}</b><span>{p.holdSide || p.posSide || p.side || 'position'} · 수량 {p.total || p.available || p.size || '-'}</span></div><strong className={toNum(p.unrealizedPL ?? p.pnl ?? p.achievedProfits) >= 0 ? 'green' : 'red'}>{signed(toNum(p.unrealizedPL ?? p.pnl ?? p.achievedProfits))}</strong></div>)}
        </div>
        <div className="panel glass">
          <div className="panelHead"><div><p>BITGET TRADES</p><h2>매매내역</h2></div><span className="badge">BITGET ONLY</span></div>
          {(bitget.fills.length ? bitget.fills : bitgetTrades).map((t: any, i) => {
            const market = t.symbol || t.market || t.instId || 'BITGET'
            const side = t.side || t.tradeSide || 'Trade'
            const pnl = toNum(t.profit || t.pnl || t.fillPnl || t.feeDetail?.profit, t.pnl ?? 0)
            const time = t.cTime ? new Date(Number(t.cTime)).toLocaleString('ko-KR') : t.time || '최근 기록'
            return <div className="record" key={i}><div><b>{market}</b><span>{time} · {side}</span></div><strong className={pnl >= 0 ? 'green' : 'red'}>{signed(pnl)}</strong></div>
          })}
        </div>
      </section>

      <section className="grid second records">
        <div className="panel glass depositPanel">
          <div className="panelHead"><div><p>DEPOSIT / WITHDRAWAL</p><h2>입출금 관리</h2></div><span className="badge">ALL MANUAL</span></div>
          <div className="depositNote"><b>입출금은 전부 수동 기록</b><span>API 영향 없음</span><small>비트겟도 출금 권한 없이 안전하게 운용하기 위해 수동 기록으로 관리합니다.</small></div>

          <div className="manualDepositWrap">
            {(['bitget','mt5','orangex'] as const).map((exchange) => <div className="manualDeposit" key={exchange}>
              <b>{exchange === 'bitget' ? '비트겟' : exchange === 'mt5' ? '메타트레이더' : '오렌지X'} 입출금 수동 기록</b>
              <div className="depositInputGrid">
                <select value={depositDrafts[exchange].type} onChange={(e) => setDepositDrafts({ ...depositDrafts, [exchange]: { ...depositDrafts[exchange], type: e.target.value as '입금' | '출금' } })}>
                  <option value="입금">입금</option>
                  <option value="출금">출금</option>
                </select>
                <input placeholder="금액" value={depositDrafts[exchange].amount} onChange={(e) => setDepositDrafts({ ...depositDrafts, [exchange]: { ...depositDrafts[exchange], amount: e.target.value } })} />
                <input placeholder="날짜 예: 6월 18일" value={depositDrafts[exchange].time} onChange={(e) => setDepositDrafts({ ...depositDrafts, [exchange]: { ...depositDrafts[exchange], time: e.target.value } })} />
                <input placeholder="메모" value={depositDrafts[exchange].memo} onChange={(e) => setDepositDrafts({ ...depositDrafts, [exchange]: { ...depositDrafts[exchange], memo: e.target.value } })} />
                <button onClick={() => addManualDeposit(exchange)}>추가</button>
              </div>
            </div>)}
          </div>

          {manualDeposits.filter((r) => selected === 'all' || r.exchange === selected).map((r, i) => <div className="record" key={`manual-${i}`}><div><b>{exchanges.find(e => e.key === r.exchange)?.ko} · {r.type}</b><span>{r.time} · {r.memo}</span></div><div className="recordActions"><strong className={r.amount >= 0 ? 'green' : 'red'}>{signed(r.amount)}</strong><button onClick={() => removeManualDeposit(i)}>삭제</button></div></div>)}
        </div>
        <div className="panel glass journalBox">
          <div className="panelHead"><div><p>TRADING JOURNAL</p><h2>매매일지 메모</h2></div><span className="badge">LOCAL SAVE</span></div>
          <textarea value={journal} onChange={(e) => setJournal(e.target.value)} placeholder="예: 오늘 BTC 롱은 진입 근거는 좋았지만, 추가진입 간격이 좁았다. 다음에는 4개 포지션 전 -8% 기준 확인." />
          <button onClick={saveJournal}>매매일지 저장</button>
          <small>브라우저 localStorage에 저장됩니다. 나중에 Supabase 붙이면 계정별 영구 저장으로 바꿀 수 있습니다.</small>
        </div>
      </section>
    </main>
  )
}

function Stat({ title, value, hint, good = true }: { title: string; value: string; hint: string; good?: boolean }) {
  return <div className="stat glass"><p>{title}</p><h2 className={good ? 'green' : 'red'}>{value}</h2><span>{hint}</span></div>
}
