export function avatarColorClass(color?: string): string {
  switch (color) {
    case "brand":
      return "bg-primary/15 text-primary";
    case "mint":
      return "bg-secondary/15 text-secondary";
    case "coral":
      return "bg-accent/15 text-accent";
    case "warning":
      return "bg-warning/15 text-warning-foreground";
    case "slate":
      return "bg-muted text-muted-foreground";
    default:
      return "bg-primary/15 text-primary";
  }
}
