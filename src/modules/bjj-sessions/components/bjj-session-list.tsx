"use client";

import { BjjSessionViewModel } from "@/modules/bjj-sessions/types/bjj-session.types";
import { BjjSessionCard } from "@/modules/bjj-sessions/components/bjj-session-card";

interface BjjSessionListProps {
  sessions: BjjSessionViewModel[];
  onEdit: (session: BjjSessionViewModel) => void;
  onDelete: (session: BjjSessionViewModel) => void;
}

export function BjjSessionList({ sessions, onEdit, onDelete }: BjjSessionListProps) {
  return (
    <div className="space-y-4">
      {sessions.map((session) => (
        <BjjSessionCard key={session.id} session={session} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}
