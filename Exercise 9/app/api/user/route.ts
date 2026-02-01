import { inngest } from "@/app/inngest/client";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const { email, name } = await req.json();
  
    // Create user (your business logic)
    const user = { id: "user-123", email, name };

    await inngest.send({
        name: "user/create",
        data: {
            email,
            name
        }
    })

    return NextResponse.json({ success: true, user });
}