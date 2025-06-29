import { createClient } from "@supabase/supabase-js";
import config from "../config";

// Create Supabase client
export const supabase = createClient(
  config.SUPABASE_URL,
  config.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    db: {
      schema: "public",
    },
    global: {
      headers: {
        "X-Client-Info": "elith-pharmacy-v1.0.0",
      },
    },
  }
);

// Auth helpers
export const auth = {
  // Sign up with email and password
  signUp: async (email, password, metadata = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });
    return { data, error };
  },

  // Sign in with email and password
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  // Sign out
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Get current user
  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  // Listen to auth changes
  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange(callback);
  },

  // Reset password
  resetPassword: async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { data, error };
  },

  // Update user profile
  updateProfile: async (updates) => {
    const { data, error } = await supabase.auth.updateUser({
      data: updates,
    });
    return { data, error };
  },
};

// Real-time subscriptions
export const subscriptions = {
  // Subscribe to table changes
  subscribe: (table, callback, filter = null) => {
    let subscription = supabase
      .channel(`${table}_changes`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: table,
          ...(filter && { filter }),
        },
        callback
      )
      .subscribe();

    return subscription;
  },

  // Unsubscribe from changes
  unsubscribe: (subscription) => {
    supabase.removeChannel(subscription);
  },
};

// Storage helpers
export const storage = {
  // Upload file
  upload: async (bucket, path, file, options = {}) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, options);
    return { data, error };
  },

  // Download file
  download: async (bucket, path) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path);
    return { data, error };
  },

  // Get public URL
  getPublicUrl: (bucket, path) => {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    return data.publicUrl;
  },

  // Delete file
  remove: async (bucket, paths) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .remove(paths);
    return { data, error };
  },
};

// Error handling helper
export const handleSupabaseError = (error) => {
  console.error("Supabase Error:", error);
  
  // Common error messages
  const errorMessages = {
    "Invalid login credentials": "Invalid email or password",
    "User not found": "No account found with this email",
    "Email not confirmed": "Please check your email and confirm your account",
    "Password should be at least 6 characters": "Password must be at least 6 characters",
    "User already registered": "An account with this email already exists",
  };

  return errorMessages[error.message] || error.message || "An unexpected error occurred";
};

export default supabase;
