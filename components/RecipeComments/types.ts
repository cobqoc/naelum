// 댓글 시스템 타입 정의

export interface CommentUser {
  id: string;
  username: string;
  avatar_url: string | null;
}

export interface Comment {
  id: string;
  recipe_id: string;
  user_id: string;
  parent_comment_id: string | null;
  content: string;
  image_url: string | null;
  likes_count: number;
  is_edited: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  user: CommentUser;
  replies_count?: number; // API에서 계산된 값
  is_liked?: boolean; // 현재 사용자의 좋아요 여부
}

export interface CommentsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CommentsResponse {
  comments: Comment[];
  pagination: CommentsPagination;
}

export interface CommentFormProps {
  recipeId: string;
  parentCommentId?: string | null;
  placeholder?: string;
  onCommentCreated?: (comment: Comment) => void;
  autoFocus?: boolean;
  onCancel?: () => void;
}

export interface CommentListProps {
  comments: Comment[];
  currentUserId: string | null;
  recipeId: string;
  onCommentUpdate: (commentId: string, updates: Partial<Comment>) => void;
  onCommentDelete: (commentId: string) => void;
}

export interface CommentItemProps {
  comment: Comment;
  currentUserId: string | null;
  recipeId: string;
  isReply?: boolean;
  depth?: number; // 답글 깊이 (0: 최상위, 1: 1단계 답글, 2: 2단계 답글)
  onCommentUpdate: (commentId: string, updates: Partial<Comment>) => void;
  onCommentDelete: (commentId: string) => void;
}

export interface CommentActionsProps {
  comment: Comment;
  currentUserId: string | null;
  isOwner: boolean;
  onLike: () => void;
  onReply: () => void;
  onEdit: () => void;
  onDelete: () => void;
  likesCount: number;
  isLiked: boolean;
  repliesCount: number;
}

export interface RepliesListProps {
  parentCommentId: string;
  recipeId: string;
  currentUserId: string | null;
  repliesCount: number;
  depth?: number;
  isOpen: boolean;
  onToggle: () => void;
  onCommentUpdate: (commentId: string, updates: Partial<Comment>) => void;
  onCommentDelete: (commentId: string) => void;
  onReplyCreated: () => void;
}
