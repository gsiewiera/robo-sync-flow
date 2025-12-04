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
    const { salespersonName, salespersonEmail, dateRange, kpiData, tasks, leads, offers, contracts, clients } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const dateRangeStr = dateRange 
      ? `from ${new Date(dateRange.from).toLocaleDateString()} to ${new Date(dateRange.to).toLocaleDateString()}`
      : "all time";

    // Build KPI summary
    const kpiSummary = `
- Total Sales: ${kpiData.totalSales?.toLocaleString() || 0} PLN
- Tasks: ${kpiData.completedTasks}/${kpiData.totalTasks} completed
- Leads: ${kpiData.totalLeads}
- Offers: ${kpiData.totalOffers}
- Signed Contracts: ${kpiData.signedContracts}
- Total Revenue: ${kpiData.totalRevenue?.toLocaleString() || 0} PLN
- Assigned Clients: ${kpiData.assignedClients}`;

    // Build context from data
    const tasksContext = tasks?.length
      ? tasks.map((t: any) => 
          `- ${t.title} (${t.status}) - Client: ${t.clients?.name || 'N/A'}, Due: ${t.due_date || 'No date'}`
        ).join("\n")
      : "No tasks in period.";

    const leadsContext = leads?.length
      ? leads.map((l: any) => 
          `- ${l.offer_number}: Status ${l.lead_status || 'new'}, Client: ${l.clients?.name || 'N/A'}, Created: ${new Date(l.created_at).toLocaleDateString()}`
        ).join("\n")
      : "No leads in period.";

    const offersContext = offers?.length
      ? offers.map((o: any) => 
          `- ${o.offer_number}: Stage ${o.stage}, Value: ${o.total_price?.toLocaleString() || 'N/A'} PLN, Client: ${o.clients?.name || 'N/A'}`
        ).join("\n")
      : "No offers in period.";

    const contractsContext = contracts?.length
      ? contracts.map((c: any) => 
          `- ${c.contract_number}: ${c.status}, Value: ${c.total_purchase_value?.toLocaleString() || 'N/A'} PLN, Client: ${c.clients?.name || 'N/A'}`
        ).join("\n")
      : "No contracts in period.";

    const clientsContext = clients?.length
      ? clients.map((c: any) => 
          `- ${c.name} (${c.city || 'Unknown location'}) - Status: ${c.status || 'active'}`
        ).join("\n")
      : "No assigned clients.";

    const systemPrompt = `You are an expert sales performance analyst providing actionable insights about salesperson performance. Analyze the data and create a comprehensive performance review. Be specific, identify patterns, and provide constructive feedback.

Format your response in clear sections:
1. **Performance Overview** - Brief summary of overall performance during the period
2. **Strengths** - What the salesperson is doing well based on the data
3. **Areas for Improvement** - Specific areas that need attention
4. **Pipeline Analysis** - Assessment of leads, offers, and conversion potential
5. **Task Management** - Analysis of task completion and time management
6. **Recommended Focus Areas** - Top 3 specific, actionable priorities

Be constructive, data-driven, and focus on actionable insights. Use bullet points for readability.`;

    const userMessage = `Analyze the performance of salesperson "${salespersonName}" (${salespersonEmail}) for the period: ${dateRangeStr}

## Key Performance Indicators:
${kpiSummary}

## Tasks:
${tasksContext}

## Leads:
${leadsContext}

## Offers:
${offersContext}

## Contracts:
${contractsContext}

## Assigned Clients:
${clientsContext}

Provide a comprehensive performance analysis with actionable recommendations.`;

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
    console.error("Error in salesperson-ai-summary:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
