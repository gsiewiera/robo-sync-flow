import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const requestSchema = z.object({
  offerNumber: z.string().min(1).max(100),
  versionId: z.string().uuid(),
  clientEmail: z.string().email().max(255),
  clientName: z.string().min(1).max(200),
  filePath: z.string().min(1).max(500).refine(
    (path) => /^[a-zA-Z0-9\-_\/\.]+$/.test(path) && !path.includes('..'),
    { message: "Invalid file path format" }
  ),
});

// HTML sanitization helper
const sanitizeHtml = (str: string): string => {
  return str.replace(/[<>&"']/g, (char) => {
    const entities: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return entities[char] || char;
  });
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse and validate input
    const rawBody = await req.json();
    const validationResult = requestSchema.safeParse(rawBody);
    
    if (!validationResult.success) {
      console.error("Validation error:", validationResult.error.errors);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Invalid input", 
          details: validationResult.error.errors.map(e => e.message) 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const { offerNumber, versionId, clientEmail, clientName, filePath } = validationResult.data;

    console.log("Sending offer email:", { offerNumber, versionId, clientEmail });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey || !resendApiKey) {
      throw new Error("Missing configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Download the PDF from storage
    const { data: pdfData, error: downloadError } = await supabase.storage
      .from("offer-pdfs")
      .download(filePath);

    if (downloadError) {
      console.error("Error downloading PDF:", downloadError);
      throw new Error(`Failed to download PDF: ${downloadError.message}`);
    }

    // Convert blob to base64 for email attachment
    const arrayBuffer = await pdfData.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const base64Pdf = btoa(String.fromCharCode.apply(null, Array.from(uint8Array)));

    console.log("PDF downloaded successfully, size:", arrayBuffer.byteLength);

    // Sanitize user inputs for HTML
    const safeOfferNumber = sanitizeHtml(offerNumber);
    const safeClientName = sanitizeHtml(clientName);

    // Send email via Resend API
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Offers <onboarding@resend.dev>",
        to: [clientEmail],
        subject: `Offer ${safeOfferNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Your Offer ${safeOfferNumber}</h1>
            <p>Dear ${safeClientName},</p>
            <p>Please find attached our offer for your review.</p>
            <p>The PDF document contains detailed information about the products and pricing.</p>
            <p>If you have any questions, please don't hesitate to contact us.</p>
            <br>
            <p>Best regards,<br>The Sales Team</p>
          </div>
        `,
        attachments: [
          {
            filename: `Offer_${offerNumber.replace(/[^a-zA-Z0-9\-_]/g, '_')}.pdf`,
            content: base64Pdf,
          },
        ],
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("Resend API error:", errorText);
      throw new Error(`Resend API error: ${errorText}`);
    }

    const emailResult = await emailResponse.json();
    console.log("Email sent successfully:", emailResult);

    return new Response(JSON.stringify({ success: true, data: emailResult }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-offer-email function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || "Failed to send email" 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
