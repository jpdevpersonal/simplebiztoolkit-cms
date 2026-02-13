"use client";

import React, { useEffect } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      await signOut({ redirect: false });
      router.replace("/admin/login");
    })();
  }, [router]);

  return <div className="container py-4">Signing out...</div>;
}
