import { createClient } from '@supabase/supabase-js';

// Read values from env, default to the user provided endpoint to make client-side testing work seamlessly
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || 'https://idnfaxqagkafoxrvhzqb.supabase.co';

// Provide a valid format placeholder key to prevent "supabaseKey is required" crash if env is empty
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkbmZheHFhZ2thZm94cnZoenFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzOTkzNjMsImV4cCI6MjA5NDk3NTM2M30.0vznryjw01d4qHia10Dlo5Bk2lK2z-7xSDq8gRfU9GY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
