import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientName, notes, tasks, offers, contracts, robots, tickets } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context from client data
    const notesContext = notes?.length
      ? notes.map((n: any) => 
          `- ${n.note_date}: ${n.contact_type} with ${n.contact_person || 'unknown'}. Key points: ${n.key_points || 'N/A'}. Needs: ${n.needs || 'N/A'}. Risks: ${n.risks || 'N/A'}. Next step: ${n.next_step || 'N/A'}. Priority: ${n.priority}`
        ).join("\n")
      : "No notes available.";

    const tasksContext = tasks?.length
      ? tasks.map((t: any) => 
          `- ${t.title} (${t.status}): ${t.description || 'No description'}. Due: ${t.due_date || 'No date'}. Meeting: ${t.meeting_type || 'N/A'}`
        ).join("\n")
      : "No tasks available.";

    const offersContext = offers?.length
      ? offers.map((o: any) => 
          `- ${o.offer_number}: Stage ${o.stage}, Value: ${o.total_price || 'N/A'}, Created: ${o.created_at}`
        ).join("\n")
      : "No offers available.";

    const contractsContext = contracts?.length
      ? contracts.map((c: any) => 
          `- ${c.contract_number}: ${c.status}, Monthly: ${c.monthly_payment || 'N/A'}, Start: ${c.start_date || 'N/A'}`
        ).join("\n")
      : "No contracts available.";

    const robotsContext = robots?.length
      ? robots.map((r: any) => 
          `- ${r.serial_number} (${r.model}): ${r.status}`
        ).join("\n")
      : "No robots deployed.";

    const ticketsContext = tickets?.length
      ? tickets.map((t: any) => 
          `- ${t.ticket_number}: ${t.title} (${t.status}, ${t.priority} priority)`
        ).join("\n")
      : "No service tickets.";

    const systemPrompt = `You are an expert sales analyst providing concise, actionable insights about clients. Analyze the provided client data and create a structured summary. Be specific, identify patterns, and highlight actionable recommendations.

Format your response in clear sections:
1. **Client Overview** - Brief summary of relationship status and engagement level
2. **Key Insights** - Important patterns or observations from notes and interactions
3. **Opportunities** - Potential upsell/cross-sell opportunities based on data
4. **Risks & Concerns** - Any red flags or issues requiring attention
5. **Recommended Actions** - Top 3 specific, actionable next steps

Keep the summary focused and practical for a sales team. Use bullet points for readability.`;

    const userMessage = `Analyze the following data for client "${clientName}":

## Recent Notes/Interactions:
${notesContext}

## Tasks:
${tasksContext}

## Offers/Opportunities:
${offersContext}

## Contracts:
${contractsContext}

## Deployed Robots:
${robotsContext}

## Service Tickets:
${ticketsContext}

Provide a comprehensive analysis and recommendations.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI service temporarily unavailable");
    }

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content || "Unable to generate summary.";

    return new Response(
      JSON.stringify({ summary }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in client-ai-summary:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
