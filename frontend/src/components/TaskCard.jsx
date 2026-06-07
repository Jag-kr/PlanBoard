import { PriorityBadge } from "./Badge";
import Avatar from "./Avatar";
import { formatDate, isOverdue } from "../utils/helpers";

export default function TaskCard({
  task,
  onClick,
  onDragStart,
  onDragEnd,
  isDraggable = true,
}) {
  const overdue = isOverdue(task.due_date) && task.status !== "DONE";

  return (
    <div
      draggable={isDraggable}
      onDragStart={(e) => isDraggable && onDragStart && onDragStart(e, task)}
      onDragEnd={onDragEnd}
      onClick={() => onClick && onClick(task)}
      className={`bg-white rounded-lg shadow-sm hover:shadow-md border border-gray-100 hover:border-blue-200 p-3 transition-all duration-150 select-none group ${isDraggable ? "cursor-pointer" : "cursor-not-allowed opacity-80"}`}
    >
      {/* Priority badge */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <PriorityBadge priority={task.priority} />
        {task.due_date && (
          <span
            className={`text-xs ${overdue ? "text-red-600 font-semibold" : "text-gray-400"}`}
          >
            {overdue ? "⚠ " : ""}
            {formatDate(task.due_date)}
          </span>
        )}
      </div>

      {/* Title */}
      <p className="text-sm font-medium text-gray-900 leading-snug line-clamp-2 group-hover:text-blue-700 transition-colors mb-2">
        {task.title}
      </p>

      {/* Footer: comment count + assignee */}
      <div className="flex items-center justify-between mt-1">
        {task.description ? (
          <span className="text-xs text-gray-400 truncate max-w-[100px]">
            📝 Has description
          </span>
        ) : (
          <span />
        )}
        {task.assignee && <Avatar name={task.assignee.name} size="xs" />}
      </div>
    </div>
  );
}
