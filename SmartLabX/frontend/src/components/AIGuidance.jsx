import React, { useState, useEffect } from 'react';
import { raiseApi } from '../utils/api';

export default function AIGuidance({ auth }) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [logs, setLogs] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = window.localStorage.getItem('smartlabx-ai-logs');
        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const [securityLogs, setSecurityLogs] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = window.localStorage.getItem('smartlabx-security-logs');
        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('smartlabx-ai-logs', JSON.stringify(logs));
    }
  }, [logs]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof window !== 'undefined') {
        try {
          const saved = window.localStorage.getItem('smartlabx-security-logs');
          if (saved) setSecurityLogs(JSON.parse(saved));
        } catch (e) {}
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    
    const q = question.toLowerCase();
    let res = '[HINT] **AI Guidance & Hint:** Break down your question into core lab concepts (DBMS, Networks, or Operating Systems).';

    // --- DBMS Topics ---
    if (q.includes('what is dbms') || q.trim() === 'dbms' || q.includes('definition of dbms')) {
      res = '[HINT] **What is DBMS?**\n\nA **Database Management System (DBMS)** is software designed to store, retrieve, define, and manage data in a database efficiently.\n\n **Key Characteristics:**\n1. **Data Storage & Management**: Organizes data in tables (Relational) or documents.\n2. **SQL Support**: Allows querying using SQL commands (SELECT, INSERT, UPDATE, DELETE).\n3. **ACID Compliance**: Ensures reliable transactions.\n4. **Security & Concurrency**: Multi-user access with authentication and locking.\n\nExamples: *MySQL, PostgreSQL, Oracle, SQLite, MongoDB*.';
    } else if (q.includes('why') && q.includes('normalization')) {
      res = '[HINT] **Why Normalization in DBMS?**\n\n1. **Reduces Data Redundancy**: Eliminates duplicate data storage across tables.\n2. **Prevents Anomalies**: Avoids Insertion, Update, and Deletion anomalies.\n3. **Data Integrity**: Ensures relationships and constraints are strictly enforced.\n\n **Normal Forms Hint:**\n- **1NF**: Ensure atomic values (no lists/arrays in a single cell).\n- **2NF**: Remove partial dependencies (all non-key attributes depend on whole Primary Key).\n- **3NF**: Remove transitive dependencies (non-key attributes depend only on Primary Key).';
    } else if (q.includes('normalization') || q.includes('nf')) {
      res = '[HINT] **Normalization Rules & Hint:**\n- **1NF**: Atomic column values (no multi-valued attributes).\n- **2NF**: Table is in 1NF and has NO partial key dependencies.\n- **3NF**: Table is in 2NF and has NO transitive dependencies (X -> Y where Y is non-key).\n- **BCNF**: Strict 3NF (For every functional dependency X -> Y, X must be a Super Key).';
    } else if (q.includes('select')) {
      res = '[HINT] **SELECT Query Usage:**\nUsed to retrieve data from one or more tables.\n\n```sql\nSELECT column1, column2 \nFROM table_name \nWHERE condition;\n```\n **Hint:** Use `*` to select all columns, or specify column names for better performance.';
    } else if (q.includes('join')) {
      res = '[HINT] **SQL JOIN Types:**\n1. **INNER JOIN**: Returns rows with matching values in both tables.\n2. **LEFT JOIN**: Returns all rows from left table + matched rows from right.\n3. **RIGHT JOIN**: Returns all rows from right table + matched rows from left.\n4. **FULL JOIN**: Returns all rows when there is a match in either table.\n\n```sql\nSELECT A.col, B.col \nFROM TableA A \nINNER JOIN TableB B ON A.id = B.a_id;\n```';
    } else if (q.includes('create') || q.includes('table')) {
      res = '[HINT] **CREATE TABLE Syntax:**\n\n```sql\nCREATE TABLE Students (\n  student_id INT PRIMARY KEY,\n  name VARCHAR(50) NOT NULL,\n  dept VARCHAR(20)\n);\n```\n **Hint:** Specify `NOT NULL`, `UNIQUE`, or `FOREIGN KEY` constraints during table definition.';
    } else if (q.includes('primary') || q.includes('foreign') || q.includes('key')) {
      res = '[HINT] **Primary Key vs Foreign Key:**\n- **Primary Key**: Uniquely identifies each record in a table. Cannot be NULL or duplicate.\n- **Foreign Key**: A key in one table that refers to the Primary Key of another table to establish relationships.';
    } else if (q.includes('acid') || q.includes('transaction')) {
      res = '[HINT] **ACID Properties in DBMS:**\n- **A (Atomicity)**: All operations complete successfully or none at all.\n- **C (Consistency)**: Database remains in a valid state before and after transaction.\n- **I (Isolation)**: Concurrent transactions execute without interfering with each other.\n- **D (Durability)**: Committed changes persist even after system crashes.';
    
    // --- Computer Networks Topics ---
    } else if (q.includes('ip') || q.includes('subnet') || q.includes('address')) {
      res = '[HINT] **IP Addressing & Subnetting:**\n- **IPv4**: 32-bit address split into 4 octets (e.g., 192.168.1.1).\n- **Subnet Mask**: Defines Network ID vs Host ID (e.g. `/24` = 255.255.255.0).\n **Hint:** Class A (1-126), Class B (128-191), Class C (192-223).';
    } else if (q.includes('tcp') || q.includes('udp')) {
      res = '[HINT] **TCP vs UDP:**\n- **TCP**: Connection-oriented, reliable, 3-way handshake (SYN, SYN-ACK, ACK), error control.\n- **UDP**: Connectionless, fast, lightweight, no delivery guarantee (streaming/DNS).';
    } else if (q.includes('routing') || q.includes('router')) {
      res = '[HINT] **Routing Algorithms:**\n- **Distance Vector (RIP)**: Uses Bellman-Ford, hop count metric.\n- **Link State (OSPF)**: Uses Dijkstra\'s shortest path algorithm, link cost metric.';
    } else if (q.includes('topology') || q.includes('topologies')) {
      res = '[HINT] **Network Topologies:**\n- **Star**: All devices connect to central Hub/Switch.\n- **Bus**: Single central cable backbone.\n- **Ring**: Tokens passed in a closed circular loop.\n- **Mesh**: Every node connected to every other node (High fault tolerance).';

    // --- Operating Systems Topics ---
    } else if (q.includes('cpu') || q.includes('scheduling')) {
      res = '[HINT] **CPU Scheduling Algorithms:**\n- **FCFS**: First Come First Served (Non-preemptive, suffers from Convoy effect).\n- **SJF**: Shortest Job First (Optimal average wait time, can cause starvation).\n- **Round Robin**: Preemptive with Time Quantum (Fair CPU sharing).\n- **Priority**: Preemptive/Non-preemptive based on priority level.';
    } else if (q.includes('memory') || q.includes('ram') || q.includes('allocation')) {
      res = '[HINT] **Memory Allocation Strategies:**\n- **First Fit**: Allocate first hole big enough.\n- **Best Fit**: Allocate smallest hole big enough (leaves smallest leftover memory).\n- **Worst Fit**: Allocate largest available hole.';
    } else if (q.includes('page') || q.includes('lru') || q.includes('fifo')) {
      res = '[HINT] **Page Replacement Algorithms:**\n- **FIFO**: Replaces oldest page in memory.\n- **LRU**: Replaces page not used for longest time.\n- **Optimal**: Replaces page that won\'t be used for longest time in future.';
    } else if (q.includes('deadlock') || q.includes('banker')) {
      res = '[HINT] **Deadlock & Banker\'s Algorithm:**\n- 4 Conditions: Mutual Exclusion, Hold & Wait, No Preemption, Circular Wait.\n- **Banker\'s Algorithm**: Checks if `Need <= Available` to find a Safe Execution Sequence.';
    } else if (q.includes('disk') || q.includes('scan') || q.includes('c-scan')) {
      res = '[HINT] **Disk Scheduling Algorithms:**\n- **FCFS**: Head moves in order of requests.\n- **SSTF**: Serves request closest to current head position.\n- **SCAN (Elevator)**: Head moves in one direction to end, then reverses.\n- **C-SCAN**: Head moves to end, jumps back to start without servicing on return.';
    } else {
      res = `[HINT] **Answer for "${question}":**\nFor virtual lab experiments, verify your inputs, algorithm parameters, and step-by-step logic. Ask specific terms like \`CPU scheduling\`, \`TCP\`, \`Subnetting\`, \`JOIN\`, or \`Deadlock\`.`;
    }
    
    setAnswer(res);
    
    if (auth && auth.role === 'student') {
      const newLog = {
        id: Date.now(),
        email: auth.email,
        question: question,
        time: new Date().toLocaleTimeString(),
      };
      setLogs((prev) => [newLog, ...prev]);
    }

    if (auth?.email) {
      try {
        const hint = await raiseApi.hint({
          studentId: auth.email,
          question: question.trim().slice(0, 120),
          currentProgress: 0,
        });
        if (hint?.content) {
          const level = String(hint.level || '').toUpperCase();
          setAnswer((prev) => `${prev}\n\n── RAISE Hint${level ? ` • Level ${level}` : ''} ──\n${hint.content}`);
        }
      } catch (err) {
        // RAISE backend is optional; keep the local guidance answer.
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
        <h4 className="text-sm font-semibold text-slate-900">AI Guidance & Hints</h4>
        <p className="mt-2 text-sm text-slate-600">Ask any DBMS query to receive helpful syntax hints and guidance tips.</p>

        <div className="mt-4 space-y-3">
          <form onSubmit={handleAsk}>
            <label className="mb-1 block text-xs font-medium text-slate-700">Ask AI (DBMS Hints)</label>
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. How to use JOIN or SELECT?"
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400"
            />
            <div className="mt-2 flex items-center gap-2">
              <button type="submit" className="rounded-2xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-700">Ask</button>
              <button type="button" onClick={() => { setQuestion(''); setAnswer(''); }} className="rounded-2xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700">Clear</button>
            </div>
          </form>

          {answer && (
            <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 font-medium leading-relaxed shadow-sm whitespace-pre-line">
              {answer}
            </div>
          )}
        </div>
      </div>
      
      
    </div>
  );
}
