import { TopBar } from '../components/TopBar';
import { FleetMap } from '../components/FleetMap';
import styles from './pickup.module.css';

const kpis = [
  { label: 'Trucks Active', value: '5', sub: '/ 5' },
  { label: 'Bins Emptied Today', value: '284', sub: 'target 320' },
  { label: 'Avg Route Time', value: '2h 46m', sub: '−12m vs avg' },
  { label: 'Coverage', value: '94%', sub: '18 / 19 routes' },
];

type Status = 'onroute' | 'collecting' | 'delayed' | 'returning' | 'idle';

const trucks: {
  id: string;
  plate: string;
  driver: string;
  status: Status;
  route: string;
  bins: string;
  eta: string;
}[] = [
  { id: 'T-01', plate: 'LSR-482-KJA', driver: 'Adekunle Bello',   status: 'onroute',    route: 'Route A — Bode Thomas',  bins: '32 / 48', eta: '12 min' },
  { id: 'T-02', plate: 'LSR-337-MSH', driver: 'Ibrahim Yusuf',    status: 'collecting', route: 'Route B — Adelabu',      bins: '41 / 52', eta: 'On stop' },
  { id: 'T-03', plate: 'LSR-921-EPE', driver: 'Chinedu Okafor',   status: 'delayed',    route: 'Route C — Ogunlana Dr',  bins: '18 / 44', eta: '38 min' },
  { id: 'T-04', plate: 'LSR-116-IKD', driver: 'Fatima Adebayo',   status: 'onroute',    route: 'Route D — Aguda',        bins: '27 / 40', eta: '9 min' },
  { id: 'T-05', plate: 'LSR-654-LSR', driver: 'Emeka Nwosu',      status: 'returning',  route: 'Route E — Itire Rd',     bins: '46 / 46', eta: '4 min' },
];

const statusMeta: Record<Status, { label: string; className: string }> = {
  onroute:    { label: 'On route',    className: 'status_ok' },
  collecting: { label: 'Collecting',  className: 'status_info' },
  delayed:    { label: 'Delayed',     className: 'status_warn' },
  returning:  { label: 'Returning',   className: 'status_muted' },
  idle:       { label: 'Idle',        className: 'status_muted' },
};

const alerts = [
  { icon: '!', tone: 'warn', title: 'T-03 delayed 38 min', sub: 'Ogunlana Dr · traffic congestion' },
  { icon: 'i', tone: 'info', title: 'Route D reassignment', sub: 'Fatima Adebayo picked up 2 extra stops' },
  { icon: '✓', tone: 'ok',   title: 'Route E completed',    sub: 'Emeka Nwosu returning to depot' },
];

function StatusPill({ status }: { status: Status }) {
  const m = statusMeta[status];
  return <span className={`${styles.pill} ${styles[m.className]}`}>{m.label}</span>;
}

export default function PickupSchedulesPage() {
  return (
    <>
      <TopBar title="Pickup Schedules" subtitle="Live fleet · Monday, 6 July 2026" />

      <div className={styles.body}>
        <section className={styles.kpiStrip}>
          {kpis.map(k => (
            <div key={k.label} className={styles.kpi}>
              <span className={styles.kpiLabel}>{k.label}</span>
              <div className={styles.kpiVal}>
                <span className={styles.kpiValue}>{k.value}</span>
                <span className={styles.kpiSub}>{k.sub}</span>
              </div>
            </div>
          ))}
        </section>

        <section className={styles.grid}>
          {/* Left: fleet list */}
          <aside className={styles.fleet}>
            <header className={styles.fleetHead}>
              <div>
                <h3 className={styles.panelTitle}>Fleet</h3>
                <p className={styles.panelSub}>5 trucks · 5 routes today</p>
              </div>
              <button className={styles.smallBtn}>Filter</button>
            </header>
            <ul className={styles.fleetList}>
              {trucks.map(t => (
                <li key={t.id} className={`${styles.truckRow} ${t.status === 'collecting' ? styles.truckRowActive : ''}`}>
                  <div className={styles.truckIdCol}>
                    <span className={styles.truckId}>{t.id}</span>
                    <span className={styles.truckPlate}>{t.plate}</span>
                  </div>
                  <div className={styles.truckBody}>
                    <div className={styles.truckDriver}>{t.driver}</div>
                    <div className={styles.truckRoute}>{t.route}</div>
                    <div className={styles.truckMeta}>
                      <StatusPill status={t.status} />
                      <span className={styles.truckBins}>{t.bins} bins</span>
                      <span className={styles.truckEta}>ETA {t.eta}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </aside>

          {/* Center: big Google Map */}
          <div className={styles.mapWrap}>
            <div className={styles.mapControls}>
              <div className={styles.mapTabs}>
                <button className={styles.mapTabActive}>Live</button>
                <button className={styles.mapTab}>Heatmap</button>
                <button className={styles.mapTab}>Routes</button>
              </div>
              <div className={styles.mapMetaRow}>
                <span className={styles.livePill}><span className={styles.liveDot}/>LIVE · 09:42:14</span>
                <button className={styles.smallBtn}>Recentre</button>
              </div>
            </div>
            <div className={styles.mapInner}>
              <FleetMap variant="full" />
            </div>
          </div>

          {/* Right: dispatch */}
          <aside className={styles.dispatch}>
            <header className={styles.fleetHead}>
              <div>
                <h3 className={styles.panelTitle}>Dispatch</h3>
                <p className={styles.panelSub}>Selected · T-02 Ibrahim Yusuf</p>
              </div>
            </header>

            <div className={styles.dispatchCard}>
              <div className={styles.dispatchTruckHead}>
                <div className={styles.dispatchAvatar}>IY</div>
                <div>
                  <div className={styles.dispatchName}>Ibrahim Yusuf</div>
                  <div className={styles.dispatchPlate}>LSR-337-MSH · Route B</div>
                </div>
                <StatusPill status="collecting" />
              </div>
              <div className={styles.dispatchStats}>
                <div><strong>41</strong><span>Bins done</span></div>
                <div><strong>11</strong><span>Remaining</span></div>
                <div><strong>78%</strong><span>Complete</span></div>
              </div>
              <div className={styles.progressTrack}>
                <div className={styles.progressFill} style={{ width: '78%' }} />
              </div>
            </div>

            <div className={styles.actionRow}>
              <button className={styles.primaryBtn}>Assign next route</button>
              <button className={styles.secondaryBtn}>Reroute</button>
              <button className={styles.secondaryBtn}>Message driver</button>
            </div>

            <div className={styles.alertsBlock}>
              <div className={styles.alertsHead}>
                <span className={styles.panelTitle}>Live alerts</span>
                <span className={styles.strokeBadge}>3</span>
              </div>
              <ul className={styles.alertsList}>
                {alerts.map((a, i) => (
                  <li key={i} className={styles.alertItem}>
                    <span className={`${styles.alertIcon} ${styles[`alert_${a.tone}`]}`}>{a.icon}</span>
                    <div>
                      <div className={styles.alertTitle}>{a.title}</div>
                      <div className={styles.alertSub}>{a.sub}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </section>
      </div>
    </>
  );
}
