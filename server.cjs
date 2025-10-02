process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1); // Exit with a failure code
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1); // Exit with a failure code
});

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = process.env.PORT || 3002;

// CORS configuration
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:5174'], // Allow requests from your frontend
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

// Initialize Supabase client
console.log('Attempting to initialize Supabase client...');
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY; // Use service role key for backend operations
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseKey ? 'Loaded' : 'Not Loaded');
const supabase = createClient(supabaseUrl, supabaseKey);
console.log('Supabase client initialized.');

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

app.post('/api/invite-user', async (req, res) => {
  console.log('Received request to /api/invite-user');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  const { email, password, user_metadata } = req.body;

  // Extract userrole, name, rank, and crew from user_metadata
  const { userrole, name, rank, crew } = user_metadata || {};
    const full_name = name || email; // Use email as fallback for full_name

  try {
    console.log('Attempting to create user via Supabase Auth...');
    console.log('Email for user creation:', email); // Add this line
    // Create the user in Supabase Auth
    const { data: userResponse, error: createUserError } = await supabase.auth.admin.createUser({
      email: email,
      password: generateRandomPassword(), // Use a generated password
      email_confirm: true, // Mark email as confirmed since we are sending a reset link
      user_metadata: user_metadata,
    });

    if (createUserError) {
      console.error('Error creating user:', createUserError);
      return res.status(500).json({ error: createUserError.message });
    }

    const userId = userResponse.user.id;

    // Call the RPC function to create a scout entry if it doesn't exist
    const { data: rpcData, error: rpcError } = await supabase.rpc('create_scout_if_not_exists', {
      p_user_id: userId,
      p_full_name: full_name,
      p_email: email,
      p_crew: crew,
      p_rank: rank
    });

    if (rpcError) {
      console.error('Error calling create_scout_if_not_exists RPC:', rpcError);
      // Even if RPC fails, we might still want to proceed with the user invitation if the user was created
      // Or, we might want to delete the user if the scout entry is critical.
      // For now, we'll just log the error and continue.
    }

    // Generate a password recovery link
    console.log('Attempting to generate password recovery link for email:', email); // Add this line
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://tobattendance.pages.dev/update-password',
      });

    if (error) {
      console.error('Error generating password reset link:', generateLinkError);
      return res.status(500).json({ error: generateLinkError.message });
    }
    console.log('Password recovery link generated successfully for email:', email); // Add this line

    // The password reset email will be sent automatically by Supabase
    // using the configured recovery email template.

    res.status(200).json({ message: 'User invited and password reset email sent.', user: userResponse.user });
  } catch (error) {
    console.error('Unexpected error during user creation and password reset email sending:', error);
    res.status(500).json({ error: 'Unexpected error during user creation and password reset email sending' });
  }
});

app.post('/api/sign-in', async (req, res) => {
  const { email, password } = req.body;
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return res.status(401).json({ error: error.message });
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/list-users', async (req, res) => {
  try {
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    if (error) {
      console.error('Error listing users:', error);
      return res.status(500).json({ error: error.message });
    }
    res.status(200).json(users);
  } catch (error) {
    console.error('Unexpected error listing users:', error);
    res.status(500).json({ error: 'Unexpected error listing users' });
  }
});

app.post('/api/confirm-user-email', async (req, res) => {
  const { userId } = req.body;
  try {
    const { data, error } = await supabase.auth.admin.updateUserById(
      userId,
      { email_confirm: true }
    );
    if (error) {
      console.error('Error confirming user email:', error);
      return res.status(500).json({ error: error.message });
    }
    res.status(200).json({ message: 'User email confirmed successfully', user: data });
  } catch (error) {
    console.error('Unexpected error confirming user email:', error);
    res.status(500).json({ error: 'Unexpected error confirming user email' });
  }
});

app.post('/api/delete-user', async (req, res) => {
  const { userId } = req.body;
  try {
    const { data, error } = await supabase.auth.admin.deleteUser(userId);
    if (error) {
      console.error('Error deleting user:', error);
      return res.status(500).json({ error: error.message });
    }
    res.status(200).json({ message: 'User deleted successfully', user: data });
  } catch (error) {
    console.error('Unexpected error deleting user:', error);
    res.status(500).json({ error: 'Unexpected error deleting user' });
  }
});

app.delete('/api/scout-management/delete-scout/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // First, get the user_id associated with the scout
    const { data: scoutData, error: fetchError } = await supabase
      .from('scouts')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching scout:', fetchError);
      return res.status(500).json({ error: fetchError.message });
    }

    if (!scoutData) {
      return res.status(404).json({ error: 'Scout not found' });
    }

    const userId = scoutData.user_id;

    // Delete associated records from public.scout_history
    const { error: deleteHistoryError } = await supabase
      .from('scout_history')
      .delete()
      .eq('scout_id', id);

    if (deleteHistoryError) {
      console.error('Error deleting scout history:', deleteHistoryError);
      return res.status(500).json({ error: deleteHistoryError.message });
    }

    // Delete the scout from the public.scouts table
    const { error: deleteScoutError } = await supabase
      .from('scouts')
      .delete()
      .eq('id', id);

    if (deleteScoutError) {
      console.error('Error deleting scout:', deleteScoutError);
      return res.status(500).json({ error: deleteScoutError.message });
    }

    // Delete the associated user from Supabase authentication
    const { error: deleteUserError } = await supabase.auth.admin.deleteUser(userId);

    if (deleteUserError) {
      console.error('Error deleting user from auth:', deleteUserError);
      return res.status(500).json({ error: deleteUserError.message });
    }

    res.status(200).json({ message: 'Scout and associated user deleted successfully' });
  } catch (error) {
    console.error('Unexpected error during scout deletion:', error);
    res.status(500).json({ error: 'Unexpected error during scout deletion' });
  }
});

// app.post('/api/reset-password', async (req, res) => {
//   const { userId, newPassword } = req.body;
//   try {
//     const { data, error } = await supabase.auth.admin.updateUserById(
//       userId,
//       { password: newPassword }
//     );
//     if (error) {
//       console.error('Error resetting password:', error);
//       return res.status(500).json({ error: error.message });
//     }
//     res.status(200).json({ message: 'Password reset successfully', user: data });
//   } catch (error) {
//     console.error('Unexpected error resetting password:', error);
//     res.status(500).json({ error: 'Unexpected error resetting password' });
//   }
// });

app.get('/api/test-rls', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No access token provided' });
  }

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError) {
      console.error('Error getting user from token:', userError);
      return res.status(401).json({ error: userError.message });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid access token' });
    }

    // Set the user's JWT for RLS to apply
    supabase.auth.setSession({ access_token: token, refresh_token: '' });

    const { data, error } = await supabase.from('scouts').select('*');

    if (error) {
      console.error('Error fetching data with RLS:', error);
      return res.status(500).json({ error: error.message });
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('Unexpected error testing RLS:', error);
    res.status(500).json({ error: 'Unexpected error testing RLS' });
  }
});

try {
  console.log('Attempting to start server...');
  app.listen(port, () => {
    console.log(`Backend server listening on port ${port}`);
  });
  console.log('Server listen call completed.');
} catch (error) {
  console.error('Error starting server:', error);
}


function generateRandomPassword() {
  const length = 12;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
  let retVal = "";
  for (let i = 0, n = charset.length; i < length; ++i) {
    retVal += charset.charAt(Math.floor(Math.random() * n));
  }
  return retVal;
}