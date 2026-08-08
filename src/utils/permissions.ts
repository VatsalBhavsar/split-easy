import { Group } from '../types/group';

export function isAdmin(group: Group | null, userId?: string | null) {
  if (!group || !userId) return false;
  return group.admins?.includes(userId);
}

export function canRemoveAdmin(group: Group, targetUserId: string) {
  const adminCount = group.admins?.length ?? 0;
  const isTargetAdmin = group.admins?.includes(targetUserId);
  if (!isTargetAdmin) return true;
  return adminCount > 1;
}

