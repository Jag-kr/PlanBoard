import { useState, useEffect } from "react";
import { updateTask } from "../api/tasks";
import { getMembers } from "../api/members";
import { getActiveWorkspace } from "../utils/workspace";
import { PriorityBadge, StatusBadge } from "./Badge";
import CommentBox from "./CommentBox";
import Modal from "./Modal";
import {
  STATUS_LIST,
  PRIORITY_LIST,
  STATUS_CONFIG,
  PRIORITY_CONFIG,
} from "../utils/constants";
import { toastError, toastSuccess } from "../utils/toast";
import LoadingSpinner from "./LoadingSpinner";

export default function TaskDrawer({ task, onClose, onUpdated }) {
  const activeWorkspace = getActiveWorkspace();
  const [form, setForm] = useState(null);
  const [members, setMembers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!task) return;
    setForm({
      title: task.title,
      description: task.description || "",
      status: task.status,
      priority: task.priority,
      assignee_id: task.assignee_id || "",
      due_date: task.due_date || "",
    });
    setDirty(false);
  }, [task]);

  useEffect(() => {
    if (!activeWorkspace) return;
    getMembers(activeWorkspace.id)
      .then((res) => setMembers(res.data.members || []))
      .catch(() => {});
  }, [activeWorkspace]);

  if (!task) return null;

  const change = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setDirty(true);
  };

  const handleSave = async () => {
    if (!dirty) return;
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description,
        status: form.status,
        priority: form.priority,
        assignee_id: form.assignee_id || null,
        due_date: form.due_date || null,
      };
      const res = await updateTask(task.id, payload);
      onUpdated && onUpdated(res.data.task);
      toastSuccess("Task updated.");
      setDirty(false);
    } catch {
      toastError("Failed to save task.");
    } finally {
      setSaving(false);
    }
  };

  if (!form)
    return (
      <Modal isOpen={true} onClose={onClose} title="Loading..." size="lg">
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      </Modal>
    );

  return (
    <Modal isOpen={true} onClose={onClose} size="2xl">
      <div className="space-y-4">
        {/* Status & Priority Bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <StatusBadge status={form.status} />
            <PriorityBadge priority={form.priority} />
          </div>
          {dirty && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto space-y-5">
          {/* Title */}
          <input
            value={form.title}
            onChange={change("title")}
            className="w-full text-lg font-semibold text-gray-900 border-0 border-b border-transparent hover:border-gray-200 focus:border-blue-400 focus:outline-none py-1 transition-colors"
          />

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Status */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Status
              </label>
              <select
                value={form.status}
                onChange={change("status")}
                className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {STATUS_LIST.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_CONFIG[s].label}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Priority
              </label>
              <select
                value={form.priority}
                onChange={change("priority")}
                className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {PRIORITY_LIST.map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_CONFIG[p].label}
                  </option>
                ))}
              </select>
            </div>

            {/* Assignee */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Assignee
              </label>
              <select
                value={form.assignee_id}
                onChange={change("assignee_id")}
                className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Due date */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Due date
              </label>
              <input
                type="date"
                value={form.due_date}
                onChange={change("due_date")}
                className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Description
            </label>
            <textarea
              rows={4}
              value={form.description}
              onChange={change("description")}
              placeholder="Add a description…"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Meta info */}
          <div className="text-xs text-gray-400 space-y-0.5">
            {task.creator && (
              <p>
                Created by{" "}
                <span className="font-medium text-gray-600">
                  {task.creator.name}
                </span>
              </p>
            )}
          </div>

          <hr className="border-gray-100" />

          {/* Comments */}
          <CommentBox taskId={task.id} workspaceId={activeWorkspace?.id} />
        </div>
      </div>
    </Modal>
  );
}
