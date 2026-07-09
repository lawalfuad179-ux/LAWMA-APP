import { TopBar } from './components/TopBar';
import { FleetMap } from './components/FleetMap';
import styles from './dashboard.module.css';
import Link from 'next/link';

const kpis = [
  { label: 'Active Trucks', value: '5', delta: '+1', deltaTone: 'up', sub: 'of 5 deployed' },
  { label: 'Complaints Open', value: '11', delta: '−2', deltaTone: 'down', sub: 'today' },
  { label: 'Bins Collected Today', value: '284', delta: '+18', deltaTone: 'up', sub: 'vs yesterday' },
  { label: 'Bill Compliance', value: '88%', delta: '+3.4%', deltaTone: 'up', sub: 'this month' },
];

const complaints = [
  { id: 'C-2841', title: 'Overflowing bin at Adelabu St junction', reporter: 'Chinelo O.', when: '4m ago', sla: '2h left', tone: 'warn' },
  { id: 'C-2840', title: 'Missed pickup, Bode Thomas Cres.', reporter: 'Yusuf A.', when: '22m ago', sla: '1h 40m', tone: 'warn' },
  { id: 'C-2839', title: 'Illegal dumping near Aguda market', reporter: 'Ronke I.', when: '1h ago', sla: 'On track', tone: 'ok' },
  { id: 'SB-2412', title: 'New smart bin purchase received, 14 Adeniran St', reporter: 'Fatima I.', when: '2h ago', sla: 'Fulfilment', tone: 'info' },
  { id: 'C-2836', title: 'Overflowing skip, Ojuelegba underpass', reporter: 'Tunde K.', when: '3h ago', sla: '3h 20m', tone: 'warn' },
];

const activity = [
  { who: 'Bill payment', what: '₦8,500 · Household #SR-01142', when: '2 min ago', tone: 'ok' },
  { who: 'Smart bin order', what: 'Bin #SB-224 dispatched to 14 Adeniran St', when: '9 min ago', tone: 'info' },
  { who: 'Complaint resolved', what: 'C-2837 · Ogunlana Dr, avg SLA 3h 12m', when: '14 min ago', tone: 'ok' },
  { who: 'PDF receipt sent', what: 'Household #SR-00981 · via SMS', when: '21 min ago', tone: 'muted' },
  { who: 'Payment retry', what: 'Household #SR-01120 · gateway timeout', when: '34 min ago', tone: 'warn' },
];

const sparklineDays = [
  { day: 'Mon', value: 62 },
  { day: 'Tue', value: 71 },
  { day: 'Wed', value: 58 },
  { day: 'Thu', value: 83 },
  { day: 'Fri', value: 79 },
  { day: 'Sat', value: 94 },
  { day: 'Sun', value: 88 },
];

function NairaSign() {
  return (
    <svg width="12" height="14" viewBox="0 0 12 14" style={{ display: 'inline-block', verticalAlign: '-2px', marginRight: 1 }} aria-label="Naira">
      <text x="0" y="12" fontFamily="inherit" fontSize="13" fontWeight="700" fill="currentColor">N</text>
      <line x1="0" y1="4.5" x2="12" y2="4.5" stroke="currentColor" strokeWidth="1.4" />
      <line x1="0" y1="8.5" x2="12" y2="8.5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function Sparkline({ data }: { data: { day: string; value: number }[] }) {
  const max = Math.max(...data.map(d => d.value));
  const min = Math.min(...data.map(d => d.value));
  const w = 240, h = 60, pad = 4;
  const points = data.map((d, i) => {
    const x = pad + (i * (w - 2 * pad)) / (data.length - 1);
    const y = h - pad - ((d.value - min) / (max - min || 1)) * (h - 2 * pad);
    return [x, y] as [number, number];
  });
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ');
  const area = `${path} L${points[points.length - 1][0]},${h - pad} L${points[0][0]},${h - pad} Z`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.24"/>
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={area} fill="url(#sg)"/>
      <path d={path} fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      {points.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={i === points.length - 1 ? 3 : 0} fill="var(--color-primary)"/>
      ))}
    </svg>
  );
}

function FilterSelect({ label, value }: { label: string; value: string }) {
  return (
    <label className={styles.filter}>
      <span className={styles.filterLabel}>{label}</span>
      <span className={styles.filterVal}>{value}</span>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
    </label>
  );
}

