import { redirect } from "next/navigation";

import { auth } from "@/auth";

export async function requireUserId() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    redirect("/");
  }
  return userId;
}

export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }
  return session;
}
