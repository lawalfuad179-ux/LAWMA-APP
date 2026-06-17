import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Truck, Bell, CreditCard, FileText, Leaf, ChevronRight,
  Settings, Shield, Star, Award, Recycle,
} from 'lucide-react';

import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { Card } from '@/components/ui/Card';
import { LogoutButton } from '@/components/ui/LogoutButton';
import { ProfileEditForm } from '@/components/profile/ProfileEditForm';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import styles from './page.module.css';

function Badge({ label, variant }: { label: string; variant: 'green' | 'orange' | 'blue' }) {
  return <span className={`${styles.badge} ${styles[`badge_${variant}`]}`}>{label}</span>;
}

function StatCard({ value, label, icon }: { value: string | number; label: string; icon: React.ReactNode }) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statIcon}>{icon}</div>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  );
}

function QuickLink({ href, icon, label, description }: { href: string; icon: React.ReactNode; label: string; description?: string }) {
  return (
    <Link href={href} className={styles.quickLink}>
      <div className={styles.quickLinkIcon}>{icon}</div>
      <div className={styles.quickLinkBody}>
        <span className={styles.quickLinkLabel}>{label}</span>
        {description && <span className={styles.quickLinkDesc}>{description}</span>}
      </div>
      <ChevronRight size={16} className={styles.quickLinkChevron} />
    </Link>
  );
}

