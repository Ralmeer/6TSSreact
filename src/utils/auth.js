import { supabase } from '../supabaseClient';

import config from '../config';

export const registerUserAndSendInvite = async (email, userrole, name, rank, crew) => {
  try {
    const apiUrl = `${config.apiUrl}/api/scout-management/add-scout`;
    console.log('Attempting to call API:', apiUrl);
    console.log('Request body:', JSON.stringify({ email, user_metadata: { userrole, name, rank, crew } }));
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, user_metadata: { userrole, name, rank, crew } }),
    });

    const data = await response.json();
    console.log('API response:', data);
    console.log('API response status:', response.status);

    // Return the full response data and status for more granular handling in the component
    return { success: response.ok, message: data.message || data.error, status: response.status };
  } catch (error) {
    console.error('Error registering user and sending invite:', error.message);
    return { success: false, message: error.message, status: 500 }; // Default to 500 for network errors
  }
};