import React, { useState, useEffect } from 'react';
import './style.css';

export default function FlashCard() {
  const [raw, setRaw] = useState('');

  useEffect(() => {
    fetch('/nihongo-card/lib/dict.txt', {
      method: 'GET',
      cache: 'no-store'  // prevent cache
    }).then(response => response.text())
      .then(dict => setRaw(dict))
      .catch((error) => console.error('Error loading dict:', error));
  }, []);

  return (
    <div className='raw-container'>
      <pre>
        {raw}
      </pre>
    </div>
  );
}

