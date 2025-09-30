import "jsr:@supabase/functions-js/edge-runtime.d.ts"

console.log("Hello from Functions!")

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  const requestBody = await req.json();
  const start_date = requestBody.start_date;
  const end_date = requestBody.end_date;

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
  console.log('Request body:', { SUPABASE_URL, SUPABASE_ANON_KEY, start_date, end_date });

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return new Response(JSON.stringify({ error: "Missing SUPABASE_URL or SUPABASE_ANON_KEY in request body." }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
      },
      status: 400,
    });
  }

  const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  let rpcParams: { start_date?: string, end_date?: string | null } = {};
  if (start_date) {
    rpcParams.start_date = start_date;
  }
  if (end_date) {
    rpcParams.end_date = end_date;
  } else if (start_date) {
    // If start_date is provided but end_date is not, explicitly set end_date to null
    rpcParams.end_date = null;
  }

  console.log('Calling RPC with:', rpcParams);
  const { data, error } = await supabaseClient.rpc(
    "get_distinct_activity_types",
    rpcParams
  );

  if (error) {
    console.error('RPC error:', error.message);
    return new Response(JSON.stringify({ error: error.message, start_date, end_date }), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
      },
      status: 400,
    });
  }

  console.log('RPC data:', data);
  return new Response(
    JSON.stringify({ data, start_date, end_date }),
    { headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
      }
    },
  );
});

// Helper function to create Supabase client (assuming it's defined elsewhere or needs to be added)
// function createClient(supabaseUrl: string, supabaseKey: string) {
//   // This is a placeholder. In a real scenario, you'd import and use the Supabase client library.
//   // For example: import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
//   // return createClient(supabaseUrl, supabaseKey);

//   // For the purpose of this Edge Function, we'll mock a basic client with an rpc method.
//   return {
//     rpc: async (functionName: string, params: any) => {
//       // In a real scenario, this would make an actual RPC call to your Supabase database.
//       // For now, we'll just log the call and return a mock response or re-throw the error from the actual RPC call.
//       console.log(`RPC call: ${functionName} with params:`, params);
//       // This is where the actual RPC call would happen. Since we're in an Edge Function,
//       // the `supabaseClient.rpc` call is what interacts with the Postgres function.
//       // The error you're seeing is likely coming from the actual database call.
//       // We'll simulate the error based on the previous log.
//       
//       // This part needs to be replaced with the actual Supabase client initialization and RPC call.
//       // For now, we'll assume the error is still happening at the database level.
//       return { data: [], error: { message: 'Simulated RPC error: column a.activity_date does not exist', code: '42703' } };
//     },
//   };
// }
