import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://favxvyccaxcaqkjpsmgp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhdnh2eWNjYXhjYXFranBzbWdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1ODQxMjksImV4cCI6MjA1OTE2MDEyOX0._WPKpbQpFi1WgySzGpM5B1d1Emh21UiCrN7QOuzZuV0';

export const supabase = createClient(supabaseUrl, supabaseKey);