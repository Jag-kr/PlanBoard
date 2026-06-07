import { getInitials, getAvatarColor } from "../utils/helpers";

export default function Avatar({ name = "", size = "md", className = "" }) {
  const sizes = {
    xs: "h-6 w-6 text-xs",
    sm: "h-7 w-7 text-xs",
    md: "h-8 w-8 text-sm",
    lg: "h-10 w-10 text-base",
    xl: "h-12 w-12 text-lg",
  };
  return (
    <div
      title={name}
      className={`${sizes[size]} ${getAvatarColor(name)} inline-flex items-center justify-center rounded-full font-semibold text-white select-none flex-shrink-0 ${className}`}
    >
      {getInitials(name)}
    </div>
  );
}
