import React, { useContext, useState, useEffect, createContext } from 'react';
import { supabase } from './supabaseClient';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext({
  user: null,
  userrole: null,
  loading: true,
  supabase: null,
  signOut: () => {},
  signIn: () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userrole, setUserRole] = useState(null);

  const fetchUserRole = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('userroles')
        .select('userrole')
        .eq('user_id', userId)
        .single();
      if (error) {
        console.error('Error fetching role:', error.message);
        return null;
      }
      return data?.userrole || null;
    } catch (err) {
      console.error('Error in fetchUserRole:', err);
      return null;
    }
  };

  useEffect(() => {
    const handleSession = async (session) => {
      console.log("handleSession called with session:", session);
      if (session?.user) {
        setUser(session.user);
        const role = await fetchUserRole(session.user.id);
        setUserRole(role);
      } else {
        setUser(null);
        setUserRole(null);
      }
      console.log("handleSession complete, setting loading = false", { session });
      // setLoading(false); // Moved outside to be called once after initial session processing
    };

    const processAuth = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const tokenHash = urlParams.get('token_hash');
      const type = urlParams.get('type');
      console.log("URL parameters in processAuth - token_hash:", tokenHash, "type:", type);

      if (tokenHash && type === 'invite') {
        console.log('Processing invitation token...');
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: 'invite',
        });
        if (error) {
          console.error('Error verifying invitation token:', error.message);
          setLoading(false);
          return;
        }
        console.log('Invitation token verified successfully.');
        // After successful verification, Supabase should automatically set the session
        // We can then proceed to get the session and user details
      }

      // Handle the current session on mount
      console.log("Attempting to get current session on mount.");
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error getting session on mount:", error.message);
      }
      console.log("getSession on mount result - session:", session);
      await handleSession(session);
      setLoading(false); // Set loading to false after initial session is processed

      // Listen for auth state changes
      console.log("Setting up onAuthStateChange listener.");
      const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
        console.log("onAuthStateChange event:", event, "session:", session);
        handleSession(session);
      });

      return () => {
        console.log("Cleaning up onAuthStateChange subscription.");
        subscription?.subscription.unsubscribe(); // correct cleanup
      };
    };

    processAuth();
  }, []);

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error('Supabase signin error:', error.message);
        return { user: null, session: null, error };
      }
      if (data?.user) {
        setUser(data.user);
        const role = await fetchUserRole(data.user.id);
        setUserRole(role);
      }
      return { user: data.user, session: data.session, error: null };
    } catch (error) {
      console.error('Error during sign in:', error.message);
      return { user: null, session: null, error };
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    setUser(null);
    setUserRole(null);
    if (error) console.error('Error signing out:', error.message);
  };

  return (
    <AuthContext.Provider value={{ user, userrole, loading, supabase, signOut, signIn }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);