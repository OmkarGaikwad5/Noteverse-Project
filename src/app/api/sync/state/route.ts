import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Note from '@/models/Note';
import User from '@/models/User';
import { getServerSession } from "next-auth";
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
  await dbConnect();

  try {
    // 1️⃣ Get logged in user session
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2️⃣ Convert email → database user
    const dbUser = await User.findOne({ email: session.user.email });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 3️⃣ Parse date
    const { searchParams } = new URL(req.url);
    const since = searchParams.get('since');
    const sinceDate = since ? new Date(since) : new Date(0);

    // 4️⃣ Fetch notes safely — include notes shared with this user
    const notes = await Note.find({
      $and: [
        { updatedAt: { $gt: sinceDate } },
        {
          $or: [
            { userId: dbUser._id },
            { 'sharedWith.userId': dbUser._id }
          ]
        }
      ]
    }).lean();

    return NextResponse.json({
      notes,
      serverTime: new Date()
    });

  } catch (error) {
    console.error("State Sync Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
