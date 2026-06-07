import { useState, useEffect, useCallback } from "react";
import { getUser } from "../utils/auth";
import { getComments, createComment, deleteComment } from "../api/comments";
import Avatar from "./Avatar";
import { timeAgo } from "../utils/helpers";
import { toastError } from "../utils/toast";
import LoadingSpinner from "./LoadingSpinner";

export default function CommentBox({ taskId, canComment = true }) {
  const user = getUser();
  const [comments, setComments] = useState([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  const fetchComments = useCallback(async () => {
    if (!taskId) return;
    setLoading(true);
    try {
      const res = await getComments(taskId);
      setComments(res.data.comments || []);
    } catch {
      toastError("Failed to load comments.");
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!body.trim() || !canComment) return;
    setPosting(true);
    try {
      await createComment(taskId, { body: body.trim() });
      setBody("");
      fetchComments();
    } catch {
      toastError("Failed to post comment.");
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch {
      toastError("Failed to delete comment.");
    }
  };

  if (loading) return <LoadingSpinner className="py-6" />;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-700">
        Comments ({comments.length})
      </h3>

      {/* Comment list */}
      <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-thin pr-1">
        {comments.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">
            No comments yet. Be the first!
          </p>
        )}
        {comments.map((c) => (
          <div key={c.id} className="flex gap-2.5 group">
            <Avatar name={c.User?.name} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-800">
                  {c.User?.name}
                </span>
                <span className="text-xs text-gray-400">
                  {timeAgo(c.createdAt)}
                </span>
                {c.user_id === user?.id && (
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="ml-auto text-xs text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Delete
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-700 mt-0.5 break-words">
                {c.body}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* New comment input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Avatar name={user?.name} size="sm" className="flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <textarea
            rows={2}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey))
                handleSubmit(e);
            }}
            placeholder={
              canComment
                ? "Write a comment… (Ctrl+Enter to submit)"
                : "You can only comment on tasks assigned to you."
            }
            disabled={!canComment}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          />
          <div className="flex justify-end mt-1">
            <button
              type="submit"
              disabled={posting || !body.trim() || !canComment}
              className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 transition-colors"
            >
              {posting ? "Posting…" : "Comment"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
