import { NextResponse } from "next/server";
import { inngest } from "@/app/inngest/client";

export async function POST(req: Request) {
  try {
    const { event, data } = await req.json();

    if (!event) {
      return NextResponse.json(
        { error: "Event name is required" },
        { status: 400 },
      );
    }

    await inngest.send({
      name: event,
      data: data || {},
    });

    return NextResponse.json({
      success: true,
      message: `Event ${event} sent to Inngest`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
