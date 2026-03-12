"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, Button } from "@aaas/ui";

interface Comment {
  id: string;
  author: string;
  content: string;
  parentId: string | null;
  upvotes: number;
  createdAt: string | null;
}

interface EntityCommentsProps {
  type: string;
  slug: string;
}

function relativeTime(iso: string | null): string {
  if (!iso) return "just now";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function CommentForm({
  onSubmit,
  parentId,
  onCancel,
  storedAuthor,
}: {
  onSubmit: (author: string, content: string, parentId: string | null) => Promise<void>;
  parentId: string | null;
  onCancel?: () => void;
  storedAuthor: string;
}) {
  const [author, setAuthor] = useState(storedAuthor);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const trimmedAuthor = author.trim();
    const trimmedContent = content.trim();

    if (!trimmedAuthor || trimmedAuthor.length > 50) {
      setError("Name must be 1-50 characters.");
      return;
    }
    if (!trimmedContent || trimmedContent.length > 1000) {
      setError("Comment must be 1-1000 characters.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(trimmedAuthor, trimmedContent, parentId);
      setContent("");
    } catch {
      setError("Failed to post comment. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="text"
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
        placeholder="Your name"
        maxLength={50}
        className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-circuit"
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={parentId ? "Write a reply..." : "Join the discussion..."}
        maxLength={1000}
        rows={parentId ? 2 : 3}
        className="w-full rounded-md border border-border bg-base px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-circuit resize-none"
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex items-center gap-2">
        <Button type="submit" variant="primary" size="sm" disabled={submitting}>
          {submitting ? "Posting..." : parentId ? "Reply" : "Post Comment"}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

function CommentItem({
  comment,
  replies,
  depth,
  onReply,
  onVote,
  replyingTo,
  setReplyingTo,
  storedAuthor,
  votedIds,
}: {
  comment: Comment;
  replies: Comment[];
  depth: number;
  onReply: (author: string, content: string, parentId: string | null) => Promise<void>;
  onVote: (id: string) => void;
  replyingTo: string | null;
  setReplyingTo: (id: string | null) => void;
  storedAuthor: string;
  votedIds: Set<string>;
}) {
  const hasVoted = votedIds.has(comment.id);

  return (
    <div className={depth > 0 ? "ml-6 border-l border-border pl-4" : ""}>
      <div className="py-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-text">{comment.author}</span>
          <span className="text-xs text-text-muted font-mono">
            {relativeTime(comment.createdAt)}
          </span>
        </div>
        <p className="text-sm text-text leading-relaxed whitespace-pre-wrap">
          {comment.content}
        </p>
        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={() => onVote(comment.id)}
            disabled={hasVoted}
            className={`flex items-center gap-1 text-xs transition-colors ${
              hasVoted
                ? "text-circuit cursor-default"
                : "text-text-muted hover:text-circuit"
            }`}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill={hasVoted ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 4l-8 8h5v8h6v-8h5z" />
            </svg>
            {comment.upvotes}
          </button>
          {depth < 2 && (
            <button
              onClick={() =>
                setReplyingTo(replyingTo === comment.id ? null : comment.id)
              }
              className="text-xs text-text-muted hover:text-circuit transition-colors"
            >
              Reply
            </button>
          )}
        </div>
        {replyingTo === comment.id && (
          <div className="mt-3">
            <CommentForm
              onSubmit={onReply}
              parentId={comment.id}
              onCancel={() => setReplyingTo(null)}
              storedAuthor={storedAuthor}
            />
          </div>
        )}
      </div>
      {replies.map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          replies={[]}
          depth={depth + 1}
          onReply={onReply}
          onVote={onVote}
          replyingTo={replyingTo}
          setReplyingTo={setReplyingTo}
          storedAuthor={storedAuthor}
          votedIds={votedIds}
        />
      ))}
    </div>
  );
}

export function EntityComments({ type, slug }: EntityCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [storedAuthor, setStoredAuthor] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("aaas-author");
      if (saved) setStoredAuthor(saved);
      const voted = localStorage.getItem("aaas-voted-comments");
      if (voted) setVotedIds(new Set(JSON.parse(voted)));
    } catch {
      /* ignore */
    }
  }, []);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/entity/${type}/${slug}/comments`);
      if (res.ok) {
        const json = await res.json();
        setComments(json.data ?? []);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [type, slug]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  async function handleSubmit(
    author: string,
    content: string,
    parentId: string | null,
  ) {
    localStorage.setItem("aaas-author", author);
    setStoredAuthor(author);

    const res = await fetch(`/api/entity/${type}/${slug}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ author, content, parentId }),
    });

    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.error || "Failed to post");
    }

    setReplyingTo(null);
    await fetchComments();
  }

  function handleVote(commentId: string) {
    if (votedIds.has(commentId)) return;

    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId ? { ...c, upvotes: c.upvotes + 1 } : c,
      ),
    );

    const newVoted = new Set(votedIds);
    newVoted.add(commentId);
    setVotedIds(newVoted);
    localStorage.setItem(
      "aaas-voted-comments",
      JSON.stringify([...newVoted]),
    );

    fetch(`/api/entity/${type}/${slug}/comments/${commentId}/vote`, {
      method: "POST",
    }).catch(() => {
      /* best-effort */
    });
  }

  const topLevel = comments.filter((c) => !c.parentId);
  const repliesByParent = comments.reduce<Record<string, Comment[]>>(
    (acc, c) => {
      if (c.parentId) {
        if (!acc[c.parentId]) acc[c.parentId] = [];
        acc[c.parentId].push(c);
      }
      return acc;
    },
    {},
  );

  return (
    <section className="py-8">
      <div className="mx-auto max-w-4xl px-4">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-xl font-semibold text-text">Discussion</h2>
          <span className="text-sm text-text-muted font-mono">
            {comments.length} comment{comments.length !== 1 ? "s" : ""}
          </span>
        </div>

        <Card className="p-5 mb-6">
          <CommentForm
            onSubmit={handleSubmit}
            parentId={null}
            storedAuthor={storedAuthor}
          />
        </Card>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-surface rounded w-1/4 mb-2" />
                <div className="h-3 bg-surface rounded w-3/4 mb-1" />
                <div className="h-3 bg-surface rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <p className="text-center text-text-muted py-8">
            No comments yet. Start the discussion!
          </p>
        ) : (
          <div className="divide-y divide-border">
            {topLevel.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                replies={repliesByParent[comment.id] ?? []}
                depth={0}
                onReply={handleSubmit}
                onVote={handleVote}
                replyingTo={replyingTo}
                setReplyingTo={setReplyingTo}
                storedAuthor={storedAuthor}
                votedIds={votedIds}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
