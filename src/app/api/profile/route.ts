import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Notebook from "@/models/Notebook";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { headers } from "next/headers";


const JWT_SECRET = process.env.JWT_SECRET!;

export async function GET() {
  try {
    await dbConnect();

    let user = null;

    // 1. Try NextAuth session (Google/GitHub)
    const session = await getServerSession(authOptions);

    if (session?.user?.email) {
      user = await User.findOne({ email: session.user.email });
    }

    // 2. Fallback → Old JWT
    if (!user) {
      const cookieHeader = headers().get("cookie");
      const token = cookieHeader
        ?.split(";")
        .find((c) => c.trim().startsWith("token="))
        ?.split("=")[1];

      if (token) {
        try {
          const decoded: any = jwt.verify(token, JWT_SECRET);
          user = await User.findById(decoded.userId);
        } catch (e) {}
      }
    }

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Stats
    const notesCount = await Notebook.countDocuments({
      userId: user._id,
      type: { $ne: "canvas" },
    });

    const canvasCount = await Notebook.countDocuments({
      userId: user._id,
      type: "canvas",
    });

    return NextResponse.json({
      user: {
        name: user.name || "Guest User",
        email: user.email,
        joinedAt: user.createdAt,
      },
      stats: {
        notes: notesCount,
        canvases: canvasCount,
      },
    });
  } catch (error) {
    console.error("Profile API Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
