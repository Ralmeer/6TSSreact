import { supabase } from '../supabaseClient';

import config from '../config';

export const registerUserAndSendInvite = async (email, userrole, name, rank, crew) => {
  try {
    const response = await fetch(`${config.apiUrl}/api/scout-management/add-scout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, user_metadata: { userrole, name, rank, crew } }),
    });

    const data = await response.json();

    // Return the full response data and status for more granular handling in the component
    return { success: response.ok, message: data.message || data.error, status: response.status };
  } catch (error) {
    console.error('Error registering user and sending invite:', error.message);
    return { success: false, message: error.message, status: 500 }; // Default to 500 for network errors
  }
};