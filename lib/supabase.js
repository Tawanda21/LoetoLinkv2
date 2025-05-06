import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yjwtmthxighwnzwdprck.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlqd3RtdGh4aWdod256d2RwcmNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1MTYyNjcsImV4cCI6MjA2MjA5MjI2N30.Qw6tYUghA5lC1aGuCSfWsKvvwm8n_lqQ8FSh6nH6IJU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});