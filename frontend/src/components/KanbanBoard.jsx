import { useState, useCallback } from "react";
import TaskCard from "./TaskCard";
import { KANBAN_COLUMNS } from "../utils/constants";

export default function KanbanBoard({
  tasks,
  onTaskClick,
  onStatusChange,
  canDragTask,
}) {
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  const handleDragStart = useCallback((e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedTask(null);
    setDragOverCol(null);
  }, []);

  const handleDragOver = useCallback((e, columnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverCol(columnId);
  }, []);

  const handleDrop = useCallback(
    (e, columnId) => {
      e.preventDefault();
      if (draggedTask && draggedTask.status !== columnId) {
        onStatusChange && onStatusChange(draggedTask, columnId);
      }
      setDraggedTask(null);
      setDragOverCol(null);
    },
    [draggedTask, onStatusChange],
  );

  return (
    <div className="flex gap-4 h-full overflow-x-auto pb-4">
      {KANBAN_COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.id);
        const isOver = dragOverCol === col.id;

        return (
          <div
            key={col.id}
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDrop={(e) => handleDrop(e, col.id)}
            className={`flex-shrink-0 w-72 flex flex-col rounded-xl transition-colors duration-150 ${
              isOver ? "bg-blue-50" : "bg-gray-50"
            }`}
          >
            {/* Column header */}
            <div
              className={`flex items-center justify-between px-3 py-2.5 border-b-2 ${col.headerColor}`}
            >
              <span className="text-sm font-semibold">{col.label}</span>
              <span className="text-xs font-medium bg-white rounded-full px-2 py-0.5 shadow-sm text-gray-600">
                {colTasks.length}
              </span>
            </div>

            {/* Tasks */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[120px] scrollbar-thin">
              {colTasks.length === 0 ? (
                <div
                  className={`flex items-center justify-center h-20 rounded-lg border-2 border-dashed transition-colors ${
                    isOver ? "border-blue-300 bg-blue-50" : "border-gray-200"
                  }`}
                >
                  <span className="text-xs text-gray-400">Drop here</span>
                </div>
              ) : (
                colTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`transition-opacity duration-100 ${
                      draggedTask?.id === task.id ? "opacity-40" : "opacity-100"
                    }`}
                  >
                    <TaskCard
                      task={task}
                      onClick={onTaskClick}
                      onDragStart={
                        canDragTask?.(task) ? handleDragStart : undefined
                      }
                      onDragEnd={handleDragEnd}
                      isDraggable={canDragTask?.(task)}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
