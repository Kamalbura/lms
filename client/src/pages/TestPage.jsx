import React from 'react';

// This component is intentionally very simple
// to test basic React rendering
const TestPage = () => {
  return (
    <div style={{
      margin: '50px auto',
      maxWidth: '500px',
      padding: '20px',
      border: '1px solid #ccc',
      borderRadius: '8px',
      backgroundColor: '#f9f9f9',
      textAlign: 'center'
    }}>
      <h1 style={{ fontSize: '24px', marginBottom: '10px' }}>React Is Working!</h1>
      <p>If you can see this page, React is rendering correctly.</p>
      <p style={{ marginTop: '20px', fontStyle: 'italic' }}>
        This is a minimal test component with no dependencies.
      </p>
    </div>
  );
};

export default TestPage;
