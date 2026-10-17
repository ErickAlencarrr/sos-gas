import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { verifyCredentials } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "E-mail e senha são obrigatórios" }, { status: 400 });
    }

    const user = await verifyCredentials(email, password);

    if (!user) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
    }

    const secret = process.env.NEXTAUTH_SECRET || "uma_senha_super_secreta_aqui_para_desenvolvimento";
    const token = jwt.sign({ id: user.id, role: user.role }, secret, { expiresIn: "30d" });

    return NextResponse.json({ token, user });
  } catch {
    return NextResponse.json({ error: "Erro ao autenticar" }, { status: 500 });
  }
}
