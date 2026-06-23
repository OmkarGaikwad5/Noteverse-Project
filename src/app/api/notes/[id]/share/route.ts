// app/api/notes/[id]/share/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Note from "@/models/Note";
import User from "@/models/User";
import Invite from "@/models/Invite";
import AuditLog from "@/models/AuditLog";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendMail } from "@/lib/mailer";
import crypto from "crypto";
import mongoose from "mongoose";

/* ============================= */
/* Helper function to clean up old invites */
/* ============================= */
async function cleanupOldInvites(noteId: string) {
  try {
    const allInvites = await Invite.find({});
    
    for (const invite of allInvites) {
      if (invite.noteId && typeof invite.noteId === 'object' && invite.noteId.toString) {
        const oldNoteId = invite.noteId.toString();
        if (oldNoteId === noteId || oldNoteId === String(noteId)) {
          invite.noteId = String(noteId);
          await invite.save();
          console.log(`Updated invite ${invite._id} to use string noteId`);
        }
      }
    }
  } catch (error) {
    console.error("Error cleaning up invites:", error);
  }
}

/* ============================= */
/* Helper function to send email with error handling */
/* ============================= */
async function sendEmailWithRetry(to: string, subject: string, html: string, maxRetries = 2) {
  let lastError = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📧 Email attempt ${attempt}/${maxRetries} to: ${to}`);
      const result = await sendMail(to, subject, html);
      
      if (result && !result.error) {
        console.log(`✅ Email sent successfully on attempt ${attempt}`);
        return { success: true, result };
      } else {
        lastError = result?.error || new Error('Unknown email error');
        console.error(`❌ Email attempt ${attempt} failed:`, lastError);
        
        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    } catch (error) {
      lastError = error;
      console.error(`❌ Email attempt ${attempt} exception:`, error);
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }
  
  console.error(`❌ All ${maxRetries} email attempts failed for ${to}`);
  return { success: false, error: lastError };
}

/* ============================= */
/* SHARE NOTE - Works with ANY email */
/* ============================= */
export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  await dbConnect();

  const { id } = await context.params;

  try {
    const session = (await getServerSession(authOptions as any)) as Session | null;

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await User.findOne({ email: session.user.email });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { email, permission } = await req.json();

    if (!email || !permission) {
      return NextResponse.json(
        { error: "Missing email or permission" },
        { status: 400 }
      );
    }

    const emailLower = email.toLowerCase();
    const noteIdString = String(id);

    // Clean up any old invites with ObjectId format
    await cleanupOldInvites(noteIdString);

    // Find note by ID
    let note;
    try {
      note = await Note.findOne({ _id: id });
    } catch (err) {
      console.error("Error finding note:", err);
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    /* Only owner can share */
    if (String(note.userId) !== String(dbUser._id)) {
      return NextResponse.json(
        { error: "Only owner can share this note" },
        { status: 403 }
      );
    }

    /* Prevent sharing with yourself */
    if (emailLower === session.user.email.toLowerCase()) {
      return NextResponse.json(
        { error: "You already own this note" },
        { status: 400 }
      );
    }

    // Check if user exists in system
    const userToShare = await User.findOne({ email: emailLower });

    if (userToShare) {
      // User exists - share directly
      note.sharedWith = note.sharedWith || [];

      const existing = note.sharedWith.find(
        (s: any) => String(s.userId) === String(userToShare._id)
      );

      if (!existing) {
        note.sharedWith.push({
          userId: userToShare._id,
          permission,
          sharedAt: new Date(),
        });
      } else {
        existing.permission = permission;
      }

      await note.save();

      // Send email notification with retry
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Note Shared With You</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f9f9f9;
            }
            .card {
              background-color: #ffffff;
              border-radius: 12px;
              padding: 40px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 48px;
              margin-bottom: 20px;
            }
            h1 {
              color: #0078d4;
              font-size: 28px;
              margin-bottom: 10px;
            }
            .note-details {
              background-color: #f5f5f5;
              border-left: 4px solid #0078d4;
              padding: 20px;
              margin: 25px 0;
              border-radius: 8px;
            }
            .button {
              display: inline-block;
              background-color: #0078d4;
              color: #ffffff;
              text-decoration: none;
              padding: 12px 32px;
              border-radius: 8px;
              font-weight: 600;
              margin: 20px 0;
            }
            .button:hover {
              background-color: #005a9e;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #eee;
              font-size: 12px;
              color: #999;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <div class="header">
                <div class="logo">📝</div>
                <h1>Note Shared With You</h1>
              </div>
              
              <p>Hi there,</p>
              
              <p><strong>${dbUser.name || dbUser.email}</strong> has shared a note with you on NoteVerse.</p>
              
              <div class="note-details">
                <h3 style="margin: 0 0 10px 0; font-size: 18px;">📄 ${note.title}</h3>
                <p style="margin: 5px 0; color: #666;">
                  <strong>Permission:</strong> 
                  ${permission === 'edit' ? '✏️ Can edit' : '👁️ Can view'}
                </p>
                <p style="margin: 5px 0; color: #666;">
                  <strong>Type:</strong> 
                  ${note.type === 'notebook' ? '📓 Notebook' : '🎨 Canvas Board'}
                </p>
              </div>
              
              <div style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/note/${id}?mode=${note.type}" class="button">
                  Open Note
                </a>
              </div>
              
              <div class="footer">
                <p>This is an automated message from NoteVerse.</p>
                <p>&copy; ${new Date().getFullYear()} NoteVerse. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;
      
      const emailResult = await sendEmailWithRetry(
        emailLower,
        `📝 ${dbUser.name || dbUser.email} shared "${note.title}" with you`,
        emailHtml
      );

      await AuditLog.create({
        noteId: String(note._id),
        action: "shared",
        userId: dbUser._id,
        details: { 
          email: emailLower, 
          permission, 
          userExists: true,
          emailSent: emailResult.success,
          emailError: emailResult.error ? String(emailResult.error) : null
        },
      });

      return NextResponse.json({ 
        status: "shared", 
        message: `Note shared with ${email}${!emailResult.success ? ' (email notification failed, but access granted)' : ''}`,
        userExists: true,
        emailSent: emailResult.success
      });
      
    } else {
      // User doesn't exist - create invite
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      // Try to find existing invite
      let existingInvite = null;
      try {
        existingInvite = await Invite.findOne({ 
          noteId: noteIdString, 
          email: emailLower,
          status: 'pending'
        });
      } catch (err) {
        try {
          existingInvite = await Invite.findOne({ 
            noteId: new mongoose.Types.ObjectId(noteIdString), 
            email: emailLower,
            status: 'pending'
          });
        } catch (e) {
          const allInvites = await Invite.find({ 
            email: emailLower,
            status: 'pending'
          });
          existingInvite = allInvites.find(invite => String(invite.noteId) === noteIdString);
        }
      }
      
      if (existingInvite) {
        existingInvite.permission = permission;
        existingInvite.expiresAt = expiresAt;
        existingInvite.noteId = noteIdString;
        await existingInvite.save();
      } else {
        try {
          await Invite.create({
            token,
            noteId: noteIdString,
            inviterId: dbUser._id,
            email: emailLower,
            permission,
            message: `${dbUser.email} has shared a note with you.`,
            expiresAt,
            status: 'pending'
          });
        } catch (createError: any) {
          console.error("Create invite error:", createError);
          if (createError.name === 'ValidationError') {
            await Invite.create({
              token,
              noteId: String(noteIdString),
              inviterId: dbUser._id,
              email: emailLower,
              permission,
              message: `${dbUser.email} has shared a note with you.`,
              expiresAt,
              status: 'pending'
            });
          } else {
            throw createError;
          }
        }
      }
      
      // Create invite link
      const base = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000';
      const mode = note.type === "notebook" ? "notebook" : "canvas";
      const inviteLink = `${base}/invite/${token}?mode=${mode}`;
      
      // Send invitation email with retry
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>You're Invited to Collaborate!</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f9f9f9;
            }
            .card {
              background-color: #ffffff;
              border-radius: 12px;
              padding: 40px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 48px;
              margin-bottom: 20px;
            }
            h1 {
              color: #0078d4;
              font-size: 28px;
              margin-bottom: 10px;
            }
            .invite-details {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 25px;
              margin: 25px 0;
              border-radius: 12px;
            }
            .invite-details h3 {
              margin: 0 0 15px 0;
              font-size: 20px;
            }
            .button {
              display: inline-block;
              background-color: #0078d4;
              color: #ffffff;
              text-decoration: none;
              padding: 14px 36px;
              border-radius: 8px;
              font-weight: 600;
              margin: 20px 0;
            }
            .button:hover {
              background-color: #005a9e;
            }
            .expiry-note {
              background-color: #fff3e0;
              border-left: 4px solid #ff9800;
              padding: 15px;
              margin: 20px 0;
              border-radius: 8px;
              font-size: 13px;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #eee;
              font-size: 12px;
              color: #999;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <div class="header">
                <div class="logo">🎉</div>
                <h1>You're Invited!</h1>
              </div>
              
              <p>Hello,</p>
              
              <p><strong>${dbUser.name || dbUser.email}</strong> has invited you to collaborate on a note in NoteVerse.</p>
              
              <div class="invite-details">
                <h3>📄 ${note.title}</h3>
                <p style="margin: 8px 0; opacity: 0.9;">
                  <strong>Permission:</strong> ${permission === 'edit' ? '✏️ Can edit' : '👁️ Can view'}
                </p>
                <p style="margin: 8px 0; opacity: 0.9;">
                  <strong>Type:</strong> ${note.type === 'notebook' ? '📓 Notebook' : '🎨 Canvas Board'}
                </p>
              </div>
              
              <div style="text-align: center;">
                <a href="${inviteLink}" class="button">
                  Accept Invitation →
                </a>
              </div>
              
              <div class="expiry-note">
                <strong>⏰ This invitation will expire in 7 days</strong><br>
                Click the button above to create your account and start collaborating.
              </div>
              
              <div class="footer">
                <p>You received this email because ${dbUser.name || dbUser.email} invited you to collaborate on NoteVerse.</p>
                <p>&copy; ${new Date().getFullYear()} NoteVerse. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;
      
      const emailResult = await sendEmailWithRetry(
        emailLower,
        `✨ You're invited to collaborate on "${note.title}"`,
        emailHtml
      );

      await AuditLog.create({
        noteId: String(note._id),
        action: "invite_sent",
        userId: dbUser._id,
        details: { 
          email: emailLower, 
          permission, 
          token,
          emailSent: emailResult.success,
          emailError: emailResult.error ? String(emailResult.error) : null
        },
      });

      return NextResponse.json({ 
        status: "invited", 
        message: `Invitation sent to ${email}${!emailResult.success ? ' (email notification failed, but invitation created)' : ''}. They will receive an email with a link to create an account and access the note.`,
        userExists: false,
        inviteLink,
        emailSent: emailResult.success
      });
    }

  } catch (error) {
    console.error("Share error:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    
    return NextResponse.json(
      { error: "Internal Server Error", details: errorMessage },
      { status: 500 }
    );
  }
}

