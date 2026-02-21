import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthOptions } from "next-auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },

  providers: [
    /* ---------------- GOOGLE LOGIN ---------------- */
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    /* ---------------- GITHUB LOGIN ---------------- */
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),

    /* ---------------- EMAIL LOGIN ---------------- */
    CredentialsProvider({
      name: "credentials",
      credentials: { email: {}, password: {} },

      async authorize(credentials) {
        await dbConnect();

        const user = await User.findOne({ email: credentials?.email });
        if (!user) return null;

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],

  callbacks: {
    /* ================= CREATE / LINK USER ================= */
    async signIn({ user, account }) {
      await dbConnect();

      if (!user?.email) return false;

      let dbUser = await User.findOne({ email: user.email });

      // First time login → create
      if (!dbUser) {
        dbUser = await User.create({
          name: user.name,
          email: user.email,
          image: user.image,
          provider: account?.provider, // google or github
        });
      }

      // IMPORTANT: replace OAuth id with Mongo id
      user.id = dbUser._id.toString();

      return true;
    },

    /* ================= STORE ID IN TOKEN ================= */
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },

    /* ================= EXPOSE ID TO FRONTEND ================= */
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};