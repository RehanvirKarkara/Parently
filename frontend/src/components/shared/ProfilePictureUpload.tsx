import { useRef, useState } from "react";
import { Camera, Trash2, Upload, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { PersonAvatar } from "@/components/shared/PersonAvatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProfilePictureUploadProps {
  first?: string | null;
  last?: string | null;
  avatarUrl?: string | null;
  color?: string;
  onAvatarChange: (newUrl: string | null) => void;
  size?: "md" | "lg" | "xl";
}

const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
];

export function ProfilePictureUpload({
  first,
  last,
  avatarUrl,
  color,
  onAvatarChange,
  size = "xl",
}: ProfilePictureUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file size should be less than 5MB");
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      onAvatarChange(result);
      setIsUploading(false);
      toast.success("Profile picture updated!");
    };
    reader.onerror = () => {
      setIsUploading(false);
      toast.error("Failed to read image file");
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
      {/* Avatar display with click overlay */}
      <div className="relative group w-fit">
        <PersonAvatar
          first={first}
          last={last}
          src={avatarUrl}
          color={color}
          size={size}
          className="ring-4 ring-primary/20 transition-transform group-hover:scale-105"
        />

        <motion.button
          whileTap={{ scale: 0.9 }}
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="absolute inset-0 flex items-center justify-center rounded-full bg-slate-950/45 text-white opacity-100 backdrop-blur-sm transition-all duration-200 hover:bg-slate-950/55 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
          aria-label="Upload profile picture"
        >
          <Camera className="h-6 w-6" />
        </motion.button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {/* Control buttons & preset gallery */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Upload className="h-4 w-4" />
            {avatarUrl ? "Change photo" : "Upload photo"}
          </Button>

          {avatarUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive hover:bg-destructive/10"
              onClick={() => {
                onAvatarChange(null);
                toast.success("Profile photo removed");
              }}
            >
              <Trash2 className="h-4 w-4" />
              Remove
            </Button>
          )}
        </div>

        {/* Presets */}
        <div>
           <p className="mb-1.5 flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary" /> Or pick a sample avatar:
          </p>
          <div className="flex items-center gap-2">
            {PRESET_AVATARS.map((url, i) => (
              <button
                key={i}
                type="button"
                aria-pressed={avatarUrl === url}
                onClick={() => {
                  onAvatarChange(url);
                  toast.success("Avatar selected!");
                }}
                className={cn(
                  "h-9 w-9 overflow-hidden rounded-full border-2 transition-all hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 motion-reduce:transform-none",
                  avatarUrl === url ? "scale-105 border-primary ring-2 ring-primary/20" : "border-border opacity-80 hover:opacity-100",
                )}
              >
                <img src={url} alt={`Avatar preset ${i + 1}`} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
