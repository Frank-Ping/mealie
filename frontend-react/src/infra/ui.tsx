import { Button, Chip, SvgIcon, createTheme, type ButtonProps } from "@mui/material";
import { Link } from "react-router";
import { Fragment, isValidElement, type HTMLAttributes, type MouseEventHandler, type ReactNode } from "react";

// Sample fallback colors are literal values from plugins/theme.ts.
// Server theme retrieval, dark preference and breakpoint equivalence remain R32 blockers.
export const sampleTheme = createTheme({
  spacing: 4,
  palette: { primary: { main: "#E58325" }, secondary: { main: "#973542" },
    success: { main: "#43A047" }, info: { main: "#1976d2" }, warning: { main: "#FF6D00" }, error: { main: "#EF5350" } },
});

interface LegacyChipProps {
  children?: ReactNode; color?: string; variant?: string; size?: string;
  label?: boolean; dark?: boolean; className?: string;
  onClick?: MouseEventHandler<HTMLDivElement>;
}
export function LegacyChip({ children, size, color, variant, label, dark: _dark, ...rest }: LegacyChipProps) {
  if (variant !== undefined && variant !== "flat") throw new Error("R07: unsupported chip variant");
  if (color !== undefined && color !== "accent") throw new Error("R07: unsupported chip palette");
  if (size !== undefined && size !== "small" && size !== "default") throw new Error("R07: unsupported chip size");
  return <Chip {...rest} label={children} size={size === "small" ? "small" : "medium"}
    sx={{ borderRadius: label ? 1 : undefined, bgcolor: color === "accent" ? "#007A99" : undefined,
      color: color === "accent" ? "#fff" : undefined }} />;
}

type Click = MouseEventHandler<HTMLElement>;
export type LegacyButtonProps = Omit<HTMLAttributes<HTMLElement>, "color" | "onClick"> & {
  to?: string | null; color?: string | null; size?: string; xSmall?: boolean;
  loading?: boolean; disabled?: boolean; type?: "button" | "reset" | "submit";
  variant?: "tonal" | "outlined" | "text" | "elevated"; onClick?: Click;
};
export function LegacyButton({ to, color, size, xSmall, variant, ...rest }: LegacyButtonProps) {
  if (xSmall) throw new Error("R08: legacy x-small behavior requires verification");
  if (size !== undefined && size !== "small" && size !== "default") throw new Error("R08: unsupported size");
  const known = ["primary", "secondary", "success", "info", "warning", "error"];
  if (color && !known.includes(color)) throw new Error("R08: unresolved palette color");
  const muiColor: NonNullable<ButtonProps["color"]> = !color ? "inherit" : color as "primary" | "secondary" | "success" | "info" | "warning" | "error";
  const common = { ...rest, color: muiColor, size: size === "small" ? "small" as const : "medium" as const,
    variant: variant === "outlined" || variant === "text" ? variant : "contained" as const };
  // Empty to is not an href; actual links use Router Link rather than imperative navigation.
  return to ? <Button {...common} component={Link} to={to} /> : <Button {...common} />;
}

export function LegacyIcon({ children, start, end }: { children?: ReactNode; start?: boolean; end?: boolean }) {
  function unwrap(node: ReactNode): ReactNode {
    return isValidElement<{ children?: ReactNode }>(node) && node.type === Fragment ? unwrap(node.props.children) : node;
  }
  const content = unwrap(children);
  return typeof content === "string"
    ? <SvgIcon aria-hidden="true" sx={{ mr: start ? 1 : 0, ml: end ? 1 : 0 }}><path d={content} /></SvgIcon>
    : <span aria-hidden="true" style={{ marginRight: start ? 4 : 0, marginLeft: end ? 4 : 0 }}>{content}</span>;
}
