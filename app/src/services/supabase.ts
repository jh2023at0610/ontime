import { createClient } from '@supabase/supabase-js';

// This will be loaded from .env automatically by Expo
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

console.log('🔧 Supabase URL:', supabaseUrl ? 'Set ✓' : 'Missing ✗');
console.log('🔧 Supabase Key:', supabaseAnonKey ? 'Set ✓' : 'Missing ✗');

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Task type matching our database schema
export interface Task {
  id: string;
  text: string;
  completed: boolean;
  archived?: boolean;
  source: string; // 'telegram' or 'app'
  created_at: string;
  telegram_message_id?: string;
}

// Fetch all tasks from Supabase
export async function fetchTasks(): Promise<Task[]> {
  try {
    console.log('🔍 Fetching tasks from Supabase...');
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('archived', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching tasks:', error);
      return [];
    }

    console.log('✅ Fetched tasks:', data?.length || 0, 'tasks');
    return data || [];
  } catch (error) {
    console.error('❌ Error in fetchTasks:', error);
    return [];
  }
}

// Create a new task
export async function createTask(text: string): Promise<Task | null> {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .insert({ text, completed: false, source: 'app' })
      .select()
      .single();

    if (error) {
      console.error('Error creating task:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in createTask:', error);
    return null;
  }
}

// Update a task (e.g., toggle completed status)
export async function updateTask(taskId: string, updates: Partial<Task>): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId);

    if (error) {
      console.error('Error updating task:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateTask:', error);
    return false;
  }
}

// Fetch archived tasks only
export async function fetchArchivedTasks(): Promise<Task[]> {
  try {
    console.log('🗄️  Fetching archived tasks...');
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('archived', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching archived tasks:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('❌ Error in fetchArchivedTasks:', error);
    return [];
  }
}

// Move all completed (and not yet archived) tasks into archive
export async function archiveCompletedTasks(): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .update({ archived: true })
      .eq('completed', true)
      .eq('archived', false)
      .select('id');

    if (error) {
      console.error('❌ Error archiving tasks:', error);
      return 0;
    }
    return data?.length || 0;
  } catch (error) {
    console.error('❌ Error in archiveCompletedTasks:', error);
    return 0;
  }
}

// Delete a task
export async function deleteTask(taskId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      console.error('Error deleting task:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteTask:', error);
    return false;
  }
}

// Subscribe to real-time changes
export function subscribeToTasks(callback: (task: Task) => void) {
  const subscription = supabase
    .channel('tasks')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'tasks' },
      (payload) => {
        if (payload.new) {
          callback(payload.new as Task);
        }
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}

