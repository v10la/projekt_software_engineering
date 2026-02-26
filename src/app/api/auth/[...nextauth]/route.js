import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";

/**
 * IMPORTANT:
 * - Put your SQLite DB file at: /data/<yourdb>.db
 * - Set NEXTAUTH_SECRET and NEXTAUTH_URL in .env.local
 *
 * Example .env.local:
 * NEXTAUTH_URL=http://localhost:3000
 * NEXTAUTH_SECRET=some-long-random-string
 */

async function getDb() {
  // Change the filename below if your DB file has a different name.
  // Example: "./data/geschenke.db" or "./data/dev.db"
  const dbPath = path.join(process.cwd(), "data", "geschenke.db");

  return open({
    filename: dbPath,
    driver: sqlite3.Database,
  });
}

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim();
        const password = credentials?.password;

        if (!email || !password) return null;

        const db = await getDb();

        // Make sure your users table has columns:
        // id, name, email, password, role
        const user = await db.get("SELECT * FROM users WHERE email = ?", email);

        if (!user) return null;

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return null;

        // Return the minimal safe user object for the session
        return {
          id: String(user.id),
          name: user.name ?? "",
          email: user.email,
          role: user.role ?? "user",
        };
      },
    }),
  ],

  session: { strategy: "jwt" },

  pages: {
    // Keep NextAuth default page if you don't have a custom one yet.
    // If you DO have a custom login page at /login, set:
    // signIn: "/login",
  },

  callbacks: {
    // Put role into the JWT
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },

    // Expose role on the session object (useful for RBAC)
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },

    // Always redirect to homepage after sign-in (fixes odd callback redirects)
    async redirect({ baseUrl }) {
      return baseUrl;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };