import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { subscribeToUserGroups } from './groupService';
import { Group } from '../types/group';

export type HomeStats = {
  owedByCurrency: Record<string, number>;
  oweByCurrency: Record<string, number>;
  peopleWhoOweYou: number;
  peopleYouOwe: number;
};

export function subscribeHomeStats(userId: string, cb: (stats: HomeStats) => void, onError?: (e: any) => void) {
  const unsubGroups = subscribeToUserGroups(
    userId,
    async (groups) => {
      const stats = await computeStats(userId, groups);
      cb(stats);
    },
    onError,
  );
  return () => {
    unsubGroups();
  };
}

async function computeStats(userId: string, groups: Group[]): Promise<HomeStats> {
  const owed: Record<string, number> = {};
  const owe: Record<string, number> = {};
  const oweYouSet = new Set<string>();
  const youOweSet = new Set<string>();

  for (const g of groups) {
    const balanceSnap = await getDocs(query(collection(db, 'groups', g.id, 'balances'), where('userId', '==', userId)));
    balanceSnap.forEach((b) => {
      const data = b.data() as any;
      const cur = g.baseCurrency || g.currency || 'USD';
      if (data.netBalance > 0) {
        owed[cur] = (owed[cur] || 0) + data.netBalance;
      } else if (data.netBalance < 0) {
        owe[cur] = (owe[cur] || 0) + Math.abs(data.netBalance);
      }
    });

    const debtsSnap = await getDocs(collection(db, 'groups', g.id, 'simplifiedDebts'));
    debtsSnap.forEach((d) => {
      const edge = d.data() as any;
      if (edge.toUserId === userId) {
        oweYouSet.add(edge.fromUserId);
      } else if (edge.fromUserId === userId) {
        youOweSet.add(edge.toUserId);
      }
    });
  }

  return {
    owedByCurrency: owed,
    oweByCurrency: owe,
    peopleWhoOweYou: oweYouSet.size,
    peopleYouOwe: youOweSet.size,
  };
}
