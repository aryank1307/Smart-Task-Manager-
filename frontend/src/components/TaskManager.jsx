import React, { useEffect, useState } from 'react';

export default function TaskManager({ apiUrl, token, user, onLogout }) {
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', priority: 'Medium', deadline: '' });

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };

  const fetchTasks = async () => {
    const res = await fetch(`${apiUrl}/tasks`, { headers });
    if (res.ok) setTasks(await res.json());
  };

  useEffect(() => { fetchTasks(); }, []);

  const addTask = async (e) => {
    e.preventDefault();
    const res = await fetch(`${apiUrl}/tasks`, { method: 'POST', headers, body: JSON.stringify(form) });
    if (res.ok) {
      setForm({ title: '', description: '', priority: 'Medium', deadline: '' });
      fetchTasks();
    }
  };

  const toggleStatus = async (task) => {
    await fetch(`${apiUrl}/tasks/${task._id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ status: task.status === 'Pending' ? 'Completed' : 'Pending' })
    });
    fetchTasks();
  };

  const deleteTask = async (id) => {
    await fetch(`${apiUrl}/tasks/${id}`, { method: 'DELETE', headers });
    fetchTasks();
  };

  return (
    <>
      <section className="card">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h2>Welcome, {user?.name || 'User'}</h2>
          <button className="secondary" onClick={onLogout}>Logout</button>
        </div>
        <form onSubmit={addTask}>
          <input placeholder="Task title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="row">
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              <option>Low</option><option>Medium</option><option>High</option>
            </select>
            <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
            <button type="submit">Add Task</button>
          </div>
        </form>
      </section>

      <section className="card">
        <h3>Your Tasks</h3>
        {tasks.length === 0 && <p className="small">No tasks yet.</p>}
        {tasks.map((task) => (
          <article className="task" key={task._id}>
            <h4>{task.title}</h4>
            <p>{task.description}</p>
            <p className="small">Priority: {task.priority} | Status: {task.status} | Deadline: {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'N/A'}</p>
            <div className="row">
              <button onClick={() => toggleStatus(task)}>{task.status === 'Pending' ? 'Mark Completed' : 'Mark Pending'}</button>
              <button className="danger" onClick={() => deleteTask(task._id)}>Delete</button>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}