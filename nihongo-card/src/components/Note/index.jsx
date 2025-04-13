import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './style.css';

export default function FlashCard() {
  const [note, setNote] = useState('');

  useEffect(() => {
    fetch('/nihongo-card/lib/grammar.md', {
      method: 'GET',
      cache: 'no-store',
    })
      .then((response) => response.text())
      .then((data) => setNote(data))
      .catch((error) => console.error('Error loading note:', error));
  }, []);

  return (
    <div className="note-container">
      <div className="displayer">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {note}
        </ReactMarkdown>
      </div>
    </div>
  );
}
