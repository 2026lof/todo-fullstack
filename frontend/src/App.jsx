import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "";

async function api(path, options) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok && res.status !== 204) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Request failed`);
  }

  return res.status === 204 ? null : res.json();
}

export default function App() {
  const [todos, setTodos] = useState([]);
  const [text, setText] = useState("");

  async function load() {
    const data = await api("/api/todos");
    setTodos(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function addTodo(e) {
    e.preventDefault();
    if (!text.trim()) return;

    await api("/api/todos", {
      method: "POST",
      body: JSON.stringify({ text }),
    });

    setText("");
    load();
  }

  async function toggle(id) {
    await api(`/api/todos/${id}/toggle`, { method: "PATCH" });
    load();
  }

  async function remove(id) {
    await api(`/api/todos/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div style={{ maxWidth: 600, margin: "40px auto", fontFamily: "Arial" }}>
      <h1>Todo App</h1>

      <form onSubmit={addTodo} style={{ display: "flex", gap: 10 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a todo"
          style={{ flex: 1, padding: 8 }}
        />
        <button>Add</button>
      </form>

      <ul style={{ marginTop: 20 }}>
        {todos.map((t) => (
          <li key={t.id} style={{ marginBottom: 10 }}>
            <input
              type="checkbox"
              checked={t.done}
              onChange={() => toggle(t.id)}
            />

            <span
              style={{
                marginLeft: 10,
                textDecoration: t.done ? "line-through" : "none",
              }}
            >
              {t.text}
            </span>

            <button
              onClick={() => remove(t.id)}
              style={{ marginLeft: 10 }}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
