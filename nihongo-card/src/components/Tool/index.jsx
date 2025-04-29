import React, { useState, useEffect } from 'react';
import './style.css';

export default function FlashCard() {
  const [inputDict, setInputDict] = useState('');
  const [outputDict, setOutputDict] = useState('');
  const [removeEmpty, setRemoveEmpty] = useState(true);

  const handleRemoveEmptyChange = (e) => {
    setRemoveEmpty(e.target.checked);
  };

  const handleInputDictChange = (e) => {
    setInputDict(e.target.value);
  };

  useEffect(() => {
    setOutputDict(parseInputDict(inputDict));
  }, [inputDict, removeEmpty]);

  const handleCopyClick = async () => {
    try {
      await navigator.clipboard.writeText(outputDict);
    } catch (e) {
      alert('Copy failed, browser do not support');
      console.error(e);
    }
  };

  const parseInputDict = (text = '') => {
    text = text
      .replaceAll('（', '(')
      .replaceAll('）', ')')
      .replaceAll('＜', '<')
      .replaceAll('＞', '>')
      .replaceAll('［', '[')
      .replaceAll('］', ']')
      .replaceAll('？', '?')
      .replaceAll('：', ':')
      .replaceAll('　', ' ')
      .replaceAll('／', '/')
      .replaceAll('！', '!')
      .replaceAll('，', ',')
      .replaceAll('、', ',')
      .replaceAll('＝', '=')
      .replaceAll('｜', '|')
      .replaceAll('～', '~');

    if (removeEmpty) {
      text = text.replaceAll(' ', '');
    }

    console.dir(text);
    return text;
  }

  return (
    <div className='tool-container'>
      <h2>Dict Editor</h2>
      <div className='tool-manager'>
        <label>
          <input
            type="checkbox"
            checked={removeEmpty}
            onChange={handleRemoveEmptyChange}
          />
          Remove empty
        </label>
        <button onClick={handleCopyClick}>
          Copy output
        </button>
      </div>
      <textarea
        value={inputDict}
        onChange={handleInputDictChange}
        placeholder="Input..."
      />
      <textarea
        value={outputDict}
        placeholder="Output..."
      />
    </div>
  );
}