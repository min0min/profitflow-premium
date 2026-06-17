'use client'

import { useMemo, useState } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { accounts, daily, equity, exchanges, monthly, trades, type ExchangeKey } from '../lib/data'

const money = (n: number) => `${n < 0 ? '-' : ''}$${Math.abs(n).toLocaleString()}`
const signed = (n: number) => `${n >= 0 ? '+' : '-'}$${Math.abs(n).toLocaleString()}`

export default function Page() {
  const [selected, setSelected] = useState<ExchangeKey>('all')
  const [lang, setLang] = useState<'ko' | 'en'>('ko')

  const selectedAccounts = selected === 'all' ? accounts : accounts.filter(a => a.key === selected)
  const totalAsset = selectedAccounts.reduce((s, a) => s + a.asset, 0)
  const today = selectedAccounts.reduce((s, a) => s + a.today, 0)
  const month = selectedAccounts.reduce((s, a) => s + a.month, 0)
  const tradesCount = selectedAccounts.reduce((s, a) => s + a.trades, 0)
  const avgWin = Math.round(selectedAccounts.reduce((s, a) => s + a.winRate, 0) / selectedAccounts.length)
  const viewTrades = selected === 'all' ? trades : trades.filter(t => t.exchange === selected)
  const key = selected
  const heroTitle = lang === 'ko' ? '통합 트레이딩 자산관리' : 'Trading Wealth OS'

  const ai = useMemo(() => {
    if (selected === 'mt5') return '메타트레이더 계좌가 이번 달 수익의 핵심입니다. XAUUSD 수익 기여도가 높아 과진입만 조심하면 좋습니다.'
    if (selected === 'bitget') return '비트겟은 오늘 단기 수익률이 좋습니다. 알트 변동성이 커서 거래량 급등 구간만 따로 필터링하세요.'
    if (selected === 'binance') return '바이낸스는 오늘 손실입니다. 포지션 수를 줄이고 진입 근거가 약한 종목은 제외하는 게 좋습니다.'
    return '전체 계좌 기준 MT5 수익 기여도가 가장 높고, 비트겟은 단기 회전 수익이 좋습니다. 손실 계좌는 비중을 낮추세요.'
  }, [selected])

  return (
    <main className="shell">
      <div className="orb orbA" />
      <div className="orb orbB" />
      <nav className="nav glass">
        <div className="brand"><span>PROFITFLOW</span><b>AI</b></div>
        <div className="navLinks"><span>대시보드</span><span>계좌</span><span>거래내역</span><span>분석</span></div>
        <button className="lang" onClick={() => setLang(lang === 'ko' ? 'en' : 'ko')}>{lang === 'ko' ? '한국어' : 'EN'}</button>
      </nav>

      <section className="hero">
        <div className="heroText">
          <p className="eyebrow">BITGET · MT5 · BINANCE</p>
          <h1>{heroTitle}</h1>
          <p className="sub">거래소별 자산, 일간/월간 손익, 매매내역, 승률, 자산곡선을 한 화면에서 관리합니다.</p>
          <div className="actions"><button>API 연결 준비</button><button className="ghost">리포트 보기</button></div>
        </div>
        <div className="phone glass">
          <div className="phoneTop"><span /> <b>{money(totalAsset)}</b></div>
          <ResponsiveContainer width="100%" height={170}>
            <AreaChart data={equity}><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#48ffb6" stopOpacity={0.75}/><stop offset="95%" stopColor="#48ffb6" stopOpacity={0}/></linearGradient></defs><Area type="monotone" dataKey="value" stroke="#48ffb6" fill="url(#g)" strokeWidth={3}/><Tooltip contentStyle={{background:'#0b1110',border:'1px solid #24443a',borderRadius:16}}/></AreaChart>
          </ResponsiveContainer>
          <div className="miniGrid"><span>오늘 {signed(today)}</span><span>승률 {avgWin}%</span></div>
        </div>
      </section>

      <section className="tabs glass">
        {exchanges.map(ex => <button key={ex.key} className={selected === ex.key ? 'active' : ''} onClick={() => setSelected(ex.key)}>{lang === 'ko' ? ex.ko : ex.en}</button>)}
      </section>

      <section className="cards">
        <Stat title="총 자산" value={money(totalAsset)} hint="연결 계좌 합산" />
        <Stat title="오늘 손익" value={signed(today)} hint="일간 실현손익" good={today >= 0} />
        <Stat title="이번달 손익" value={signed(month)} hint="월간 누적손익" good={month >= 0} />
        <Stat title="승률" value={`${avgWin}%`} hint={`${tradesCount}회 거래 기준`} />
      </section>

      <section className="grid">
        <div className="panel big glass">
          <div className="panelHead"><div><p>ASSET CURVE</p><h2>자산곡선</h2></div><span className="badge">LIVE READY</span></div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={equity}><CartesianGrid strokeDasharray="3 3" stroke="#1e2a2f"/><XAxis dataKey="day" stroke="#79838a"/><YAxis stroke="#79838a"/><Tooltip contentStyle={{background:'#09100f',border:'1px solid #253b35',borderRadius:16}}/><Area type="monotone" dataKey="value" stroke="#f97316" fill="#f9731630" strokeWidth={3}/></AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="panel glass">
          <div className="panelHead"><div><p>AI INSIGHT</p><h2>AI 분석</h2></div></div>
          <div className="insight"><b>오늘 요약</b><p>{ai}</p></div>
          <div className="risk"><span>리스크 점수</span><div><i style={{width: selected === 'binance' ? '68%' : '42%'}} /></div></div>
        </div>
      </section>

      <section className="grid second">
        <div className="panel glass">
          <div className="panelHead"><div><p>DAILY PNL</p><h2>일간 손익</h2></div></div>
          <ResponsiveContainer width="100%" height={250}><BarChart data={daily}><XAxis dataKey="day" stroke="#79838a"/><YAxis stroke="#79838a"/><Tooltip contentStyle={{background:'#09100f',border:'1px solid #253b35',borderRadius:16}}/><Bar dataKey={key} fill="#48ffb6" radius={[10,10,0,0]}/></BarChart></ResponsiveContainer>
        </div>
        <div className="panel glass">
          <div className="panelHead"><div><p>MONTHLY PNL</p><h2>월간 손익</h2></div></div>
          <ResponsiveContainer width="100%" height={250}><AreaChart data={monthly}><XAxis dataKey="month" stroke="#79838a"/><YAxis stroke="#79838a"/><Tooltip contentStyle={{background:'#09100f',border:'1px solid #253b35',borderRadius:16}}/><Area type="monotone" dataKey={key} stroke="#a78bfa" fill="#a78bfa30" strokeWidth={3}/></AreaChart></ResponsiveContainer>
        </div>
      </section>

      <section className="accounts">
        {selectedAccounts.map(a => <div className="account glass" key={a.key}><div><p>{a.ko}</p><h3>{money(a.asset)}</h3></div><span className={a.today >= 0 ? 'green' : 'red'}>{signed(a.today)}</span><small>월간 {signed(a.month)} · 승률 {a.winRate}%</small></div>)}
      </section>

      <section className="panel glass trades">
        <div className="panelHead"><div><p>TRADE HISTORY</p><h2>{selected === 'all' ? '전체 매매내역' : '선택 거래소 매매내역'}</h2></div></div>
        {viewTrades.map((t, i) => <div className="trade" key={i}><div><b>{t.market}</b><span>{t.time} · {t.side}</span></div><strong className={t.pnl >= 0 ? 'green' : 'red'}>{signed(t.pnl)}</strong><em className={t.result === 'WIN' ? 'win' : 'loss'}>{t.result}</em></div>)}
      </section>
    </main>
  )
}

function Stat({title,value,hint,good=true}:{title:string,value:string,hint:string,good?:boolean}){return <div className="stat glass"><p>{title}</p><h2 className={good?'green':'red'}>{value}</h2><span>{hint}</span></div>}
