"use client";

import { cn } from "@aaas/ui";
import { useFollows } from "@/lib/follows";

interface FollowButtonProps {
  type: "entity" | "channel";
  id: string;
  name: string;
  className?: string;
}

export function FollowButton({ type, id, name, className }: FollowButtonProps) {
  const {
    isFollowingEntity,
    isFollowingChannel,
    followEntity,
    unfollowEntity,
    followChannel,
    unfollowChannel,
  } = useFollows();

  const following =
    type === "entity" ? isFollowingEntity(id) : isFollowingChannel(id);

  const handleClick = () => {
    if (type === "entity") {
      if (following) { unfollowEntity(id); } else { followEntity(id); }
    } else {
      if (following) { unfollowChannel(id); } else { followChannel(id); }
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "inline-flex items-center justify-center w-7 h-7 rounded-full border transition-colors",
        following
          ? "border-circuit text-circuit bg-circuit/10"
          : "border-border text-text-muted hover:text-circuit hover:border-circuit",
        className,
      )}
      title={following ? `Following ${name}` : `Follow ${name}`}
    >
      {following ? (
        /* Filled bell */
        <svg
          className="w-3.5 h-3.5"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.25 9a6.75 6.75 0 0113.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 01-.573 1.23H3.705a.75.75 0 01-.573-1.23A8.69 8.69 0 005.25 9.75V9zm4.502 8.9a2.25 2.25 0 004.496 0 25.057 25.057 0 01-4.496 0z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        /* Outline bell */
        <svg
          className="w-3.5 h-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
      )}
    </button>
  );
}
