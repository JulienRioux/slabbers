import { NextResponse } from "next/server";
import sharp from "sharp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

/**
 * Detect a card-like bounding box in an image.
 * Strategy:
 *  - Downscale for speed
 *  - grayscale + blur
 *  - try a couple threshold algorithms
 *  - get ROIs (connected components) from the mask
 *  - score candidates by area + "trading-card-ish" aspect ratio
 *  - return bbox mapped back to the original image coordinates
 *
 * Uses ImageJS masks + ROIs (fromMask().getRois()).
 */
function toNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function toBbox(pred, imageWidth, imageHeight) {
  if (!pred || typeof pred !== "object") return null;

  const raw = pred.bbox && typeof pred.bbox === "object" ? pred.bbox : pred;

  const leftRaw =
    toNumber(raw.left) ??
    toNumber(raw.xmin) ??
    toNumber(raw.x1) ??
    toNumber(raw.x0);
  const topRaw =
    toNumber(raw.top) ??
    toNumber(raw.ymin) ??
    toNumber(raw.y1) ??
    toNumber(raw.y0);
  const rightRaw =
    toNumber(raw.right) ?? toNumber(raw.xmax) ?? toNumber(raw.x2);
  const bottomRaw =
    toNumber(raw.bottom) ?? toNumber(raw.ymax) ?? toNumber(raw.y2);

  const xRaw = toNumber(raw.x);
  const yRaw = toNumber(raw.y);
  const widthRaw = toNumber(raw.width);
  const heightRaw = toNumber(raw.height);

  const normalized =
    widthRaw != null && heightRaw != null && widthRaw <= 1 && heightRaw <= 1;

  const scaleX = (v) => (normalized ? v * imageWidth : v);
  const scaleY = (v) => (normalized ? v * imageHeight : v);

  if (
    leftRaw != null &&
    rightRaw != null &&
    topRaw != null &&
    bottomRaw != null
  ) {
    const left = scaleX(leftRaw);
    const right = scaleX(rightRaw);
    const top = scaleY(topRaw);
    const bottom = scaleY(bottomRaw);
    return {
      x: Math.round(left),
      y: Math.round(top),
      width: Math.round(right - left),
      height: Math.round(bottom - top),
    };
  }

  if (xRaw != null && yRaw != null && widthRaw != null && heightRaw != null) {
    const width = scaleX(widthRaw);
    const height = scaleY(heightRaw);
    const x = scaleX(xRaw) - width / 2;
    const y = scaleY(yRaw) - height / 2;
    return {
      x: Math.round(x),
      y: Math.round(y),
      width: Math.round(width),
      height: Math.round(height),
    };
  }

  return null;
}

function collectPredictions(result) {
  const predictions = [];
  const stack = [result];

  while (stack.length) {
    const current = stack.pop();
    if (!current) continue;

    if (Array.isArray(current)) {
      for (const item of current) stack.push(item);
      continue;
    }

    if (typeof current !== "object") continue;

    if (Array.isArray(current.predictions)) {
      predictions.push(...current.predictions);
    }

    for (const value of Object.values(current)) {
      if (value && (typeof value === "object" || Array.isArray(value))) {
        stack.push(value);
      }
    }
  }

  return predictions;
}

async function detectCardBoundingBox(imageBuffer) {
  const normalized = await sharp(imageBuffer)
    .rotate()
    .jpeg({ quality: 92 })
    .toBuffer();
  const metadata = await sharp(normalized).metadata();
  const imageWidth = metadata.width ?? 0;
  const imageHeight = metadata.height ?? 0;
  if (!imageWidth || !imageHeight) {
    throw new Error("Unable to read image dimensions.");
  }

  const apiKey =
    process.env.ROBOFLOW_PRIVATE_API_KEY ||
    process.env.ROBOFLOW_PUBLISHABLE_API_KEY;
  if (!apiKey) {
    throw new Error("Missing ROBOFLOW_PRIVATE_API_KEY.");
  }

  const response = await fetch(
    "https://serverless.roboflow.com/patio-ppznd/workflows/find-graded-cases-trading-cards-slabs-and-otherwise-the-trading-card-itselves",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: apiKey,
        inputs: {
          image: {
            type: "base64",
            value: normalized.toString("base64"),
          },
        },
      }),
    },
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error || "Roboflow request failed.");
  }

  const result = await response.json();
  const predictions = collectPredictions(result);

  let best = null;
  for (const pred of predictions) {
    const bbox = toBbox(pred, imageWidth, imageHeight);
    if (!bbox || bbox.width <= 0 || bbox.height <= 0) continue;
    const area = bbox.width * bbox.height;
    if (!best || area > best.area) best = { bbox, area };
  }

  if (!best) {
    throw new Error(
      "No card-like region detected. Try a clearer photo/background.",
    );
  }

  let { x, y, width, height } = best.bbox;

  // Add a little padding (2% of max dimension)
  const pad = Math.round(0.02 * Math.max(width, height));
  x -= pad;
  y -= pad;
  width += pad * 2;
  height += pad * 2;

  // Clamp to image bounds
  x = Math.max(0, x);
  y = Math.max(0, y);
  width = Math.min(imageWidth - x, width);
  height = Math.min(imageHeight - y, height);

  if (width <= 5 || height <= 5) {
    throw new Error("Detected bbox too small after clamping.");
  }

  return { bbox: { x, y, width, height }, normalized };
}

export async function POST(req) {
  try {
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        {
          error: "Send a multipart/form-data request with field name `image`.",
        },
        { status: 400 },
      );
    }

    const formData = await req.formData();
    const file = formData.get("image");

    if (!file || typeof file.arrayBuffer !== "function") {
      return NextResponse.json(
        { error: "Missing `image` file field in form-data." },
        { status: 400 },
      );
    }

    const buf = Buffer.from(await file.arrayBuffer());

    // Detect bbox
    const { bbox, normalized } = await detectCardBoundingBox(buf);

    // Crop (and normalize to JPEG)
    const cropped = await sharp(normalized)
      .extract({
        left: bbox.x,
        top: bbox.y,
        width: bbox.width,
        height: bbox.height,
      })
      .jpeg({ quality: 92 })
      .toBuffer();

    // If you want JSON instead of an image, set ?format=json
    const url = new URL(req.url);

    if (url.searchParams.get("format") === "json") {
      return NextResponse.json({
        bbox,
        // base64 is convenient for quick testing; remove in prod if you want smaller responses
        croppedBase64: cropped.toString("base64"),
      });
    }

    // Return image bytes + bbox in headers
    return new NextResponse(cropped, {
      status: 200,
      headers: {
        "content-type": "image/jpeg",
        "x-bbox-x": String(bbox.x),
        "x-bbox-y": String(bbox.y),
        "x-bbox-w": String(bbox.width),
        "x-bbox-h": String(bbox.height),
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "Unknown error" },
      { status: 500 },
    );
  }
}
