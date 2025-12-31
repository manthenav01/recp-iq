import { NextRequest, NextResponse } from "next/server";
import heicConvert from "heic-convert";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // Convert to JPEG using heic-convert (pure JS/WASM, no sys dep)
        const jpegBuffer = await heicConvert({
            buffer: buffer,
            format: 'JPEG',
            quality: 0.8
        });

        // Return as image/jpeg
        return new NextResponse(jpegBuffer as BodyInit, {
            headers: {
                "Content-Type": "image/jpeg",
                "Content-Disposition": `inline; filename="${file.name.replace(/\.[^/.]+$/, "")}.jpg"`,
            },
        });
    } catch (error) {
        console.error("Server-side HEIC conversion failed:", error);
        return NextResponse.json(
            { error: "Image conversion failed" },
            { status: 500 }
        );
    }
}
