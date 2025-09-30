import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "http://localhost:5173",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Content-Length": "0",
      },
    });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables." }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "http://localhost:5173",
        "Access-Control-Allow-Headers": "*",
      },
      status: 400,
    });
  }

  const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  let rpcData: { activity_type: string }[] | null = null;
  let rpcError: any = null;

  try {
    const { data, error } = await supabaseClient.rpc('get_all_activity_types') as { data: { activity_type: string }[] | null, error: any };
    rpcData = data;
    rpcError = error;
  } catch (e) {
    console.error('RPC call exception:', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
      },
      status: 500,
    });
  }

  if (rpcError) {
    console.error('RPC error details:', rpcError.message);
    return new Response(JSON.stringify({ error: rpcError.message }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "http://localhost:5173",
        "Access-Control-Allow-Headers": "*",
      },
      status: 400,
    });
  }

  return new Response(
    JSON.stringify(rpcData),
    { headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "http://localhost:5173",
        "Access-Control-Allow-Headers": "*",
      }
    },
  );
});
