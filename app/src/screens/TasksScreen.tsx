import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTasks, updateTask, deleteTask, Task, fetchArchivedTasks, archiveCompletedTasks } from '../services/supabase';

export default function TasksScreen() {
  const queryClient = useQueryClient();
  const [showArchive, setShowArchive] = useState(false);
  
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

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading tasks...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Tasks</Text>
      
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
                <Text style={styles.taskSource}>{task.source === 'telegram' ? '📱' : '➕'}</Text>
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
            <View style={styles.archiveList}>
              {archivedTasks.map((task) => (
                <View key={task.id} style={styles.taskItem}>
                  <View style={styles.taskContent}>
                    <Text style={[styles.checkbox, styles.checkboxCompleted]}>✓</Text>
                    <Text style={[styles.taskText, styles.taskTextCompleted]}>
                      {task.text}
                    </Text>
                    <Text style={styles.taskSource}>{task.source === 'telegram' ? '📱' : '➕'}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => removeTask.mutate(task.id)}
                  >
                    <Text style={styles.deleteText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      <Text style={styles.footer}>
        {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
      </Text>
    </View>
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
    color: '#333',
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
    // Avoid flex:1 to prevent zero-height inside ScrollView
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
