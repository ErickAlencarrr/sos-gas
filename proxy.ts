import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET || "uma_senha_super_secreta_aqui_para_desenvolvimento" });
  const { pathname } = req.nextUrl;

  // Permitir acesso à página de login livremente
  if (pathname.startsWith("/login")) {
    if (token) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  // Proteger rotas da aplicação
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Restringir área de Relatórios apenas para ADMIN
  if (pathname.startsWith("/relatorios") && token.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|logo.png).*)"],
};
