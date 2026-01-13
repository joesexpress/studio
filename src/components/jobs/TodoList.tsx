'use client';

import * as React from 'react';
import type { Todo } from '@/lib/types';
import { useFirebase, setDocumentNonBlocking, addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function TodoList({ initialTodos }: { initialTodos: Todo[] }) {
  const [todos, setTodos] = React.useState(initialTodos);
  const [newTask, setNewTask] = React.useState('');
  const { firestore, user } = useFirebase();

  React.useEffect(() => {
    setTodos(initialTodos);
  }, [initialTodos]);

  const handleAddTask = () => {
    if (!firestore || !user || !newTask.trim()) return;

    const newTodo: Omit<Todo, 'id' | 'createdAt'> = {
      task: newTask.trim(),
      isCompleted: false,
      technicianId: user.uid,
    };
    
    const todoWithTimestamp = {
        ...newTodo,
        createdAt: serverTimestamp()
    }

    const todosColRef = collection(firestore, 'technicians', user.uid, 'todos');
    addDocumentNonBlocking(todosColRef, todoWithTimestamp);
    setNewTask('');
  };

  const handleToggleTodo = (todo: Todo) => {
    if (!firestore || !user) return;
    const todoRef = doc(firestore, 'technicians', user.uid, 'todos', todo.id);
    setDocumentNonBlocking(todoRef, { isCompleted: !todo.isCompleted }, { merge: true });
  };

  const handleDeleteTodo = (todoId: string) => {
    if (!firestore || !user) return;
    const todoRef = doc(firestore, 'technicians', user.uid, 'todos', todoId);
    deleteDocumentNonBlocking(todoRef);
  };
  
  const incompleteTodos = todos.filter(t => !t.isCompleted);
  const completedTodos = todos.filter(t => t.isCompleted);

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>To-Do List</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Input
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
            placeholder="Add a new task..."
          />
          <Button onClick={handleAddTask}>
            <Plus className="h-4 w-4 mr-2" /> Add
          </Button>
        </div>
        <ScrollArea className="h-[calc(100vh-28rem)]">
            <div className="space-y-4">
            <h3 className="text-lg font-medium">Tasks</h3>
            {incompleteTodos.length > 0 ? (
                incompleteTodos.map(todo => (
                <div key={todo.id} className="flex items-center gap-4 group">
                    <Checkbox
                    id={`todo-${todo.id}`}
                    checked={todo.isCompleted}
                    onCheckedChange={() => handleToggleTodo(todo)}
                    />
                    <label htmlFor={`todo-${todo.id}`} className="flex-grow text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {todo.task}
                    </label>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100" onClick={() => handleDeleteTodo(todo.id)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
                ))
            ) : (
                <p className="text-sm text-muted-foreground">No pending tasks. Well done!</p>
            )}

            {completedTodos.length > 0 && (
                <div className="mt-6">
                <h3 className="text-lg font-medium">Completed</h3>
                {completedTodos.map(todo => (
                    <div key={todo.id} className="flex items-center gap-4 group">
                    <Checkbox
                        id={`todo-${todo.id}`}
                        checked={todo.isCompleted}
                        onCheckedChange={() => handleToggleTodo(todo)}
                    />
                    <label htmlFor={`todo-${todo.id}`} className="flex-grow text-sm font-medium leading-none text-muted-foreground line-through peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {todo.task}
                    </label>
                     <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100" onClick={() => handleDeleteTodo(todo.id)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                    </div>
                ))}
                </div>
            )}
            </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}