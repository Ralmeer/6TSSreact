import { createClient } from '@supabase/supabase-js';
import { Router } from 'itty-router';

// Define the Env interface to include Supabase environment variables
interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  FRONTEND_URL: string;
}

// Create a new router
const router = Router();

// Middleware to initialize Supabase client and handle CORS
router.all('*', (request: Request, env: Env) => {
  // Initialize Supabase client
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  request.supabase = supabase;
  request.env = env;

  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': env.FRONTEND_URL,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  }
})
.finally((request: Request, response: Response) => {
  // Add CORS headers to all responses
  response.headers.set('Access-Control-Allow-Origin', request.env.FRONTEND_URL);
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
});

function generateRandomPassword(): string {
  const length = 12;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
  let retVal = "";
  for (let i = 0, n = charset.length; i < length; ++i) {
    retVal += charset.charAt(Math.floor(Math.random() * n));
  }
  return retVal;
}

router.post('/api/invite-user', async (request: Request) => {
  try {
    const { supabase, env } = request;
    const body = await request.json();
    const { email, password, user_metadata } = body;

    const { userrole, name, rank, crew } = user_metadata || {};
    const full_name = name || email;

    const { data: userResponse, error: createUserError } = await supabase.auth.admin.createUser({
      email: email,
      password: generateRandomPassword(),
      email_confirm: true,
      user_metadata: user_metadata,
    });

    if (createUserError) {
      console.error('Error creating user:', createUserError);
      return new Response(JSON.stringify({ error: createUserError.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const userId = userResponse.user.id;

    // Call the create_scout_if_not_exists function
    const { data: createScoutData, error: createScoutError } = await supabase
      .rpc('create_scout_if_not_exists', {
        p_user_id: userId,
        p_full_name: full_name,
        p_email: email,
        p_rank: rank,
        p_crew: crew,
      });

    if (createScoutError) {
      console.error('Error calling create_scout_if_not_exists:', createScoutError);
      if (createScoutError.message.includes('A scout with this email already exists')) {
        return new Response(JSON.stringify({ error: 'A scout with this email already exists' }), { status: 409 });
      }
      return new Response(JSON.stringify({ error: 'Failed to add scout' }), { status: 500 });
    }

    const { data, error: generateLinkError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${env.FRONTEND_URL}/update-password`,
      });

    if (generateLinkError) {
      console.error('Error generating password reset link:', generateLinkError);
      return new Response(JSON.stringify({ error: generateLinkError.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ message: 'User invited and password reset email sent.', user: userResponse.user }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('Unexpected error during user creation and password reset email sending:', error);
    return new Response(JSON.stringify({ error: error.message || 'Unexpected error during user creation and password reset email sending' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});

router.get('/api/scouts', async (request: Request) => {
  try {
    const { supabase } = request;
    const { data: scouts, error } = await supabase
      .from('scouts')
      .select('*, user_id(*)');

    if (error) {
      console.error('Error fetching scouts:', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify(scouts), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('Unexpected error fetching scouts:', error);
    return new Response(JSON.stringify({ error: error.message || 'Unexpected error fetching scouts' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});

router.get('/api/scouts/:id', async (request: Request) => {
  try {
    const { supabase } = request;
    const { id } = request.params;

    const { data: scout, error } = await supabase
      .from('scouts')
      .select('*, user_id(*)')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching scout:', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    if (!scout) {
      return new Response(JSON.stringify({ error: 'Scout not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify(scout), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('Unexpected error fetching scout:', error);
    return new Response(JSON.stringify({ error: error.message || 'Unexpected error fetching scout' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});

router.put('/api/scouts/:id', async (request: Request) => {
  try {
    const { supabase } = request;
    const { id } = request.params;
    const updateData = await request.json();

    const { data, error } = await supabase
      .from('scouts')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating scout:', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    if (!data || data.length === 0) {
      return new Response(JSON.stringify({ error: 'Scout not found or no changes made' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify(data[0]), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('Unexpected error updating scout:', error);
    return new Response(JSON.stringify({ error: error.message || 'Unexpected error updating scout' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});

router.delete('/api/scouts/:id', async (request: Request) => {
  try {
    const { supabase } = request;
    const { id } = request.params;

    const { error } = await supabase
      .from('scouts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting scout:', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ message: 'Scout deleted successfully' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('Unexpected error deleting scout:', error);
    return new Response(JSON.stringify({ error: error.message || 'Unexpected error deleting scout' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});

router.get('/api/users', async (request: Request) => {
  try {
    const { supabase } = request;
    const { data: users, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error('Error fetching users:', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify(users), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('Unexpected error fetching users:', error);
    return new Response(JSON.stringify({ error: error.message || 'Unexpected error fetching users' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});

router.get('/api/users/:id', async (request: Request) => {
  try {
    const { supabase } = request;
    const { id } = request.params;

    const { data: user, error } = await supabase.auth.admin.getUserById(id);

    if (error) {
      console.error('Error fetching user:', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify(user), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('Unexpected error fetching user:', error);
    return new Response(JSON.stringify({ error: error.message || 'Unexpected error fetching user' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});

router.put('/api/users/:id', async (request: Request) => {
  try {
    const { supabase } = request;
    const { id } = request.params;
    const updateData = await request.json();

    const { data: user, error } = await supabase.auth.admin.updateUserById(id, updateData);

    if (error) {
      console.error('Error updating user:', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify(user), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('Unexpected error updating user:', error);
    return new Response(JSON.stringify({ error: error.message || 'Unexpected error updating user' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});

router.delete('/api/users/:id', async (request: Request) => {
  try {
    const { supabase } = request;
    const { id } = request.params;

    const { error } = await supabase.auth.admin.deleteUser(id);

    if (error) {
      console.error('Error deleting user:', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ message: 'User deleted successfully' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('Unexpected error deleting user:', error);
    return new Response(JSON.stringify({ error: error.message || 'Unexpected error deleting user' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});

// Catch-all for any other requests
router.all('*', () => new Response('Not Found', { status: 404 }));

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return router.handle(request, env, ctx);
  },
};

declare global {
  interface Request {
    supabase: ReturnType<typeof createClient>;
    env: Env;
  }
}