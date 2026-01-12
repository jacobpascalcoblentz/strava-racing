import { cookies } from "next/headers";
import { jwtVerify } from "jose";

interface SessionUser {
  id: string;
  stravaId: number;
  name: string;
}

export async function getSession(): Promise<{ user: SessionUser } | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");

    if (!sessionCookie?.value) {
      return null;
    }

    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);
    const { payload } = await jwtVerify(sessionCookie.value, secret);

    return {
      user: {
        id: payload.id as string,
        stravaId: payload.stravaId as number,
        name: payload.name as string,
      },
    };
  } catch {
    return null;
  }
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}
