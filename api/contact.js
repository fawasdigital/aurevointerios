function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string" && req.body) {
    try {
      return JSON.parse(req.body);
    } catch (err) {
      return {};
    }
  }
  return {};
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  const { name, email, phone, message, company } = readBody(req);
  if (company) {
    res.status(200).json({ ok: true });
    return;
  }

  const clean = {
    name: String(name || "").trim(),
    email: String(email || "").trim(),
    phone: String(phone || "").trim(),
    message: String(message || "").trim(),
  };

  if (!clean.name || !clean.email || !clean.phone || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean.email)) {
    res.status(400).json({ ok: false, error: "Name, a valid email, and phone are required." });
    return;
  }

  const text = `Name: ${clean.name}\nEmail: ${clean.email}\nPhone: ${clean.phone}\n\n${clean.message}`;

  if (process.env.RESEND_API_KEY) {
    const sent = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || "Aurevo website <leads@aurevointeriors.com>",
        to: [process.env.ENQUIRY_TO || "aurevointeriors@gmail.com"],
        reply_to: clean.email,
        subject: `Website enquiry from ${clean.name}`,
        text,
      }),
    });
    if (!sent.ok) {
      res.status(502).json({ ok: false, error: "Could not send the enquiry email." });
      return;
    }
    res.status(200).json({ ok: true });
    return;
  }

  const whatsapp = `https://wa.me/919562695661?text=${encodeURIComponent(`Website enquiry\n${text}`)}`;
  res.status(200).json({ ok: true, whatsapp });
};
