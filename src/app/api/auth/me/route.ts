import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function GET() {
  try {
    await dbConnect();

    // 1. Try NextAuth session first (Google/GitHub)
    const session = await getServerSession(authOptions);

    if (session?.user?.email) {
      let user = await User.findOne({ email: session.user.email });

      // Auto create user if not exists
      if (!user) {
        user = await User.create({
          name: session.user.name || "User",
          email: session.user.email,
          image: session.user.image || "",
          provider: "oauth",
          isGuest: false,
        });
      }

      return NextResponse.json({
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          isGuest: user.isGuest,
        },
      });
    }

    // 2. Fallback → Old JWT login
    const cookieStore = await cookies();
    const token = cookieStore.get("token");

    if (token) {
      const decoded = jwt.verify(token.value, JWT_SECRET) as {
        userId: string;
        email: string;
      };

      const user = await User.findById(decoded.userId).select("-password");

      if (user) {
        return NextResponse.json({
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            isGuest: user.isGuest,
          },
        });
      }
    }

    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json({ message: "Invalid auth" }, { status: 401 });
  }
}
