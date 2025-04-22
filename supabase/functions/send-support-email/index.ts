// Follow this setup guide to integrate the Deno runtime into your application:
// https://docs.supabase.com/guides/functions/deno-runtime

import { createClient } from "npm:@supabase/supabase-js";
import { corsHeaders } from "../_shared/cors.ts";
import nodemailer from "npm:nodemailer@6.9.3";

const supportEmail = "Javier@riosglobalexperts.com";

interface SupportRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

async function sendEmail(data: SupportRequest) {
  // Configure the email transporter (ideally use environment variables for these values)
  const transporter = nodemailer.createTransport({
    host: Deno.env.get("SMTP_HOST") || "smtp.gmail.com",
    port: parseInt(Deno.env.get("SMTP_PORT") || "587"),
    secure: Deno.env.get("SMTP_SECURE") === "true",
    auth: {
      user: Deno.env.get("SMTP_USER"),
      pass: Deno.env.get("SMTP_PASSWORD"),
    },
  });

  // Set up email data
  const mailOptions = {
    from: Deno.env.get("SMTP_FROM") || "noreply@yourdomain.com",
    to: supportEmail,
    replyTo: data.email,
    subject: `Consulta de soporte: ${data.subject}`,
    text: `
      Nombre: ${data.name}
      Email: ${data.email}
      
      Mensaje:
      ${data.message}
    `,
    html: `
      <h3>Nueva consulta de soporte</h3>
      <p><strong>Nombre:</strong> ${data.name}</p>
      <p><strong>Email:</strong> ${data.email}</p>
      <p><strong>Asunto:</strong> ${data.subject}</p>
      <hr>
      <h4>Mensaje:</h4>
      <p>${data.message.replace(/\n/g, '<br>')}</p>
    `,
  };

  // Send email
  const info = await transporter.sendMail(mailOptions);
  return info;
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Extract the request data
    const data = await req.json() as SupportRequest;
    
    // Validate required fields
    if (!data.name || !data.email || !data.message) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Send the email
    await sendEmail(data);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Support request sent successfully" 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in send-support-email function:", error);
    
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to send support request",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});