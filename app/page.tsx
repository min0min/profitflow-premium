'use client'

import { useEffect, useMemo, useState } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { accounts as baseAccounts, daily, equity, exchanges, monthly, trades, type Account, type ExchangeKey } from '../lib/data'

type Lang = 'ko' | 'en'
type Period = '7D' | '30D' | '90D' | 'ALL'
type ManualState = Record<'mt5' | 'orangex', { asset: string; today: string; month: string; winRate: string; trades: string }>

type BitgetConfig = { apiKey: string; secretKey: string; passphrase: string; status: '미연결' | '연결 준비 완료' }

const money = (n: number) => `${n < 0 ? '-' : ''}$${Math.abs(Math.round(n)).toLocaleString()}`
const signed = (n: number) => `${n >= 0 ? '+' : '-'}$${Math.abs(Math.round(n)).toLocaleString()}`
const toNum = (v: string, fallback: number) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

const defaultManual: ManualState = {
  mt5: { asset: '5120', today: '126', month: '980', winRate: '71', trades: '76' },
  orangex: { asset: '620', today: '-18', month: '74', winRate: '59', trades: '22' },
}

const defaultBitget: BitgetConfig = { apiKey: '', secretKey: '', passphrase: '', status: '미연결' }

export default function Page() {
  const [selected, setSelected] = useState<ExchangeKey>('all')
  const [lang, setLang] = useState<Lang>('ko')
  const [period, setPeriod] = useState<Period>('30D')
  const [manual, setManual] = useState<ManualState>(defaultManual)
  const [bitget, setBitget] = useState<BitgetConfig>(defaultBitget)

  useEffect(() => {
    const savedManual = window.localStorage.getItem('profitflow-manual')
    const savedBitget = window.localStorage.getItem('profitflow-bitget-config')
    if (savedManual) setManual(JSON.parse(savedManual))
    if (savedBitget) setBitget(JSON.parse(savedBitget))
  }, [])

  const accounts = useMemo<Account[]>(() => {
    return baseAccounts.map((a) => {
      if (a.key === 'mt5' || a.key === 'orangex') {
        const m = manual[a.key]
        return {
          ...a,
          asset: toNum(m.asset, a.asset),
          today: toNum(m.today, a.today),
          month: toNum(m.month, a.month),
          winRate: toNum(m.winRate, a.winRate),
          trades: toNum(m.trades, a.trades),
        }
      }
      return a
    })
  }, [manual])

  const selectedAccounts = selected === 'all' ? accounts : accounts.filter((a) => a.key === selected)
  const totalAsset = selectedAccounts.reduce((s, a) => s + a.asset, 0)
  const today = selectedAccounts.reduce((s, a) => s + a.today, 0)
  const month = selectedAccounts.reduce((s, a) => s + a.month, 0)
  const tradesCount = selectedAccounts.reduce((s, a) => s + a.trades, 0)
  const avgWin = Math.round(selectedAccounts.reduce((s, a) => s + a.winRate, 0) / selectedAccounts.length)
  const viewTrades = selected === 'all' ? trades : trades.filter((t) => t.exchange === selected)
  const equityData = period === '7D' ? equity.slice(-7) : period === '30D' ? equity.slice(-30) : period === '90D' ? equity.slice(-90) : equity
  const dailyData = period === '7D' ? daily.slice(-7) : daily
  const key = selected

  const aiList = useMemo(() => {
    const map = {
      bitget: '비트겟은 API 자동 연결 대상입니다. 단기 회전 수익은 좋지만 알트 변동성이 크므로 거래량 급등 구간과 손절폭을 같이 체크하세요.',
      mt5: '메타트레이더는 수동 입력 계좌입니다. 현재 XAUUSD 수익 기여도가 높아 보이며, 추가진입 개수가 늘어나는 시간대만 따로 관리하면 안정성이 좋아집니다.',
      orangex: '오렌지X는 자동매매 수동 기록 계좌입니다. 봇 성과는 일간보다 주간·월간 누적으로 봐야 하며, 손실일에는 비중 확대를 피하는 게 좋습니다.',
    }
    return selected === 'all'
      ? [map.bitget, map.mt5, map.orangex]
      : [map[selected as 'bitget' | 'mt5' | 'orangex']]
  }, [selected])

  const saveManual = () => {
    window.localStorage.setItem('profitflow-manual', JSON.stringify(manual))
    alert('수동 계좌 입력값 저장 완료')
  }

  const saveBitget = () => {
    const next = { ...bitget, status: '연결 준비 완료' as const }
    setBitget(next)
    window.localStorage.setItem('profitflow-bitget-config', JSON.stringify(next))
    alert('비트겟 API 연결 정보가 저장되었습니다. 실제 서버 연동은 다음 단계에서 붙이면 됩니다.')
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
          <button onClick={() => scrollTo('trades')}>거래내역</button>
          <button onClick={() => scrollTo('analysis')}>분석</button>
        </div>
        <button className="lang" onClick={() => setLang(lang === 'ko' ? 'en' : 'ko')}>{lang === 'ko' ? '한국어' : 'EN'}</button>
      </nav>

      <section className="hero" id="dashboard">
        <div className="heroText">
          <p className="eyebrow">BITGET API · MT5 MANUAL · ORANGEX MANUAL</p>
          <h1>{lang === 'ko' ? '통합 트레이딩 자산관리' : 'Trading Portfolio OS'}</h1>
          <p className="sub">비트겟은 API 연결 준비, 메타트레이더와 오렌지X는 수동 입력으로 관리합니다. 계좌별 자산, 손익, 매매내역, AI분석, 기간별 그래프를 한 화면에서 봅니다.</p>
          <div className="actions"><button onClick={() => scrollTo('connect')}>API 연결 준비</button><button className="ghost" onClick={() => scrollTo('analysis')}>AI 분석 보기</button></div>
        </div>
        <div className="phone glass">
          <div className="phoneTop"><span /> <b>{money(totalAsset)}</b></div>
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={equityData}>
              <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#48ffb6" stopOpacity={0.75}/><stop offset="95%" stopColor="#48ffb6" stopOpacity={0}/></linearGradient></defs>
              <Area type="monotone" dataKey={key} stroke="#48ffb6" fill="url(#g)" strokeWidth={3}/><Tooltip contentStyle={{background:'#0b1110',border:'1px solid #24443a',borderRadius:16}}/>
            </AreaChart>
          </ResponsiveContainer>
          <div className="miniGrid"><span>오늘 {signed(today)}</span><span>승률 {avgWin}%</span></div>
        </div>
      </section>

      <section className="tabs glass">
        {exchanges.map((ex) => <button key={ex.key} className={selected === ex.key ? 'active' : ''} onClick={() => setSelected(ex.key)}>{lang === 'ko' ? ex.ko : ex.en}</button>)}
      </section>

      <section className="cards">
        <Stat title="총 자산" value={money(totalAsset)} hint="선택 계좌 합산" />
        <Stat title="오늘 손익" value={signed(today)} hint="일간 실현손익" good={today >= 0} />
        <Stat title="이번달 손익" value={signed(month)} hint="월간 누적손익" good={month >= 0} />
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
        {selectedAccounts.map((a) => <div className="account glass" key={a.key}><div><p>{a.ko}</p><h3>{money(a.asset)}</h3></div><span className={a.today >= 0 ? 'green' : 'red'}>{signed(a.today)}</span><small>{a.mode === 'api' ? 'API 연결 대상' : '수동 입력 계좌'} · 월간 {signed(a.month)} · 승률 {a.winRate}%</small></div>)}
      </section>

      <section className="grid second" id="connect">
        <div className="panel glass connectBox">
          <div className="panelHead"><div><p>BITGET API</p><h2>비트겟 API 연결 준비</h2></div><span className="badge">{bitget.status}</span></div>
          <input placeholder="API Key" value={bitget.apiKey} onChange={(e) => setBitget({...bitget, apiKey: e.target.value})} />
          <input placeholder="Secret Key" type="password" value={bitget.secretKey} onChange={(e) => setBitget({...bitget, secretKey: e.target.value})} />
          <input placeholder="Passphrase" type="password" value={bitget.passphrase} onChange={(e) => setBitget({...bitget, passphrase: e.target.value})} />
          <button onClick={saveBitget}>API 정보 저장</button>
          <small>현재는 연결 준비 UI입니다. 실제 잔고/거래내역 자동 조회는 서버 API 라우트 연결 단계에서 붙이면 됩니다.</small>
        </div>
        <div className="panel glass connectBox">
          <div className="panelHead"><div><p>MANUAL ACCOUNTS</p><h2>MT5 / 오렌지X 수동 입력</h2></div></div>
          {(['mt5','orangex'] as const).map((k) => <div className="manualGroup" key={k}>
            <b>{k === 'mt5' ? '메타트레이더' : '오렌지X'}</b>
            <div className="manualGrid">
              <input placeholder="자산" value={manual[k].asset} onChange={(e) => setManual({...manual, [k]: {...manual[k], asset: e.target.value}})} />
              <input placeholder="오늘 손익" value={manual[k].today} onChange={(e) => setManual({...manual, [k]: {...manual[k], today: e.target.value}})} />
              <input placeholder="월간 손익" value={manual[k].month} onChange={(e) => setManual({...manual, [k]: {...manual[k], month: e.target.value}})} />
              <input placeholder="승률" value={manual[k].winRate} onChange={(e) => setManual({...manual, [k]: {...manual[k], winRate: e.target.value}})} />
            </div>
          </div>)}
          <button onClick={saveManual}>수동 입력 저장</button>
        </div>
      </section>

      <section className="panel glass trades" id="trades">
        <div className="panelHead"><div><p>TRADE HISTORY</p><h2>{selected === 'all' ? '전체 매매내역' : '선택 거래소 매매내역'}</h2></div></div>
        {viewTrades.map((t, i) => <div className="trade" key={i}><div><b>{t.market}</b><span>{t.time} · {t.side}</span></div><strong className={t.pnl >= 0 ? 'green' : 'red'}>{signed(t.pnl)}</strong><em className={t.result === 'WIN' ? 'win' : 'loss'}>{t.result}</em></div>)}
      </section>
    </main>
  )
}

function Stat({ title, value, hint, good = true }: { title: string; value: string; hint: string; good?: boolean }) {
  return <div className="stat glass"><p>{title}</p><h2 className={good ? 'green' : 'red'}>{value}</h2><span>{hint}</span></div>
}
