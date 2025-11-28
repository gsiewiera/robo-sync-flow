import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReportSubscription {
  id: string;
  report_type: string;
  recipient_email: string;
  recipient_name: string;
  frequency: string;
  enabled: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get frequency from request (weekly or monthly)
    const { frequency } = await req.json();
    
    console.log(`Generating ${frequency} reports...`);

    // Fetch active subscriptions for this frequency
    const { data: subscriptions, error: subsError } = await supabase
      .from("report_subscriptions")
      .select("*")
      .eq("enabled", true)
      .eq("frequency", frequency);

    if (subsError) throw subsError;

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: "No active subscriptions found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const now = new Date();
    const startDate = frequency === "weekly" 
      ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      : new Date(now.getFullYear(), now.getMonth(), 1);

    // Fetch report data
    const [salesData, offersData, clientsData, contractsData] = await Promise.all([
      supabase.from("offers").select("total_price, stage").eq("stage", "closed_won").gte("created_at", startDate.toISOString()),
      supabase.from("offers").select("id, stage").gte("created_at", startDate.toISOString()),
      supabase.from("clients").select("id").gte("created_at", startDate.toISOString()),
      supabase.from("contracts").select("id, status").gte("created_at", startDate.toISOString()),
    ]);

    const totalRevenue = salesData.data?.reduce((sum, offer) => sum + (offer.total_price || 0), 0) || 0;
    const wonDeals = salesData.data?.length || 0;
    const totalOffers = offersData.data?.length || 0;
    const newClients = clientsData.data?.length || 0;
    const activeContracts = contractsData.data?.filter(c => c.status === "active").length || 0;

    // Send emails to each subscription
    const emailPromises = subscriptions.map(async (sub: ReportSubscription) => {
      const periodText = frequency === "weekly" ? "Weekly" : "Monthly";
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .metric { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .metric-value { font-size: 32px; font-weight: bold; color: #667eea; }
            .metric-label { color: #6b7280; font-size: 14px; text-transform: uppercase; margin-top: 5px; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${periodText} Sales Report</h1>
              <p>Performance Summary for ${startDate.toLocaleDateString()} - ${now.toLocaleDateString()}</p>
            </div>
            <div class="content">
              <div class="metric">
                <div class="metric-value">${totalRevenue.toLocaleString()} PLN</div>
                <div class="metric-label">Total Revenue</div>
              </div>
              <div class="metric">
                <div class="metric-value">${wonDeals}</div>
                <div class="metric-label">Won Deals</div>
              </div>
              <div class="metric">
                <div class="metric-value">${totalOffers}</div>
                <div class="metric-label">Total Offers</div>
              </div>
              <div class="metric">
                <div class="metric-value">${newClients}</div>
                <div class="metric-label">New Clients</div>
              </div>
              <div class="metric">
                <div class="metric-value">${activeContracts}</div>
                <div class="metric-label">Active Contracts</div>
              </div>
            </div>
            <div class="footer">
              <p>This is an automated report from your CRM system.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      try {
        await resend.emails.send({
          from: "Reports <onboarding@resend.dev>",
          to: [sub.recipient_email],
          subject: `${periodText} Sales Report - ${now.toLocaleDateString()}`,
          html: htmlContent,
        });

        // Update last_sent_at
        await supabase
          .from("report_subscriptions")
          .update({ last_sent_at: now.toISOString() })
          .eq("id", sub.id);

        console.log(`Report sent to ${sub.recipient_email}`);
      } catch (error) {
        console.error(`Failed to send report to ${sub.recipient_email}:`, error);
      }
    });

    await Promise.all(emailPromises);

    return new Response(
      JSON.stringify({ message: `Reports sent to ${subscriptions.length} recipients` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("Error in send-scheduled-reports:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
};

serve(handler);