function AchievementBadge({ icon, label, earned }: { icon: React.ReactNode; label: string; earned: boolean }) {
  return (
    <div className={`${styles.achievement} ${earned ? styles.achievementEarned : styles.achievementLocked}`}>
      <div className={styles.achievementIcon}>{icon}</div>
      <span className={styles.achievementLabel}>{label}</span>
    </div>
  );
}

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const [resident, complaintCount, paymentSummary, pspOperator, recycleCount, rewardAccount] = await Promise.all([
    db.resident.findUnique({ where: { id: session.residentId } }),
    db.complaint.count({ where: { residentId: session.residentId } }),
    db.payment.aggregate({
      where: { residentId: session.residentId, status: 'SUCCESSFUL' },
      _sum: { amountKobo: true },
    }),
    db.pspOperator.findFirst({
      where: { lga: (await db.resident.findUnique({ where: { id: session.residentId }, select: { lga: true } }))?.lga || '' },
    }),
    db.recycleActivity.count({ where: { residentId: session.residentId, status: 'CONFIRMED' } }),
    db.rewardAccount.findUnique({ where: { residentId: session.residentId } }),
  ]);

  if (!resident) redirect('/login');

  const totalPaid = paymentSummary._sum.amountKobo || 0;
  const pointsBalance = rewardAccount?.balance ?? 0;
  const totalEarned = rewardAccount?.totalEarned ?? 0;
  const memberSince = resident.createdAt.toLocaleDateString('en-NG', { month: 'long', year: 'numeric' });

  const achievements = [
    { icon: <Leaf size={18} strokeWidth={1.5} />, label: 'First Scan', earned: recycleCount >= 1 },
    { icon: <Star size={18} strokeWidth={1.5} />, label: 'Green Warrior', earned: totalEarned >= 50 },
    { icon: <Award size={18} strokeWidth={1.5} />, label: 'Eco Champion', earned: totalEarned >= 200 },
    { icon: <Recycle size={18} strokeWidth={1.5} />, label: '5 Scans', earned: recycleCount >= 5 },
  ];

  return (
    <div className={styles.page}>
      {/* ── Hero ── */}
      <div className={styles.hero}>
        <AvatarUpload name={resident.name || ''} avatarUrl={resident.avatarUrl} />
        <div className={styles.heroMeta}>
          <h1 className={styles.heroName}>{resident.name || 'Resident'}</h1>
          <span className={styles.heroPhone}>{resident.phoneNumber}</span>
          <div className={styles.heroBadges}>
            {resident.lga && <Badge label={resident.lga} variant="blue" />}
            <Badge label={`Member since ${memberSince}`} variant="green" />
          </div>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className={styles.statsRow}>
        <StatCard
          value={pointsBalance}
          label="Points"
          icon={<Star size={18} strokeWidth={1.5} />}
        />
        <StatCard
          value={recycleCount}
          label="Scans"
          icon={<Recycle size={18} strokeWidth={1.5} />}
        />
        <StatCard
          value={complaintCount}
          label="Reports"
          icon={<FileText size={18} strokeWidth={1.5} />}
        />
        <StatCard
          value={`₦${Math.floor(totalPaid / 100).toLocaleString()}`}
          label="Paid"
          icon={<CreditCard size={18} strokeWidth={1.5} />}
        />
      </div>

      {/* ── Rewards Card ── */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <Star size={15} strokeWidth={1.5} />
          <span className={styles.sectionTitle}>Recycling Rewards</span>
        </div>
        <Card className={styles.rewardsCard}>
          <div className={styles.rewardsBalance}>
            <div>
              <span className={styles.rewardsBalanceNum}>{pointsBalance}</span>
              <span className={styles.rewardsBalanceLabel}> pts</span>
            </div>
            <span className={styles.rewardsBalanceValue}>≈ ₦{pointsBalance} off your bill</span>
          </div>
          <div className={styles.rewardsProgress}>
            <div className={styles.rewardsProgressBar}>
              <div
                className={styles.rewardsProgressFill}
                style={{ width: `${Math.min((pointsBalance % 100) / 100 * 100, 100)}%` }}
              />
            </div>
            <span className={styles.rewardsProgressLabel}>
              {pointsBalance < 100
                ? `${100 - (pointsBalance % 100)} more pts to unlock ₦100 discount`
                : `${pointsBalance} pts ready to redeem`
              }
            </span>
          </div>
          <Link href="/recycling" className={styles.rewardsAction}>
            <Recycle size={14} />
            Scan trash to earn more points
            <ChevronRight size={14} />
          </Link>
        </Card>
      </div>

      {/* ── Achievements ── */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <Award size={15} strokeWidth={1.5} />
          <span className={styles.sectionTitle}>Achievements</span>
        </div>
        <div className={styles.achievements}>
          {achievements.map((a) => (
            <AchievementBadge key={a.label} {...a} />
          ))}
        </div>
      </div>

      {/* ── Quick Links ── */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <Settings size={15} strokeWidth={1.5} />
          <span className={styles.sectionTitle}>Quick Access</span>
        </div>
        <Card className={styles.linksCard}>
          <QuickLink
            href="/recycling"
            icon={<Recycle size={18} strokeWidth={1.5} />}
            label="Scan & Earn"
            description="Photograph trash, get recycling tips, earn points"
          />
          <QuickLink
            href="/payments"
            icon={<CreditCard size={18} strokeWidth={1.5} />}
            label="Bills & Payments"
            description="View bills and redeem points for discounts"
          />
          <QuickLink
            href="/complaints"
            icon={<FileText size={18} strokeWidth={1.5} />}
            label="My Reports"
            description="Track your reported sanitation issues"
          />
          <QuickLink
            href="/notifications"
            icon={<Bell size={18} strokeWidth={1.5} />}
            label="Notifications"
            description="View alerts and updates"
          />
          <QuickLink
            href="/schedules"
            icon={<Truck size={18} strokeWidth={1.5} />}
            label="Collection Schedule"
            description="Your next pickup time and PSP info"
          />
        </Card>
      </div>

      {/* ── Personal Info ── */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <Shield size={15} strokeWidth={1.5} />
          <span className={styles.sectionTitle}>Personal Information</span>
        </div>
        <Card className={styles.card}>
          <ProfileEditForm
            initialName={resident.name || ''}
            initialAddress={resident.address || ''}
            initialLga={resident.lga || ''}
            initialEmail={resident.email || ''}
            initialPhone={resident.phoneNumber || ''}
          />
        </Card>
      </div>

      {/* ── PSP Operator ── */}
      {pspOperator && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Truck size={15} strokeWidth={1.5} />
            <span className={styles.sectionTitle}>Assigned PSP Operator</span>
          </div>
          <Card className={styles.card}>
            <div className={styles.row}>
              <span className={styles.label}>Name</span>
              <span className={styles.value}>{pspOperator.name}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Zone</span>
              <span className={styles.value}>{pspOperator.zone}</span>
            </div>
            {pspOperator.contactPhone && (
              <div className={styles.row}>
                <span className={styles.label}>Contact</span>
                <a href={`tel:${pspOperator.contactPhone}`} className={styles.valueLink}>{pspOperator.contactPhone}</a>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── Settings ── */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <Settings size={15} strokeWidth={1.5} />
          <span className={styles.sectionTitle}>Settings</span>
        </div>
        <Card className={styles.linksCard}>
          <QuickLink
            href="/notifications/preferences"
            icon={<Bell size={18} strokeWidth={1.5} />}
            label="Notification Preferences"
            description="Choose which alerts to receive by email or SMS"
          />
        </Card>
      </div>

      {/* ── Sign Out ── */}
      <div className={styles.signOutRow}>
        <LogoutButton variant="danger" />
      </div>
    </div>
  );
}
