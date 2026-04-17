import type { ReactNode } from "react";

export type LayoutToggleIconButtonProps = {
  active?: boolean;
  className?: string;
  icon: ReactNode;
  label: string;
  onClick: () => void;
};

export function LayoutToggleIconButton({
  active = false,
  className,
  icon,
  label,
  onClick,
}: LayoutToggleIconButtonProps) {
  return (
    <button
      type="button"
      className={`layout-toggle-icon-button${active ? " is-active" : ""}${className ? ` ${className}` : ""}`}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
    >
      {icon}
    </button>
  );
}
