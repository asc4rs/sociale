import { ImageResponse } from "next/og";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
          color: "#0a0a0a",
          fontSize: 320,
          fontWeight: 700,
          borderRadius: 100,
        }}
      >
        S
      </div>
    ),
    { width: 512, height: 512 },
  );
}