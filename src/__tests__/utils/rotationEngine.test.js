import { describe, it, expect } from 'vitest';
import {
  darIn,
  splitEntityCell,
  lastOwnershipMap,
  sideRolesIn,
  promotionSuggestion,
  deriveMemberPatches,
  proposeRotation,
  diffAssignments,
  ownershipMatrix,
} from '../../utils/rotationEngine';
import { DEFAULT_RULES, ENTITIES } from '../../constants/rotation';

const sampleHistory = [
  {
    id: '2026-03',
    assignments: {
      ALYSSA: { dar: 'dar1' },
      LINH: { dar: 'dar2', side: ['3:01PM EMAIL'] },
      JACQUE: { dar: 'dar4', side: ['3:01PM EMAIL BACK-UP'] },
      NACHOLE: { dar: 'dar3' },
      SHEILA: { dar: 'dar5' },
      STEPHANIE: { trn: true },
      MARIA: { cpoe: true },
      CLARA: { spec: 'SPECIAL PROJECT' },
      ERIKA: { spec: 'FLOAT' },
      CASEY: { incoming: 'THC/THAL/THB' },
    },
  },
  {
    id: '2026-01',
    assignments: {
      ALYSSA: { dar: 'dar5' },
      LINH: { dar: 'dar3' },
      JACQUE: { dar: 'dar2' },
      NACHOLE: { dar: 'dar1' },
      SHEILA: { dar: 'dar4' },
      MARIA: { cpoe: true },
    },
  },
];

describe('darIn / splitEntityCell', () => {
  it('returns null when person not in rotation', () => {
    expect(darIn(sampleHistory[0], 'NOBODY')).toBeNull();
  });
  it('returns dar id when present', () => {
    expect(darIn(sampleHistory[0], 'ALYSSA')).toBe('dar1');
  });
  it('recognizes the training DAR shadow', () => {
    expect(darIn(sampleHistory[0], 'STEPHANIE')).toBe('trn');
  });
  it('splits multi-entity incoming cells', () => {
    expect(splitEntityCell('THC/THAL/THB')).toEqual(['THC', 'THAL', 'THB']);
    expect(splitEntityCell('SW')).toEqual(['SW']);
    expect(splitEntityCell('')).toEqual([]);
  });
});

describe('lastOwnershipMap', () => {
  it('returns rotation index (1-based) for each cluster owned', () => {
    const map = lastOwnershipMap(sampleHistory, 'ALYSSA');
    expect(map.dar1).toBe(1);
    expect(map.dar5).toBe(2);
  });
  it('omits clusters never owned', () => {
    const map = lastOwnershipMap(sampleHistory, 'ALYSSA');
    expect(map.dar3).toBeUndefined();
  });
});

describe('sideRolesIn', () => {
  it('detects the side[] array', () => {
    expect(sideRolesIn(sampleHistory[0], 'LINH')).toContain('3:01PM EMAIL');
  });
  it('returns empty for people without side roles', () => {
    expect(sideRolesIn(sampleHistory[0], 'MARIA')).toEqual([]);
  });
});

describe('promotionSuggestion', () => {
  it('suggests dar when incoming has covered everything', () => {
    const m = { level: 'incoming', coveredEntities: ENTITIES };
    expect(promotionSuggestion(m, DEFAULT_RULES)).toBe('dar');
  });
  it('returns null when incoming still has gaps', () => {
    const m = { level: 'incoming', coveredEntities: ENTITIES.slice(0, 5) };
    expect(promotionSuggestion(m, DEFAULT_RULES)).toBeNull();
  });
  it('suggests cpoe once all 5 DAR clusters owned', () => {
    const m = { level: 'dar', darClustersOwned: ['dar1', 'dar2', 'dar3', 'dar4', 'dar5'] };
    expect(promotionSuggestion(m, DEFAULT_RULES)).toBe('cpoe');
  });
  it('suggests float after cpoeRotationsCount >= threshold', () => {
    const m = { level: 'cpoe', cpoeRotationsCount: 2 };
    expect(promotionSuggestion(m, DEFAULT_RULES)).toBe('float');
  });
});

describe('deriveMemberPatches', () => {
  it('grows darClustersOwned and coveredEntities from a rotation', () => {
    const rot = sampleHistory[0];
    const members = [
      { name: 'ALYSSA', level: 'dar', darClustersOwned: ['dar5'], coveredEntities: [] },
      { name: 'CASEY', level: 'incoming', darClustersOwned: [], coveredEntities: ['SW'] },
      { name: 'MARIA', level: 'cpoe', cpoeRotationsCount: 1 },
    ];
    const patches = deriveMemberPatches(rot, members);
    expect(patches.ALYSSA.darClustersOwned).toEqual(expect.arrayContaining(['dar5', 'dar1']));
    expect(patches.CASEY.coveredEntities).toEqual(expect.arrayContaining(['THC', 'THAL', 'THB']));
    expect(patches.MARIA.cpoeRotationsCount).toBe(2);
  });
});

