import React, { useState } from 'react';
import './DbmsLab.css';

const DbmsLab = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const executeQuery = async () => {
    setError('');
    setMessage('');
    setResults(null);

    if (!query.trim()) {
      setError('Please enter a SQL query.');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/dbms/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to execute query');
      }

      setMessage(data.message);
      if (data.data) {
        setResults(data.data);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="dbms-lab-container">
      <div className="dbms-lab-header">
        <h2>DBMS Lab - SQL Executor</h2>
        <p>Write and execute SQL queries directly against your lab database.</p>
      </div>

      <div className="query-section">
        <textarea
          className="sql-editor"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter your SQL query here (e.g., SELECT * FROM students)"
          rows={8}
        />
        <div className="button-group">
          <button className="execute-btn" onClick={executeQuery}>
            Run Query
          </button>
          <button className="clear-btn" onClick={() => { setQuery(''); setResults(null); setError(''); setMessage(''); }}>
            Clear
          </button>
        </div>
      </div>

      <div className="results-section">
        <h3>Execution Results</h3>
        
        {error && <div className="alert error">{error}</div>}
        {message && <div className="alert success">{message}</div>}

        {results && results.length > 0 && (
          <div className="table-responsive">
            <table className="results-table">
              <thead>
                <tr>
                  {Object.keys(results[0]).map((key) => (
                    <th key={key}>{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((row, index) => (
                  <tr key={index}>
                    {Object.values(row).map((val, idx) => (
                      <td key={idx}>{val !== null ? val.toString() : 'NULL'}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {results && results.length === 0 && (
          <div className="alert info">No rows returned.</div>
        )}
      </div>
    </div>
  );
};

export default DbmsLab;
