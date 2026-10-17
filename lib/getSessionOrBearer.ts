import jwt from "jsonwebtoken";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type SessionLike = {
  user: {
    id: string;
    role: "ADMIN" | "EMPLOYEE";
  };
};

export async function getSessionOrBearer(req: Request): Promise<SessionLike | null> {
  const session = await getServerSession(authOptions);
  if (session?.user) {
    return { user: { id: session.user.id, role: session.user.role } };
  }

  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice("Bearer ".length);

  try {
    const secret = process.env.NEXTAUTH_SECRET || "uma_senha_super_secreta_aqui_para_desenvolvimento";
    const payload = jwt.verify(token, secret) as { id: string; role: "ADMIN" | "EMPLOYEE" };
    return { user: { id: payload.id, role: payload.role } };
  } catch {
    return null;
  }
}