/* ============================= */
/* GET SHARE LIST                */
/* ============================= */
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  await dbConnect();

  const { id } = await context.params;

  try {
    const noteIdString = String(id);
    
    let note;
    try {
      note = await Note.findOne({ _id: id })
        .populate("sharedWith.userId", "email name image")
        .lean();
    } catch (err) {
      console.error("Error finding note:", err);
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    let invites = [];
    try {
      invites = await Invite.find({ 
        noteId: noteIdString, 
        status: 'pending',
        expiresAt: { $gt: new Date() }
      })
        .populate("inviterId", "email name")
        .sort({ createdAt: -1 });
    } catch (err) {
      const allInvites = await Invite.find({ 
        status: 'pending',
        expiresAt: { $gt: new Date() }
      })
        .populate("inviterId", "email name")
        .sort({ createdAt: -1 });
      
      invites = allInvites.filter(invite => String(invite.noteId) === noteIdString);
    }

    const sharedUsers = (note.sharedWith || []).map((share: any) => ({
      id: share.userId?._id,
      email: share.userId?.email,
      name: share.userId?.name,
      image: share.userId?.image,
      permission: share.permission,
      sharedAt: share.sharedAt,
      type: 'user'
    }));

    const pendingInvites = invites.map((invite: any) => ({
      id: invite._id,
      email: invite.email,
      permission: invite.permission,
      invitedBy: invite.inviterId?.email,
      invitedByName: invite.inviterId?.name,
      createdAt: invite.createdAt,
      expiresAt: invite.expiresAt,
      type: 'invite'
    }));

    return NextResponse.json({
      sharedWith: [...sharedUsers, ...pendingInvites]
    });

  } catch (error) {
    console.error("Share list error:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    
    return NextResponse.json(
      { error: "Internal Server Error", details: errorMessage },
      { status: 500 }
    );
  }
}

/* ============================= */
/* REMOVE ACCESS                 */
/* ============================= */
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  await dbConnect();

  const { id } = await context.params;

  try {
    const session = (await getServerSession(authOptions as any)) as Session | null;

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await User.findOne({ email: session.user.email });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { email, type } = await req.json();
    const noteIdString = String(id);

    let note;
    try {
      note = await Note.findOne({ _id: id });
    } catch (err) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    if (String(note.userId) !== String(dbUser._id)) {
      return NextResponse.json(
        { error: "Only owner can remove access" },
        { status: 403 }
      );
    }

    if (type === 'invite') {
      try {
        await Invite.deleteOne({ noteId: noteIdString, email: email.toLowerCase() });
      } catch (err) {
        const invitesToDelete = await Invite.find({ 
          email: email.toLowerCase(),
          status: 'pending'
        });
        const inviteToDelete = invitesToDelete.find(invite => String(invite.noteId) === noteIdString);
        if (inviteToDelete) {
          await Invite.deleteOne({ _id: inviteToDelete._id });
        }
      }
      
      await AuditLog.create({
        noteId: String(note._id),
        action: "invite_cancelled",
        userId: dbUser._id,
        details: { email: email.toLowerCase() },
      });
      
      return NextResponse.json({ 
        status: "invite_cancelled",
        message: `Invitation cancelled for ${email}`
      });
    } else {
      const userToRemove = await User.findOne({ email: email.toLowerCase() });

      if (!userToRemove) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      note.sharedWith = (note.sharedWith || []).filter(
        (s: any) => String(s.userId) !== String(userToRemove._id)
      );

      await note.save();

      await AuditLog.create({
        noteId: String(note._id),
        action: "unshared",
        userId: dbUser._id,
        details: { removed: userToRemove._id, email: email.toLowerCase() },
      });

      return NextResponse.json({ 
        status: "unshared",
        message: `Access removed for ${email}`
      });
    }

  } catch (error) {
    console.error("Remove access error:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    
    return NextResponse.json(
      { error: "Internal Server Error", details: errorMessage },
      { status: 500 }
    );
  }
}