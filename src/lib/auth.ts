import GoogleProvider from "next-auth/providers/google";
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

  /* ================= MAGIC HAPPENS HERE ================= */
  callbacks: {
    async signIn({ user, account, profile }) {
      await dbConnect();

      // Only for Google login
      if (account?.provider === "google") {
        let dbUser = await User.findOne({ email: user.email });

        // Create user if first login
        if (!dbUser) {
          dbUser = await User.create({
            name: user.name,
            email: user.email,
            image: user.image,
            provider: "google",
          });
        }

        // Replace OAuth id with Mongo id
        user.id = dbUser._id.toString();
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string; // ALWAYS Mongo ObjectId
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};
