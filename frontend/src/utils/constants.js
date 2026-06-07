// Status display labels and colours
export const STATUS_CONFIG = {
  TODO: {
    label: "To Do",
    color: "bg-gray-100 text-gray-600",
    dot: "bg-gray-400",
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "bg-blue-100 text-blue-700",
    dot: "bg-blue-500",
  },
  IN_REVIEW: {
    label: "In Review",
    color: "bg-purple-100 text-purple-700",
    dot: "bg-purple-500",
  },
  DONE: {
    label: "Done",
    color: "bg-green-100 text-green-700",
    dot: "bg-green-500",
  },
};

export const STATUS_LIST = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"];

// Priority display labels and colours
export const PRIORITY_CONFIG = {
  URGENT: { label: "Urgent", color: "bg-red-100 text-red-700", icon: "🔴" },
  HIGH: { label: "High", color: "bg-orange-100 text-orange-700", icon: "🟠" },
  MEDIUM: { label: "Medium", color: "bg-blue-100 text-blue-700", icon: "🔵" },
  LOW: { label: "Low", color: "bg-gray-100 text-gray-600", icon: "⚪" },
};

export const PRIORITY_LIST = ["URGENT", "HIGH", "MEDIUM", "LOW"];

// Role hierarchy
export const ROLE_HIERARCHY = { ADMIN: 3, MANAGER: 2, MEMBER: 1 };

export const ROLE_COLORS = {
  ADMIN: "bg-red-100 text-red-700",
  MANAGER: "bg-blue-100 text-blue-700",
  MEMBER: "bg-gray-100 text-gray-600",
};

export const KANBAN_COLUMNS = [
  { id: "TODO", label: "To Do", headerColor: "border-gray-300 text-gray-600" },
  {
    id: "IN_PROGRESS",
    label: "In Progress",
    headerColor: "border-blue-400 text-blue-700",
  },
  {
    id: "IN_REVIEW",
    label: "In Review",
    headerColor: "border-purple-400 text-purple-700",
  },
  { id: "DONE", label: "Done", headerColor: "border-green-400 text-green-700" },
];
