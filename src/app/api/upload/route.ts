import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const BUCKET_CONFIG: Record<string, { public: boolean; maxSizeMB: number }> = {
  "community-logos": { public: true, maxSizeMB: 5 },
  "community-banners": { public: true, maxSizeMB: 10 },
};

async function ensureBucket(supabase: any, bucketName: string) {
  const { data: buckets } = await supabase.storage.listBuckets();
  if (buckets?.find((b: any) => b.name === bucketName)) return;

  const { error: createErr } = await supabase.storage.createBucket(bucketName, { public: true } as any);
  if (createErr) throw new Error(`Failed to create bucket: ${createErr.message}`);
}

export async function POST(request: Request) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const bucket = formData.get("bucket") as string | null;
  const userId = formData.get("userId") as string | null;

  if (!file || !bucket || !userId) {
    return NextResponse.json({ error: "Missing file, bucket, or userId" }, { status: 400 });
  }

  if (!BUCKET_CONFIG[bucket]) {
    return NextResponse.json({ error: `Unknown bucket: ${bucket}` }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Unsupported file type. Accepted: JPG, PNG, WEBP" }, { status: 400 });
  }

  const config = BUCKET_CONFIG[bucket];
  if (file.size > config.maxSizeMB * 1024 * 1024) {
    return NextResponse.json({ error: `File too large. Max ${config.maxSizeMB}MB` }, { status: 400 });
  }

  await ensureBucket(supabaseAdmin, bucket);

  const ext = file.type.split("/")[1] || "jpg";
  const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { data: existing } = await supabaseAdmin.storage.from(bucket).list(userId);
  if (existing && existing.length > 0) {
    const paths = existing.map((f) => `${userId}/${f.name}`);
    await supabaseAdmin.storage.from(bucket).remove(paths);
  }

  const buffer = await file.arrayBuffer();
  const { error: uploadError } = await supabaseAdmin.storage
    .from(bucket)
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: publicUrl } = supabaseAdmin.storage
    .from(bucket)
    .getPublicUrl(fileName);

  return NextResponse.json({ url: publicUrl.publicUrl });
}

export async function DELETE(request: Request) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { url } = await request.json();
  if (!url) return NextResponse.json({ error: "URL required" }, { status: 400 });

  const bucket = url.includes("community-logos") ? "community-logos" : "community-banners";

  const urlObj = new URL(url);
  const pathParts = urlObj.pathname.split("/");
  const filePath = pathParts.slice(pathParts.indexOf(bucket) + 1).join("/");

  if (!filePath) return NextResponse.json({ error: "Could not parse file path" }, { status: 400 });

  const { error } = await supabaseAdmin.storage.from(bucket).remove([filePath]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ message: "Deleted" });
}
