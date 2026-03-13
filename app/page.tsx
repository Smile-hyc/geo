"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Loader2 } from "lucide-react";
import { useAuthStore } from "@/lib/auth";
import { getLoginState, syncUserToDb, getUserProfile } from "@/lib/cloudbase";

export default function RootPage() {
  const router = useRouter();
  const { user, setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const check = async () => {
      if (user) {
        router.replace("/home");
        return;
      }
      try {
        const loginState = await getLoginState();
        if (loginState) {
          const uid = loginState.user.uid ?? "unknown";
          const email = (loginState.user as { email?: string }).email ?? "";
          const fallbackUsername = email ? email.split("@")[0] : uid.substring(0, 8);

          try {
            const dbUser = await syncUserToDb({
              username: fallbackUsername,
              email: email || uid,
              cloudbase_uid: uid,
            });
            setUser({
              uid,
              email: email || uid,
              username: dbUser.username || fallbackUsername,
              role: dbUser.role || "user",
              points_balance: dbUser.points_balance ?? 0,
              level: dbUser.level ?? 1,
            });
          } catch {
            const profileRes = await getUserProfile({ cloudbase_uid: uid, email: email || undefined });
            if (profileRes?.user) {
              setUser({
                uid,
                email: profileRes.user.email || email,
                username: profileRes.user.username || fallbackUsername,
                role: profileRes.user.role || "user",
                points_balance: profileRes.user.points_balance ?? 0,
                level: profileRes.user.level ?? 1,
              });
            } else {
              setUser({
                uid,
                email: email || uid,
                username: fallbackUsername,
                role: "user",
                points_balance: 0,
                level: 1,
              });
            }
          }
          router.replace("/home");
        } else {
          router.replace("/login");
        }
      } catch {
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    };
    check();
  }, [user, router, setUser, setLoading]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-muted-foreground">
      <div className="flex items-center gap-3">
        <MapPin className="h-8 w-8 text-primary animate-pulse" />
        <span className="text-xl font-semibold text-foreground">GeoAnnotate</span>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>加载中…</span>
      </div>
    </div>
  );
}
