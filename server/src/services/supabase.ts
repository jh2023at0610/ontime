import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '../utils/env';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface TaskData {
  text: string;
  source: string;
  telegram_message_id?: string;
}

export async function saveTaskToSupabase(taskData: TaskData) {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      text: taskData.text,
      completed: false,
      source: taskData.source,
      telegram_message_id: taskData.telegram_message_id,
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Error saving to Supabase:', error);
    throw error;
  }

  console.log('✅ Task saved to Supabase:', data.id);
  return data;
}


