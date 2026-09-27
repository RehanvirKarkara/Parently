import { create } from "zustand";
import { persist } from "zustand/middleware";
import * as authApi from "@/api/auth";
import { setTokens } from "@/api/client";
import type { AppMode, Parent, User } from "@/types";

interface AuthState {
  user: User | null;
  mode: AppMode | null;
  parent: Parent | null;
  parentId: string | null;
  status: "idle" | "authenticating" | "authenticated";
  login: (email: string, password: string) => Promise<void>;
  register: (payload: authApi.RegisterPayload) => Promise<void>;
  registerParent: (payload: authApi.ParentRegisterPayload) => Promise<void>;
  activateParentInvite: (
    code: string,
    scopes?: string[],
    agreeTerms?: boolean,
    agreePrivacy?: boolean
  ) => Promise<void>;
  setParent: (parent: Parent | null) => void;
  setMode: (mode: AppMode) => void;
  updateUserAvatar: (avatarUrl: string | null) => void;
  updateParentAvatar: (avatarUrl: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      mode: null,
      parent: null,
      parentId: null,
      status: "idle",

      async login(email, password) {
        set({ status: "authenticating" });
        try {
          const res = await authApi.login({ email, password });
          setTokens(res.tokens.access_token, res.tokens.refresh_token);
          set({
            user: res.user,
            mode: res.mode,
            parent: res.mode === "parent" ? (res.user as unknown as Parent) : null,
            parentId: res.parent_id ?? null,
            status: "authenticated",
          });
        } catch (err) {
          set({ status: "idle" });
          throw err;
        }
      },

      async register(payload) {
        set({ status: "authenticating" });
        try {
          const res = await authApi.register(payload);
          setTokens(res.tokens.access_token, res.tokens.refresh_token);
          set({ user: res.user, mode: "offspring", parent: null, parentId: null, status: "authenticated" });
        } catch (err) {
          set({ status: "idle" });
          throw err;
        }
      },

      async registerParent(payload) {
        set({ status: "authenticating" });
        try {
          const res = await authApi.registerParent(payload);
          setTokens(res.tokens.access_token, res.tokens.refresh_token);
          set({
            user: res.user,
            mode: "parent",
            parent: res.user as unknown as Parent,
            parentId: res.parent_id ?? null,
            status: "authenticated",
          });
        } catch (err) {
          set({ status: "idle" });
          throw err;
        }
      },

      async activateParentInvite(code, scopes, agreeTerms, agreePrivacy) {
        const res = await authApi.activateParentInvite(code, scopes, agreeTerms, agreePrivacy);
        set((state) => ({
          parent: state.parent ? { ...state.parent, is_active: true } : state.parent,
          user: state.user ? { ...state.user, is_active: true } : state.user,
          status: res.already_active ? state.status : "authenticated",
        }));
      },

      setParent(parent) {
        set({ parent, parentId: parent?.id ?? null });
      },

      setMode(mode) {
        set({ mode, status: "authenticated" });
      },

      updateUserAvatar(avatarUrl) {
        set((state) => ({
          user: state.user ? { ...state.user, avatar_url: avatarUrl } : null,
        }));
      },

      updateParentAvatar(avatarUrl) {
        set((state) => ({
          parent: state.parent ? { ...state.parent, avatar_url: avatarUrl } : null,
        }));
      },

      logout() {
        authApi.logout();
        set({ user: null, mode: null, parent: null, parentId: null, status: "idle" });
      },
    }),
    {
      name: "parently.auth",
      partialize: (state) => ({
        user: state.user,
        mode: state.mode,
        parent: state.parent,
        parentId: state.parentId,
      }),
    },
  ),
);