describe('proposeRotation', () => {
  const members = [
    { name: 'CLARA', level: 'perm', permanentRole: 'SPECIAL PROJECT' },
    { name: 'ERIKA', level: 'float' },
    { name: 'MARIA', level: 'cpoe', cpoeRotationsCount: 1 },
    { name: 'ALYSSA', level: 'dar', darClustersOwned: ['dar1', 'dar2', 'dar4', 'dar5'] },
    { name: 'JACQUE', level: 'dar', darClustersOwned: ['dar2', 'dar3', 'dar4', 'dar5'] },
    { name: 'LINH', level: 'dar', darClustersOwned: ['dar2', 'dar3', 'dar4', 'dar5'] },
    { name: 'NACHOLE', level: 'dar', darClustersOwned: ['dar1', 'dar3', 'dar5'] },
    { name: 'SHEILA', level: 'dar', darClustersOwned: ['dar2', 'dar3', 'dar4', 'dar5'] },
    { name: 'CASEY', level: 'incoming', coveredEntities: ['SW'] },
    { name: 'DANETTE', level: 'incoming', coveredEntities: [] },
  ];

  it('places CLARA on SPECIAL PROJECT', () => {
    const { assignments } = proposeRotation({ members, history: sampleHistory, rules: DEFAULT_RULES });
    expect(assignments.CLARA.spec).toBe('SPECIAL PROJECT');
  });

  it('places ERIKA on FLOAT', () => {
    const { assignments } = proposeRotation({ members, history: sampleHistory, rules: DEFAULT_RULES });
    expect(assignments.ERIKA.spec).toBe('FLOAT');
  });

  it('places MARIA on CPOE', () => {
    const { assignments } = proposeRotation({ members, history: sampleHistory, rules: DEFAULT_RULES });
    expect(assignments.MARIA.cpoe).toBe(true);
  });

  it('does not repeat a DAR cluster within the no-repeat window', () => {
    const { assignments } = proposeRotation({ members, history: sampleHistory, rules: DEFAULT_RULES });
    expect(assignments.ALYSSA.dar).not.toBe('dar1');
  });

  it('attaches a per-cell reason for every DAR pick', () => {
    const { assignments } = proposeRotation({ members, history: sampleHistory, rules: DEFAULT_RULES });
    for (const name of ['ALYSSA', 'JACQUE', 'LINH', 'NACHOLE', 'SHEILA']) {
      if (assignments[name].dar) {
        expect(assignments[name].reasons?.dar).toBeTruthy();
      }
    }
  });

  it('rotates the 3:01PM EMAIL side-role away from the prior holder', () => {
    const { assignments } = proposeRotation({ members, history: sampleHistory, rules: DEFAULT_RULES });
    const holder = Object.entries(assignments).find(([, a]) => (a.side || []).includes('3:01PM EMAIL'));
    expect(holder?.[0]).not.toBe('LINH');
  });

  it('warns when not every DAR cluster is filled', () => {
    const skinny = members.filter(m => m.level !== 'dar' || m.name === 'ALYSSA');
    const { sanity } = proposeRotation({ members: skinny, history: sampleHistory, rules: DEFAULT_RULES });
    expect(sanity.length).toBeGreaterThan(0);
  });

  it('points incoming members at an entity they have not covered', () => {
    const { assignments } = proposeRotation({ members, history: sampleHistory, rules: DEFAULT_RULES });
    expect(assignments.CASEY.incoming).toBeTruthy();
    expect(assignments.CASEY.incoming).not.toBe('SW');
  });
});

describe('diffAssignments', () => {
  it('lists differences across name/field/before/after', () => {
    const cur = { ALYSSA: { dar: 'dar1' }, MARIA: { cpoe: true } };
    const prop = { ALYSSA: { dar: 'dar3' }, MARIA: { cpoe: true } };
    const diff = diffAssignments(cur, prop);
    expect(diff).toEqual([{ name: 'ALYSSA', field: 'dar', before: 'dar1', after: 'dar3' }]);
  });
});

describe('ownershipMatrix', () => {
  it('counts cluster ownership across history per person', () => {
    const m = ownershipMatrix(sampleHistory, ['ALYSSA', 'JACQUE']);
    expect(m.ALYSSA.dar1).toBe(1);
    expect(m.ALYSSA.dar5).toBe(1);
    expect(m.JACQUE.dar2).toBe(1);
    expect(m.JACQUE.dar4).toBe(1);
  });
});
