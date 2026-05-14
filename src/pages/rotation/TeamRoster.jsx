import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import RotationShell from '../../components/rotation/RotationShell';
import { listTeamMembers, seedTeamMembersIfEmpty, getRules } from '../../services/rotationService';
import { LEVELS, DAR_COLUMN_IDS, ENTITIES, TAG_COLORS } from '../../constants/rotation';
import { promotionSuggestion } from '../../utils/rotationEngine';
import { Star, ChevronRight } from 'lucide-react';

export default function TeamRoster() {
  const [members, setMembers] = useState([]);
  const [rules, setRules] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      await seedTeamMembersIfEmpty();
      const [mems, rls] = await Promise.all([listTeamMembers(), getRules()]);
      setMembers(mems);
      setRules(rls);
    } finally {
      setLoading(false);
    }
  }

  const grouped = LEVELS.map(level => ({
    ...level,
    members: members.filter(m => m.level === level.id),
  }));

  return (
    <RotationShell title="Team">
      {loading ? (
        <div className="text-slate-400">Loading…</div>
      ) : (
        <div className="space-y-8">
          {grouped.filter(g => g.members.length > 0).map(group => (
            <section key={group.id}>
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="inline-block w-3 h-3 rounded-full"
                  style={{ background: group.color }}
                />
                <h2 className="text-h3 font-semibold text-slate-800 dark:text-slate-100">
                  {group.label}
                </h2>
                <span className="text-caption text-slate-400">
                  {group.members.length} {group.members.length === 1 ? 'person' : 'people'}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {group.members.map(m => (
                  <MemberCard key={m.name} member={m} rules={rules} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </RotationShell>
  );
}

function MemberCard({ member, rules }) {
  const promo = promotionSuggestion(member, rules);
  const progress = progressFor(member);
  return (
    <Link
      to={`/rotation/team/${encodeURIComponent(member.name)}`}
      className="block bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:shadow-card-hover transition"
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className="font-bold text-body"
          style={{ color: TAG_COLORS[member.tag] || '#212529' }}
        >
          {member.name}
        </span>
        {promo && (
          <span className="ml-auto flex items-center gap-1 text-caption text-thr-green-700 bg-thr-green-50 px-2 py-0.5 rounded-full">
            <Star className="w-3 h-3" /> ready: {promo}
          </span>
        )}
        {!promo && (
          <ChevronRight className="ml-auto w-4 h-4 text-slate-300" />
        )}
      </div>
      {member.permanentRole && (
        <div className="text-caption text-thr-blue-700 mb-1">★ {member.permanentRole}</div>
      )}
      <div className="text-caption text-slate-500 mb-2">{progress.label}</div>
      <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-thr-blue-500"
          style={{ width: `${progress.pct}%` }}
        />
      </div>
    </Link>
  );
}

function progressFor(m) {
  if (m.level === 'perm') return { pct: 100, label: m.permanentRole || 'Permanent role' };
  if (m.level === 'float') return { pct: 100, label: 'Float pool' };
  if (m.level === 'cpoe') return { pct: 60, label: `${m.cpoeRotationsCount || 0} rotation(s) at CPOE` };
  if (m.level === 'dar') {
    const owned = (m.darClustersOwned || []).filter(d => DAR_COLUMN_IDS.includes(d)).length;
    return { pct: Math.round((owned / 5) * 100), label: `${owned}/5 DAR clusters owned` };
  }
  const covered = (m.coveredEntities || []).length;
  const total = ENTITIES.length;
  return { pct: Math.round((covered / total) * 100), label: `${covered}/${total} entities covered` };
}
