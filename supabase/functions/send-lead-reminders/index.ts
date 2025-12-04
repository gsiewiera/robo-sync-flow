import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Lead {
  id: string;
  offer_number: string;
  next_action_date: string;
  lead_status: string;
  client_name: string;
  person_contact: string;
  follow_up_notes: string;
}

interface SalespersonLeads {
  email: string;
  full_name: string;
  overdue: Lead[];
  dueSoon: Lead[];
}

// HTML sanitization helper to prevent XSS
const sanitizeHtml = (str: string | null | undefined): string => {
  if (!str) return '';
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Starting lead reminder check...");

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    // Fetch all leads with upcoming or overdue follow-ups
    const { data: offers, error: offersError } = await supabase
      .from("offers")
      .select(`
        id,
        offer_number,
        next_action_date,
        lead_status,
        person_contact,
        follow_up_notes,
        clients!inner(name),
        created_by
      `)
      .eq("stage", "leads")
      .not("next_action_date", "is", null)
      .lte("next_action_date", threeDaysFromNow.toISOString())
      .not("lead_status", "in", '("closed_lost","closed_won")');

    if (offersError) {
      console.error("Error fetching offers:", offersError);
      throw offersError;
    }

    if (!offers || offers.length === 0) {
      console.log("No leads with upcoming follow-ups found");
      return new Response(
        JSON.stringify({ message: "No reminders to send" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    console.log(`Found ${offers.length} leads with follow-ups`);

    // Group leads by salesperson
    const salesPeopleMap = new Map<string, SalespersonLeads>();

    for (const offer of offers) {
      if (!offer.created_by) continue;

      const actionDate = new Date(offer.next_action_date);
      const isOverdue = actionDate < today;

      // Fetch salesperson details
      if (!salesPeopleMap.has(offer.created_by)) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("email, full_name")
          .eq("id", offer.created_by)
          .single();

        if (profile) {
          salesPeopleMap.set(offer.created_by, {
            email: profile.email,
            full_name: profile.full_name,
            overdue: [],
            dueSoon: [],
          });
        }
      }

      const salespersonData = salesPeopleMap.get(offer.created_by);
      if (salespersonData) {
        const lead: Lead = {
          id: offer.id,
          offer_number: offer.offer_number,
          next_action_date: offer.next_action_date,
          lead_status: offer.lead_status || '',
          client_name: (offer as any).clients?.name || "Unknown",
          person_contact: offer.person_contact || '',
          follow_up_notes: offer.follow_up_notes || '',
        };

        if (isOverdue) {
          salespersonData.overdue.push(lead);
        } else {
          salespersonData.dueSoon.push(lead);
        }
      }
    }

    // Send emails to each salesperson
    const emailPromises = Array.from(salesPeopleMap.values()).map(
      async (salesperson) => {
        const { overdue, dueSoon, email, full_name } = salesperson;

        if (overdue.length === 0 && dueSoon.length === 0) return;

        // Sanitize salesperson name
        const safeFullName = sanitizeHtml(full_name);

        const overdueHtml = overdue.length > 0
          ? `
            <h2 style="color: #dc2626; margin-top: 24px;">⚠️ Overdue Follow-ups (${overdue.length})</h2>
            <table style="width: 100%; border-collapse: collapse; margin-top: 12px;">
              <thead>
                <tr style="background-color: #f3f4f6;">
                  <th style="padding: 8px; text-align: left; border: 1px solid #e5e7eb;">Offer #</th>
                  <th style="padding: 8px; text-align: left; border: 1px solid #e5e7eb;">Client</th>
                  <th style="padding: 8px; text-align: left; border: 1px solid #e5e7eb;">Due Date</th>
                  <th style="padding: 8px; text-align: left; border: 1px solid #e5e7eb;">Status</th>
                </tr>
              </thead>
              <tbody>
                ${overdue.map(lead => `
                  <tr>
                    <td style="padding: 8px; border: 1px solid #e5e7eb;">${sanitizeHtml(lead.offer_number)}</td>
                    <td style="padding: 8px; border: 1px solid #e5e7eb;">${sanitizeHtml(lead.client_name)}</td>
                    <td style="padding: 8px; border: 1px solid #e5e7eb;">${new Date(lead.next_action_date).toLocaleDateString()}</td>
                    <td style="padding: 8px; border: 1px solid #e5e7eb;">${sanitizeHtml(lead.lead_status)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `
          : '';

        const dueSoonHtml = dueSoon.length > 0
          ? `
            <h2 style="color: #f59e0b; margin-top: 24px;">📅 Due Soon (${dueSoon.length})</h2>
            <table style="width: 100%; border-collapse: collapse; margin-top: 12px;">
              <thead>
                <tr style="background-color: #f3f4f6;">
                  <th style="padding: 8px; text-align: left; border: 1px solid #e5e7eb;">Offer #</th>
                  <th style="padding: 8px; text-align: left; border: 1px solid #e5e7eb;">Client</th>
                  <th style="padding: 8px; text-align: left; border: 1px solid #e5e7eb;">Due Date</th>
                  <th style="padding: 8px; text-align: left; border: 1px solid #e5e7eb;">Status</th>
                </tr>
              </thead>
              <tbody>
                ${dueSoon.map(lead => `
                  <tr>
                    <td style="padding: 8px; border: 1px solid #e5e7eb;">${sanitizeHtml(lead.offer_number)}</td>
                    <td style="padding: 8px; border: 1px solid #e5e7eb;">${sanitizeHtml(lead.client_name)}</td>
                    <td style="padding: 8px; border: 1px solid #e5e7eb;">${new Date(lead.next_action_date).toLocaleDateString()}</td>
                    <td style="padding: 8px; border: 1px solid #e5e7eb;">${sanitizeHtml(lead.lead_status)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `
          : '';

        const htmlBody = `
          <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
            <h1 style="color: #111827;">Lead Follow-up Reminders</h1>
            <p>Hi ${safeFullName},</p>
            <p>You have leads that require follow-up attention:</p>
            ${overdueHtml}
            ${dueSoonHtml}
            <p style="margin-top: 24px;">Please review and update these leads in your CRM.</p>
            <p style="color: #6b7280; font-size: 14px; margin-top: 32px;">This is an automated reminder from your Lead Management System.</p>
          </div>
        `;

        console.log(`Sending email to ${email}`);

        const { error: emailError } = await resend.emails.send({
          from: "Lead Reminders <onboarding@resend.dev>",
          to: [email],
          subject: `Lead Follow-up Reminders: ${overdue.length} Overdue, ${dueSoon.length} Due Soon`,
          html: htmlBody,
        });

        if (emailError) {
          console.error(`Failed to send email to ${email}:`, emailError);
          throw emailError;
        }

        console.log(`Email sent successfully to ${email}`);
      }
    );

    await Promise.all(emailPromises);

    return new Response(
      JSON.stringify({
        message: "Lead reminders sent successfully",
        emailsSent: salesPeopleMap.size,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-lead-reminders function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
