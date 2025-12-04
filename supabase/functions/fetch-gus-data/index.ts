import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { nip } = await req.json();

    if (!nip) {
      return new Response(
        JSON.stringify({ error: 'NIP is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean NIP - remove dashes and spaces
    const cleanNip = nip.replace(/[-\s]/g, '');
    
    console.log('Fetching GUS data for NIP:', cleanNip);

    // SOAP request to GUS API
    const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <GetCompanyDataByNip xmlns="http://lsi.net.pl/">
      <Nip>${cleanNip}</Nip>
    </GetCompanyDataByNip>
  </soap:Body>
</soap:Envelope>`;

    const response = await fetch('https://gus.services.lsisoftware.net/GUS.asmx', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'http://lsi.net.pl/GetCompanyDataByNip',
      },
      body: soapEnvelope,
    });

    if (!response.ok) {
      console.error('GUS API error:', response.status, response.statusText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch data from GUS' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const xmlText = await response.text();
    console.log('GUS Response:', xmlText);

    // Parse the XML response
    const companyData = parseGusResponse(xmlText);
    
    if (!companyData) {
      return new Response(
        JSON.stringify({ error: 'Company not found or invalid NIP' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Parsed company data:', companyData);

    return new Response(
      JSON.stringify(companyData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in fetch-gus-data function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function parseGusResponse(xmlText: string): any {
  try {
    // Extract the result from SOAP response
    const resultMatch = xmlText.match(/<GetCompanyDataByNipResult>([\s\S]*?)<\/GetCompanyDataByNipResult>/);
    
    if (!resultMatch) {
      // Try alternative tag names
      const altMatch = xmlText.match(/<GetCompanyDataByNipResponse[\s\S]*?>([\s\S]*?)<\/GetCompanyDataByNipResponse>/);
      if (!altMatch) {
        console.log('No result found in XML');
        return null;
      }
    }

    // Extract individual fields using regex
    const extractField = (fieldName: string): string | null => {
      const regex = new RegExp(`<${fieldName}>([^<]*)<\/${fieldName}>`, 'i');
      const match = xmlText.match(regex);
      return match ? match[1].trim() : null;
    };

    // Try common field names from GUS responses
    const name = extractField('Nazwa') || 
                 extractField('Name') || 
                 extractField('CompanyName') ||
                 extractField('nazwa');
    
    const street = extractField('Ulica') || 
                   extractField('Street') ||
                   extractField('ulica');
    
    const buildingNumber = extractField('NrNieruchomosci') || 
                           extractField('BuildingNumber') ||
                           extractField('nrNieruchomosci') ||
                           extractField('NrBudynku');
    
    const apartmentNumber = extractField('NrLokalu') || 
                            extractField('ApartmentNumber') ||
                            extractField('nrLokalu');
    
    const postalCode = extractField('KodPocztowy') || 
                       extractField('PostalCode') ||
                       extractField('kodPocztowy');
    
    const city = extractField('Miejscowosc') || 
                 extractField('City') ||
                 extractField('miejscowosc');
    
    const voivodeship = extractField('Wojewodztwo') || 
                        extractField('Region') ||
                        extractField('wojewodztwo');

    // Build address from components
    let address = '';
    if (street) {
      address = street;
      if (buildingNumber) {
        address += ' ' + buildingNumber;
        if (apartmentNumber) {
          address += '/' + apartmentNumber;
        }
      }
    }

    // If no structured data found, check if the response contains error
    if (!name && !city && !postalCode) {
      // Check for error messages
      const errorMatch = xmlText.match(/<ErrorMessage>([^<]*)<\/ErrorMessage>/i) ||
                        xmlText.match(/<Error>([^<]*)<\/Error>/i) ||
                        xmlText.match(/<Blad>([^<]*)<\/Blad>/i);
      
      if (errorMatch) {
        console.log('GUS Error:', errorMatch[1]);
        return null;
      }
      
      // Try to parse as CDATA or nested structure
      const cdataMatch = xmlText.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
      if (cdataMatch) {
        return parseGusResponse(cdataMatch[1]);
      }
      
      return null;
    }

    return {
      name: name || '',
      address: address || '',
      postal_code: postalCode || '',
      city: city || '',
      voivodeship: voivodeship || '',
    };
  } catch (error) {
    console.error('Error parsing GUS response:', error);
    return null;
  }
}
