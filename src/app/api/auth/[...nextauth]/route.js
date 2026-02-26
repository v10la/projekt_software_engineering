import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcrypt"
import sqlite3 from "sqlite3"
import { open } from "sqlite"

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {

        const db = await open({
          filename: "./data/geschenke.db", // ← CHANGE THIS
          driver: sqlite3.Database
        })

        const user = await db.get(
          "SELECT * FROM users WHERE email = ?",
          credentials.email
        )

        if (!user) {
          throw new Error("User not found")
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isValid) {
          throw new Error("Invalid password")
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  secret: process.env.NEXTAUTH_SECRET
})

export { handler as GET, handler as POST }