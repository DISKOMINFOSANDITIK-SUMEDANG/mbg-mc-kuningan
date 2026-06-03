import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Makan Bergizi Gratis - Program Nasional di Kabupaten Sumedang";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#fff7ed",
          gap: "60px",
          padding: "60px 80px",
        }}
      >
        {/* Logo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://mbg.sumedangkab.go.id/images/logo-sumedang.png"
          alt="Logo Kabupaten Sumedang"
          style={{
            width: "220px",
            height: "220px",
            objectFit: "contain",
            flexShrink: 0,
          }}
        />
        {/* Text */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              fontSize: "18px",
              fontWeight: 600,
              color: "#ea580c",
              letterSpacing: "2px",
              textTransform: "uppercase",
            }}
          >
            Kabupaten Sumedang
          </div>
          <div
            style={{
              fontSize: "44px",
              fontWeight: 800,
              color: "#1c1917",
              lineHeight: 1.15,
            }}
          >
            Makan Bergizi
            <br />
            Gratis
          </div>
          <div
            style={{
              fontSize: "20px",
              color: "#57534e",
              lineHeight: 1.5,
              maxWidth: "560px",
            }}
          >
            Program prioritas nasional untuk memastikan anak-anak mendapat nutrisi berkualitas di Kabupaten Sumedang.
          </div>
          <div
            style={{
              fontSize: "16px",
              fontWeight: 600,
              color: "#ea580c",
              marginTop: "8px",
            }}
          >
            mbg.sumedangkab.go.id
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
