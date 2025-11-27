import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SendContractEmailRequest {
  contractNumber: string;
  versionId: string;
  clientEmail: string;
  clientName: string;
  filePath: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contractNumber, versionId, clientEmail, clientName, filePath }: SendContractEmailRequest =
      await req.json();

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

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Contracts <onboarding@resend.dev>",
        to: [clientEmail],
        subject: `Contract ${contractNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #3b82f6;">Contract Document</h1>
            <p>Dear ${clientName},</p>
            <p>Please find attached the contract document <strong>${contractNumber}</strong>.</p>
            <p>If you have any questions, please don't hesitate to contact us.</p>
            <br>
            <p>Best regards,<br>RoboCRM Team</p>
          </div>
        `,
        attachments: [
          {
            filename: `Contract_${contractNumber}.pdf`,
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
