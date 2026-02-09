import { createClient } from '@supabase/supabase-js'

// ============================================================
// SUPABASE SETUP INSTRUCTIONS:
// 1. Create a free project at https://supabase.com
// 2. Go to Project Settings > API
// 3. Copy your Project URL and anon/public key
// 4. Create a .env file in the project root with:
//    VITE_SUPABASE_URL=https://your-project.supabase.co
//    VITE_SUPABASE_ANON_KEY=your-anon-key
//
// DATABASE TABLE CREATION SQL:
// Run this in the Supabase SQL Editor (SQL Editor > New Query):
//
// create table customers (
//   id uuid default gen_random_uuid() primary key,
//   name text not null,
//   age integer,
//   address text,
//   dob date,
//   insurance_type text not null,
//   amount numeric not null,
//   issued_on date not null,
//   deadline date not null,
//   created_at timestamp with time zone default now()
// );
//
// -- Enable Row Level Security (optional, recommended)
// alter table customers enable row level security;
//
// -- Allow all operations for anonymous users (for demo purposes)
// create policy "Allow all" on customers for all using (true) with check (true);
// ============================================================

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase credentials not found. Please create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  )
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
)