export default function DashboardPage() {
  return (
    <>
      <TopBar title="Dashboard" subtitle="Monday, 6 July 2026 · 09:42 WAT" />

      <div className={styles.body}>
        <section className={styles.kpiRow}>
          {kpis.map((k, i) => (
            <div key={k.label} className={`${styles.kpiCard} fadeUp`} style={{ animationDelay: `${i * 60}ms` }}>
              <div className={styles.kpiTop}>
                <span className={styles.kpiLabel}>{k.label}</span>
                <span className={`${styles.kpiDelta} ${k.deltaTone === 'up' ? styles.deltaUp : styles.deltaDown}`}>{k.delta}</span>
              </div>
              <div className={styles.kpiValue}>{k.value}</div>
              <div className={styles.kpiSub}>{k.sub}</div>
            </div>
          ))}
        </section>

        <section className={styles.bento}>
          <Link href="/pickup-schedules" className={`${styles.card} ${styles.cardMap}`}>
            <div className={styles.cardHead}>
              <div>
                <h3 className={styles.cardTitle}>Live pickup activity</h3>
                <p className={styles.cardSub}>5 trucks · Surulere LGA</p>
              </div>
              <span className={styles.livePill}><span className={styles.liveDot}/>LIVE</span>
            </div>
            <div className={styles.miniMapWrap}>
              <FleetMap variant="mini" />
            </div>
            <div className={styles.mapLegend}>
              <span><i className={styles.dotSuccess}/>On route</span>
              <span><i className={styles.dotInfo}/>Collecting</span>
              <span><i className={styles.dotWarn}/>Delayed</span>
              <span className={styles.viewAll}>Open Pickup Schedules →</span>
            </div>
          </Link>

          <div className={`${styles.card} ${styles.cardComplaints}`}>
            <div className={styles.cardHead}>
              <div>
                <h3 className={styles.cardTitle}>Open complaints</h3>
                <p className={styles.cardSub}>Sorted by SLA remaining</p>
              </div>
              <span className={styles.strokeBadge}>11 open</span>
            </div>
            <ul className={styles.complaintList}>
              {complaints.map(c => (
                <li key={c.id} className={styles.complaintRow}>
                  <div className={styles.complaintMeta}>
                    <span className={styles.complaintId}>{c.id}</span>
                    <span className={`${styles.pill} ${styles[`pill_${c.tone}`]}`}>{c.sla}</span>
                  </div>
                  <div className={styles.complaintTitle}>{c.title}</div>
                  <div className={styles.complaintFoot}>
                    <span>By {c.reporter}</span>
                    <span>·</span>
                    <span>{c.when}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className={`${styles.card} ${styles.cardPayments}`}>
            <div className={styles.cardHead}>
              <div>
                <h3 className={styles.cardTitle}>Bill payments</h3>
                <p className={styles.cardSub}>Collections trend</p>
              </div>
              <div className={styles.filterRow}>
                <FilterSelect label="LGA" value="Surulere" />
                <FilterSelect label="Range" value="Last 7 days" />
              </div>
            </div>
            <div className={styles.paymentStat}>
              <div className={styles.paymentAmount}>
                <NairaSign />142,300
              </div>
              <div className={styles.paymentSub}>Collected · +12.4% vs prev.</div>
            </div>
            <Sparkline data={sparklineDays} />
            <div className={styles.sparkDays}>
              {sparklineDays.map(d => <span key={d.day}>{d.day}</span>)}
            </div>
          </div>

          <div className={`${styles.card} ${styles.cardBroadcast}`}>
            <div className={styles.cardHead}>
              <div>
                <h3 className={styles.cardTitle}>Broadcast a notification</h3>
                <p className={styles.cardSub}>To residents in Surulere</p>
              </div>
            </div>
            <div className={styles.broadcastBody}>
              <button className={styles.channelChipActive}>All residents</button>
              <button className={styles.channelChip}>By street</button>
              <button className={styles.channelChip}>By cohort</button>
            </div>
            <textarea className={styles.broadcastInput} defaultValue="Reminder: waste pickup on Bode Thomas & Adelabu streets today, 10:00–14:00. Please have bins outside by 09:45." />
            <div className={styles.broadcastFoot}>
              <span className={styles.charCount}>128 / 320</span>
              <button className={styles.ctaBtn}>Schedule broadcast</button>
            </div>
          </div>

          <div className={`${styles.card} ${styles.cardActivity}`}>
            <div className={styles.cardHead}>
              <div>
                <h3 className={styles.cardTitle}>Recent activity</h3>
                <p className={styles.cardSub}>Payments, orders, complaints</p>
              </div>
              <button className={styles.linkBtn}>View all →</button>
            </div>
            <ul className={styles.activityList}>
              {activity.map((a, i) => (
                <li key={i} className={styles.activityRow}>
                  <span className={`${styles.activityDot} ${styles[`dot_${a.tone}`]}`}/>
                  <div className={styles.activityText}>
                    <div className={styles.activityWho}>{a.who}</div>
                    <div className={styles.activityWhat}>{a.what}</div>
                  </div>
                  <span className={styles.activityWhen}>{a.when}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className={`${styles.card} ${styles.cardCoverage}`}>
            <div className={styles.cardHead}>
              <div>
                <h3 className={styles.cardTitle}>Coverage</h3>
                <p className={styles.cardSub}>Route completion</p>
              </div>
              <div className={styles.filterRow}>
                <FilterSelect label="LGA" value="Surulere" />
                <FilterSelect label="Range" value="This week" />
              </div>
            </div>
            <div className={styles.coverageRing}>
              <svg viewBox="0 0 180 180" width="180" height="180">
                <circle cx="90" cy="90" r="76" fill="none" stroke="var(--color-surface-container)" strokeWidth="16"/>
                <circle cx="90" cy="90" r="76" fill="none" stroke="var(--color-primary)" strokeWidth="16"
                        strokeDasharray={`${2 * Math.PI * 76}`} strokeDashoffset={`${2 * Math.PI * 76 * (1 - 0.94)}`}
                        transform="rotate(-90 90 90)" strokeLinecap="round"/>
              </svg>
              <div className={styles.coverageText}>
                <div className={styles.coverageValue}>94%</div>
                <div className={styles.coverageLabel}>routes completed</div>
              </div>
            </div>
            <div className={styles.coverageStats}>
              <div><strong>18 / 19</strong><span>Routes today</span></div>
              <div><strong>3h 12m</strong><span>Avg SLA</span></div>
              <div><strong>45s</strong><span>Time-to-pay</span></div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
