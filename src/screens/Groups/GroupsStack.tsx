import React, { useEffect, useState } from 'react';
import GroupsListScreen from './GroupsListScreen';
import CreateGroupScreen from './CreateGroupScreen';
import GroupDetailsScreen from './GroupDetailsScreen';
import { Group } from '../../types/group';
import AddExpenseScreen from '../Expenses/AddExpenseScreen';
import ExpenseDetailsScreen from '../Expenses/ExpenseDetailsScreen';
import MembersScreen from './MembersScreen';
import GroupBalancesScreen from '../balances/GroupBalancesScreen';
import CreateSettlementScreen from '../settlements/CreateSettlementScreen';
import SettlementHistoryScreen from '../settlements/SettlementHistoryScreen';
import { UserProfile } from '../../types/user';
import { getUsersByIds } from '../../services/userService';
import { Expense } from '../../types/expense';
import { deleteExpense } from '../../services/expenseService';

type Route =
  | { name: 'list' }
  | { name: 'create' }
  | { name: 'details'; groupId: string }
  | { name: 'members'; groupId: string }
  | { name: 'balances'; groupId: string; baseCurrency: string; members: UserProfile[]; group: Group }
  | { name: 'history'; groupId: string; baseCurrency: string; members: UserProfile[]; group: Group }
  | { name: 'settle'; groupId: string; baseCurrency: string; members: UserProfile[]; group: Group; edge?: any }
  | { name: 'addExpense'; groupId: string; baseCurrency: string; members: UserProfile[]; group: Group; expense?: Expense }
  | { name: 'expenseDetails'; groupId: string; baseCurrency: string; members: UserProfile[]; group: Group; expense: Expense };

type PendingAction = { type: 'create' | 'details' | 'addExpense' | 'settle'; group?: Group };

type Props = {
  userId: string;
  onClose: () => void;
  pendingAction?: PendingAction | null;
  onActionHandled?: () => void;
};

export default function GroupsStack({ userId, onClose, pendingAction, onActionHandled }: Props) {
  const [route, setRoute] = useState<Route>({ name: 'list' });
  const [memberCache, setMemberCache] = useState<Record<string, UserProfile>>({});

  useEffect(() => {
    if (!pendingAction) return;
    onActionHandled?.();
    if (pendingAction.type === 'create') {
      setRoute({ name: 'create' });
      return;
    }
    const group = pendingAction.group;
    if (!group) return;
    if (pendingAction.type === 'details') {
      setRoute({ name: 'details', groupId: group.id });
      return;
    }
    const currency = group.baseCurrency || group.currency || 'INR';
    ensureMembers(group.members).then((users) => {
      if (pendingAction.type === 'addExpense') {
        setRoute({ name: 'addExpense', groupId: group.id, baseCurrency: currency, members: users, group });
      } else if (pendingAction.type === 'settle') {
        setRoute({ name: 'settle', groupId: group.id, baseCurrency: currency, members: users, group });
      }
    });
  }, [pendingAction]);

  const goToDetails = (group: Group) => setRoute({ name: 'details', groupId: group.id });
  const goToCreate = () => setRoute({ name: 'create' });
  const goToList = () => setRoute({ name: 'list' });
  const ensureMembers = async (ids: string[]) => {
    if (!ids.length) return [];
    const users = await getUsersByIds(ids);
    const map: Record<string, UserProfile> = {};
    users.forEach((u) => (map[u.id] = u));
    setMemberCache(map);
    return users;
  };

  if (route.name === 'create') {
    return <CreateGroupScreen userId={userId} onCreated={goToList} onBack={goToList} />;
  }

  if (route.name === 'details') {
    return (
      <GroupDetailsScreen
        groupId={route.groupId}
        userId={userId}
        onBack={goToList}
        onAddExpense={async (baseCurrency, memberIds, group) => {
          const users = await ensureMembers(memberIds);
          setRoute({ name: 'addExpense', groupId: route.groupId, baseCurrency, members: users, group });
        }}
        onViewExpense={async (expense, baseCurrency, memberIds, group) => {
          const users = await ensureMembers(memberIds);
          setRoute({
            name: 'expenseDetails',
            groupId: route.groupId,
            baseCurrency,
            members: users,
            group,
            expense,
          });
        }}
        onOpenMembers={(groupId) => setRoute({ name: 'members', groupId })}
        onOpenBalances={async (groupId, baseCurrency, memberIds, group) => {
          const users = await ensureMembers(memberIds);
          setRoute({ name: 'balances', groupId, baseCurrency, members: users, group });
        }}
      />
    );
  }

  if (route.name === 'members') {
    return <MembersScreen groupId={route.groupId} userId={userId} onBack={() => setRoute({ name: 'details', groupId: route.groupId })} />;
  }

  if (route.name === 'addExpense') {
    return (
      <AddExpenseScreen
        groupId={route.groupId}
        groupBaseCurrency={route.baseCurrency}
        group={route.group}
        members={route.members}
        currentUser={{ uid: userId } as any}
        onBack={() => setRoute({ name: 'details', groupId: route.groupId })}
        expense={route.expense}
      />
    );
  }

  if (route.name === 'expenseDetails') {
    const memberMap = route.members.reduce<Record<string, UserProfile>>((acc, m) => {
      acc[m.id] = m;
      return acc;
    }, {});
    return (
      <ExpenseDetailsScreen
        expense={route.expense}
        members={memberMap}
        onBack={() => setRoute({ name: 'details', groupId: route.groupId })}
        onEdit={() =>
          setRoute({
            name: 'addExpense',
            groupId: route.groupId,
            baseCurrency: route.baseCurrency,
            members: route.members,
            group: route.group,
            expense: route.expense,
          })
        }
        onDelete={async () => {
          if (route.expense.id) {
            await deleteExpense(route.groupId, route.expense.id, route.baseCurrency, route.expense.participants);
          }
          setRoute({ name: 'details', groupId: route.groupId });
        }}
      />
    );
  }

  if (route.name === 'balances') {
    return (
      <GroupBalancesScreen
        groupId={route.groupId}
        currentUserId={userId}
        currency={route.baseCurrency}
        onBack={() => setRoute({ name: 'details', groupId: route.groupId })}
        onSettle={(edge) =>
          setRoute({
            name: 'settle',
            groupId: route.groupId,
            baseCurrency: route.baseCurrency,
            members: route.members,
            group: route.group,
            edge,
          })
        }
        onViewHistory={() =>
          setRoute({ name: 'history', groupId: route.groupId, baseCurrency: route.baseCurrency, members: route.members, group: route.group })
        }
      />
    );
  }

  if (route.name === 'history') {
    return (
      <SettlementHistoryScreen
        groupId={route.groupId}
        currency={route.baseCurrency}
        onBack={() => setRoute({ name: 'details', groupId: route.groupId })}
      />
    );
  }

  if (route.name === 'settle') {
    return (
      <CreateSettlementScreen
        groupId={route.groupId}
        currency={route.baseCurrency}
        members={route.members}
        currentUserId={userId}
        onBack={() => setRoute({ name: 'balances', groupId: route.groupId, baseCurrency: route.baseCurrency, members: route.members, group: route.group })}
        edgeHint={route.edge}
      />
    );
  }

  return <GroupsListScreen userId={userId} onBack={onClose} onCreate={goToCreate} onSelect={goToDetails} />;
}
