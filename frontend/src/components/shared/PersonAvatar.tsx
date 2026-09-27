import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/utils";
import { avatarColorClass } from "@/components/shared/avatarColor";

interface PersonAvatarProps {
  first?: string | null;
  last?: string | null;
  src?: string | null;
  color?: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-xl",
};

export function PersonAvatar({ first, last, src, color, className, size = "md" }: PersonAvatarProps) {
  const fullName = `${first ?? ""} ${last ?? ""}`.trim();
  return (
    <Avatar className={cn(sizes[size], className)}>
      {src && <AvatarImage src={src} alt={fullName || "User Avatar"} />}
      <AvatarFallback className={cn("font-heading font-semibold", avatarColorClass(color))}>
        {initials(first, last)}
      </AvatarFallback>
    </Avatar>
  );
}
