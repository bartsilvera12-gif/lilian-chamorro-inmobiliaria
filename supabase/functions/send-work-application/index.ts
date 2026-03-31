import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import nodemailer from "npm:nodemailer@6.9.15";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const smtpHost = Deno.env.get("SMTP_HOST") ?? "smtp.office365.com";
    const smtpPort = Number(Deno.env.get("SMTP_PORT") ?? "587");
    const smtpUser = Deno.env.get("SMTP_USER");
    const smtpPass = Deno.env.get("SMTP_PASS");
    const fromEmail = Deno.env.get("WORK_FORM_FROM_EMAIL") ?? smtpUser;
    const toEmail = Deno.env.get("WORK_FORM_TO_EMAIL") ?? "alanayalapsn@gmail.com";

    if (!smtpUser || !smtpPass || !fromEmail) {
      return new Response(
        JSON.stringify({ error: "Faltan secrets SMTP_USER, SMTP_PASS o WORK_FORM_FROM_EMAIL" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json();
    const nombre = String(body?.nombre ?? "").trim();
    const edad = String(body?.edad ?? "").trim();
    const sexo = String(body?.sexo ?? "").trim();
    const mensaje = String(body?.mensaje ?? "").trim();

    if (!nombre || !edad || !sexo || !mensaje) {
      return new Response(
        JSON.stringify({ error: "Todos los campos son obligatorios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: false,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const info = await transporter.sendMail({
      from: fromEmail,
      to: toEmail,
      subject: "Postulación - Trabajar con nosotros",
      html: `
        <h2>Nueva postulación</h2>
        <p><strong>Nombre Completo:</strong> ${nombre}</p>
        <p><strong>Edad:</strong> ${edad}</p>
        <p><strong>Sexo:</strong> ${sexo}</p>
        <p><strong>Mensaje:</strong></p>
        <p>${mensaje.replace(/\n/g, "<br/>")}</p>
      `,
    });

    return new Response(JSON.stringify({ ok: true, id: info.messageId }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

