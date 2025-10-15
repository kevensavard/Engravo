import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { contactMessages } from "@/lib/db/schema";
import { nanoid } from "nanoid";

export async function POST(request: NextRequest) {
  try {
    const { name, email, subject, message } = await request.json();

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Get current user (optional - contact can be from non-logged-in users)
    const user = await currentUser();

    // Save contact message to database
    await db.insert(contactMessages).values({
      id: nanoid(),
      userId: user?.id || null,
      name,
      email,
      subject,
      message,
      status: "unread",
    });

    return NextResponse.json({
      success: true,
      message: "Your message has been sent successfully!",
    });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}

