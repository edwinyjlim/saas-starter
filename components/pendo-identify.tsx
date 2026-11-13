'use client';

import { useEffect } from 'react';
import useSWR from 'swr';
import { TeamDataWithMembers, User } from '@/lib/db/schema';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function toIsoString(value: Date | string | null | undefined) {
  return value ? new Date(value).toISOString() : null;
}

export function PendoIdentify() {
  const { data: user } = useSWR<User | null>('/api/user', fetcher);
  const { data: team } = useSWR<TeamDataWithMembers | null>(
    '/api/team',
    fetcher
  );

  useEffect(() => {
    if (!user) {
      return;
    }

    // Only attach the team when it belongs to this user, so a cached team
    // from a previous session is never sent with the new visitor.
    const membership = team?.teamMembers.find(
      (member) => member.userId === user.id
    );

    pendo.identify({
      visitor: {
        id: user.id,
        email: user.email,
        full_name: user.name,
        role: user.role,
        accountId: membership ? membership.teamId : null,
        teamRole: membership ? membership.role : null,
        joinedAt: toIsoString(membership?.joinedAt),
        createdAt: toIsoString(user.createdAt),
        updatedAt: toIsoString(user.updatedAt)
      },
      ...(team && membership
        ? {
            account: {
              id: team.id,
              name: team.name,
              planName: team.planName,
              subscriptionStatus: team.subscriptionStatus,
              stripeProductId: team.stripeProductId,
              userCount: team.teamMembers.length,
              createdAt: toIsoString(team.createdAt)
            }
          }
        : {})
    });
  }, [user, team]);

  return null;
}
