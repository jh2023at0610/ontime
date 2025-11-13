import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tantml:react-query';
import { fetchTasks, updateTask, deleteTask, Task, fetchArchivedTasks, archiveCompletedTasks, createTask } from '../services/supabase';
import { Audio } from 'expo-av';

const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL || 'http://localhost:3000';

export default function TasksScreen() {
  const queryClient = useQueryClient();
  const [showArchive, setShowArchive] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  // Fetch tasks from Supabase
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
  });

  // Fetch archived tasks lazily when archive is shown
  const { data: archivedTasks = [], isLoading: isLoadingArchived } = useQuery({
    queryKey: ['tasks', 'archived'],
    queryFn: fetchArchivedTasks,
    enabled: showArchive,
  });

  // Toggle task completion
  const toggleTask = useMutation({
    mutationFn: ({ taskId, completed }: { taskId: string; completed: boolean }) =>
      updateTask(taskId, { completed }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // Delete task
  const removeTask = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', 'archived'] });
    },
  });

  // Archive all completed tasks
  const archiveCompleted = useMutation({
    mutationFn: archiveCompletedTasks,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', 'archived'] });
    },
  });

  // Add new task
  const addTask = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setNewTaskText(''); // Clear input after adding
    },
  });

  const handleAddTask = () => {
    const trimmedText = newTaskText.trim();
    if (trimmedText) {
      addTask.mutate(trimmedText);
    }
  };

  // Start recording audio
  async function startRecording() {
    try {
      console.log('🎤 Requesting permissions..');
      const permission = await Audio.requestPermissionsAsync();
      
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Please grant microphone permission to record voice notes');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log('🎤 Starting recording..');
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(newRecording);
      setIsRecording(true);
      console.log('🎤 Recording started');
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording');
    }
  }

  // Stop recording and transcribe
  async function stopRecording() {
    if (!recording) return;

    try {
      console.log('🛑 Stopping recording..');
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
      
      const uri = recording.getURI();
      setRecording(null);
      
      if (!uri) {
        Alert.alert('Error', 'No audio recorded');
        return;
      }

      console.log('📁 Recording saved to', uri);
      
      // Upload and transcribe
      setIsTranscribing(true);
      await uploadAndTranscribe(uri);
      
    } catch (err) {
      console.error('Failed to stop recording', err);
      Alert.alert('Error', 'Failed to process recording');
      setIsTranscribing(false);
    }
  }

  // Upload audio to server and get transcription
  async function uploadAndTranscribe(audioUri: string) {
    try {
      console.log('📤 Uploading audio to server...');
      
      // Create form data
      const formData = new FormData();
      
      // For Expo, we need to append the file properly
      // Just pass the URI directly - React Native handles it
      formData.append('audio', {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      } as any);

      const response = await fetch(`${SERVER_URL}/app/transcribe`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Transcription failed');
      }

      const data = await response.json();
      console.log('✅ Transcription received:', data.transcription);
      
      // Set the transcribed text in the input field
      setNewTaskText(data.transcription);
      setIsTranscribing(false);
      
      Alert.alert('Success', 'Voice note transcribed! You can edit before adding.');
      
    } catch (err: any) {
      console.error('Failed to upload/transcribe', err);
      Alert.alert('Error', `Transcription failed: ${err.message}`);
      setIsTranscribing(false);
    }
  }

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading tasks...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Text style={styles.title}>My Tasks</Text>
      
      {/* Add Task Input */}
      <View style={styles.addTaskContainer}>
        <TextInput
          style={styles.input}
          placeholder="Add a new task..."
          value={newTaskText}
          onChangeText={setNewTaskText}
          onSubmitEditing={handleAddTask}
          returnKeyType="done"
          editable={!isTranscribing}
        />
        <TouchableOpacity 
          style={[styles.micButton, isRecording && styles.micButtonRecording]}
          onPress={isRecording ? stopRecording : startRecording}
          disabled={isTranscribing}
        >
          <Text style={styles.micButtonText}>
            {isTranscribing ? '⏳' : isRecording ? '⏹' : '🎤'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.addButton, !newTaskText.trim() && styles.addButtonDisabled]}
          onPress={handleAddTask}
          disabled={!newTaskText.trim() || addTask.isPending || isTranscribing}
        >
          <Text style={styles.addButtonText}>
            {addTask.isPending ? '...' : '➕'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {isTranscribing && (
        <View style={styles.transcribingContainer}>
          <ActivityIndicator size="small" color="#6366f1" />
          <Text style={styles.transcribingText}>Transcribing your voice...</Text>
        </View>
      )}
      
      <ScrollView style={styles.tasksList}>
        {tasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>📝 No tasks yet</Text>
            <Text style={styles.emptySubtext}>Tasks from Telegram will appear here</Text>
          </View>
        ) : (
          tasks.map((task) => (
            <View key={task.id} style={styles.taskItem}>
              <TouchableOpacity
                style={styles.taskContent}
                onPress={() => toggleTask.mutate({ taskId: task.id, completed: !task.completed })}
              >
                <Text style={[styles.checkbox, task.completed && styles.checkboxCompleted]}>
                  {task.completed ? '✓' : '○'}
                </Text>
                <Text style={[styles.taskText, task.completed && styles.taskTextCompleted]}>
                  {task.text}
                </Text>
                <Text style={styles.taskSource}>{task.source === 'telegram' ? '✈️' : '➕'}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => removeTask.mutate(task.id)}
              >
                <Text style={styles.deleteText}>🗑️</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* Archive controls at the end of main view */}
      <View style={styles.archiveContainer}>
        <TouchableOpacity
          style={styles.archiveButton}
          onPress={() => archiveCompleted.mutate()}
          disabled={archiveCompleted.isPending}
        >
          <Text style={styles.archiveButtonText}>
            {archiveCompleted.isPending ? 'Archiving…' : 'Archive completed tasks'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.archiveToggle}
          onPress={() => setShowArchive(!showArchive)}
        >
          <Text style={styles.archiveToggleText}>{showArchive ? 'Hide Archive' : 'Open Archive'}</Text>
        </TouchableOpacity>
      </View>

      {showArchive && (
        <View style={styles.archiveSection}>
          <Text style={styles.archiveTitle}>Archive</Text>
          {isLoadingArchived ? (
            <View style={styles.centerContainer}><ActivityIndicator size="small" color="#6366f1" /></View>
          ) : archivedTasks.length === 0 ? (
            <Text style={styles.archiveEmpty}>No archived tasks</Text>
          ) : (
            <ScrollView style={styles.archiveList}>
              {archivedTasks.map((task) => (
                <View key={task.id} style={styles.taskItem}>
                  <View style={styles.taskContent}>
                    <Text style={[styles.checkbox, styles.checkboxCompleted]}>✓</Text>
                    <Text style={[styles.taskText, styles.taskTextCompleted]}>
                      {task.text}
                    </Text>
                    <Text style={styles.taskSource}>{task.source === 'telegram' ? '✈️' : '➕'}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => removeTask.mutate(task.id)}
                  >
                    <Text style={styles.deleteText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      )}

      <Text style={styles.footer}>
        {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
      </Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 50,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    padding: 20,
    paddingBottom: 12,
    color: '#333',
  },
  addTaskContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  micButton: {
    backgroundColor: '#ef4444',
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButtonRecording: {
    backgroundColor: '#dc2626',
  },
  micButtonText: {
    fontSize: 24,
  },
  addButton: {
    backgroundColor: '#6366f1',
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#cbd5e1',
  },
  addButtonText: {
    fontSize: 24,
    color: '#fff',
  },
  transcribingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 8,
  },
  transcribingText: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '500',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  tasksList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 24,
    color: '#999',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  taskItem: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    fontSize: 24,
    marginRight: 12,
    color: '#ccc',
  },
  checkboxCompleted: {
    color: '#10b981',
  },
  taskText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  taskTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  taskSource: {
    fontSize: 18,
    marginLeft: 8,
  },
  deleteButton: {
    padding: 8,
  },
  deleteText: {
    fontSize: 20,
  },
  footer: {
    padding: 20,
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
  },
  archiveContainer: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 8,
  },
  archiveButton: {
    backgroundColor: '#111827',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  archiveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  archiveToggle: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  archiveToggleText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '600',
  },
  archiveSection: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  archiveList: {
    maxHeight: 300,
  },
  archiveTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  archiveEmpty: {
    color: '#9CA3AF',
    fontSize: 14,
    paddingVertical: 8,
  },
});
