'use client';

import { useEffect, useState } from 'react';
import { Post } from './types';
import PostCard from './PostCard';

interface PostRepliesProps {
  parentId: string;
  recipeId: string;
  currentUserId: string | null;
  onReplyDelete: (id: string) => void;
}

// 답글 목록(1단) — 마운트 시 lazy fetch. 답글에는 또 답글/별점 없음.
export default function PostReplies({ parentId, recipeId, currentUserId, onReplyDelete }: PostRepliesProps) {
  const [replies, setReplies] = useState<Post[]>([]);

  useEffect(() => {
    let active = true;
    fetch(`/api/recipes/${recipeId}/posts/${parentId}/replies`)
      .then(r => r.json())
      .then(d => { if (active) setReplies(d.replies || []); })
      .catch(() => {});
    return () => { active = false; };
  }, [parentId, recipeId]);

  if (replies.length === 0) return null;

  return (
    <div className="mt-3 space-y-3">
      {replies.map(reply => (
        <PostCard
          key={reply.id}
          post={reply}
          currentUserId={currentUserId}
          recipeId={recipeId}
          isReply
          onUpdate={(id, updates) => setReplies(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r))}
          onDelete={(id) => { setReplies(prev => prev.filter(r => r.id !== id)); onReplyDelete(id); }}
        />
      ))}
    </div>
  );
}
