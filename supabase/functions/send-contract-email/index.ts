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
  contractNumber: z.string().min(1).max(100),
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

    const { contractNumber, versionId, clientEmail, clientName, filePath } = validationResult.data;

    console.log("Sending contract email:", { contractNumber, versionId, clientEmail });

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey || !resendApiKey) {
      throw new Error("Missing configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: pdfData, error: downloadError } = await supabase.storage
      .from("contract-pdfs")
      .download(filePath);

    if (downloadError) {
      console.error("Error downloading PDF:", downloadError);
      throw new Error(`Failed to download PDF: ${downloadError.message}`);
    }

    const arrayBuffer = await pdfData.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const base64Pdf = btoa(String.fromCharCode.apply(null, Array.from(uint8Array)));

    console.log("PDF downloaded successfully, size:", arrayBuffer.byteLength);

    // Sanitize user inputs for HTML
    const safeContractNumber = sanitizeHtml(contractNumber);
    const safeClientName = sanitizeHtml(clientName);

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Contracts <onboarding@resend.dev>",
        to: [clientEmail],
        subject: `Contract ${safeContractNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #3b82f6;">Contract Document</h1>
            <p>Dear ${safeClientName},</p>
            <p>Please find attached the contract document <strong>${safeContractNumber}</strong>.</p>
            <p>If you have any questions, please don't hesitate to contact us.</p>
            <br>
            <p>Best regards,<br>RoboCRM Team</p>
          </div>
        `,
        attachments: [
          {
            filename: `Contract_${contractNumber.replace(/[^a-zA-Z0-9\-_]/g, '_')}.pdf`,
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

    // Get authorization header to identify the user
    const authHeader = req.headers.get("authorization");
    let userId = null;
    
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id;
    }

    // Record email sending history
    const { error: historyError } = await supabase
      .from("contract_email_history")
      .insert({
        contract_version_id: versionId,
        sent_to: clientEmail,
        sent_by: userId,
        status: "sent",
        notes: `Sent to ${safeClientName}`,
      });

    if (historyError) {
      console.error("Error recording email history:", historyError);
    }

    return new Response(JSON.stringify({ success: true, data: emailResult }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-contract-email function:", error);
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
