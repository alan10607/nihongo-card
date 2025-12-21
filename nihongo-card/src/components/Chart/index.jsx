import React, { useState, useEffect } from 'react';
import './style.css';

export default function Chart() {
  const [words, setWords] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState('');
  const [filteredWords, setFilteredWords] = useState([]);
  const [showRt, setShowRt] = useState(true);
  const [showExp, setShowExp] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(null);

  // Load dict
  useEffect(() => {
    fetch('/nihongo-card/lib/dict.txt', {
      method: 'GET',
      cache: 'no-store'
    }).then(response => response.text())
      .then(parseDict)
      .catch((error) => console.error('Error loading dict:', error));
  }, []);

  // Filter words by selected tag
  useEffect(() => {
    if (selectedTag === '') {
      setFilteredWords(words);
    } else {
      setFilteredWords(words.filter(word => word.tag === selectedTag));
    }
  }, [selectedTag, words]);

  const parseDict = (rawData) => {
    const lines = rawData.split('\n').map(line => line.trim()).filter(line => line !== '');
    const parsedWords = [];
    const parsedTags = [];
    let currentTag = null;

    lines.forEach(line => {
      if (line.includes('**')) {
        const tag = line.replaceAll('*', '');
        currentTag = tag;
        parsedTags.push(tag);
      } else {
        const [word, exp = ''] = line.split(':');
        parsedWords.push({
          word: word.trim(),
          exp: exp.trim(),
          tag: currentTag
        });
      }
    });

    setWords(parsedWords);
    setTags(parsedTags);
    if (parsedTags.length > 0) {
      setSelectedTag(parsedTags[parsedTags.length - 1]);
    }
    setSelectedIndex(null);
  };

  const handleSelectedTagChange = (event) => {
    setSelectedTag(event.target.value);
  };

  const toggleShowRt = () => setShowRt((prev) => !prev);
  const toggleShowExp = () => setShowExp((prev) => !prev);

  const handleItemClick = (index) => {
    if (selectedIndex === index) {
      setSelectedIndex(null);
    } else {
      setSelectedIndex(index);
    }
  };

  const renderRubyJSX = (word) => {
    const elements = [];
    let buffer = '';
    let rtBuffer = '';
    let rtFlag = false;
    let multiRt = false;

    const pushRuby = () => {
      if (!buffer) return;

      elements.push(
        <ruby key={elements.length}>
          {buffer}
          {rtBuffer && <rt>{rtBuffer}</rt>}
        </ruby>
      );

      buffer = '';
      rtBuffer = '';
    };

    for (const ch of word) {
      if (ch === ' ') {
        // do nothing
      } else if (ch === ',') {
        buffer += ', ';
      } else if (ch === '<') {
        pushRuby();
        multiRt = true;
      } else if (ch === '>') {
        multiRt = false;
      } else if (ch === '(') {
        rtFlag = true;
      } else if (ch === ')') {
        rtFlag = false;
        pushRuby();
      } else {
        if (rtFlag) {
          rtBuffer += ch;
        } else if (multiRt) {
          buffer += ch;
        } else {
          pushRuby();
          buffer = ch;
        }
      }
    }

    pushRuby();

    return <>{elements}</>;
  };

  const renderTagOptions = () => {
    return (
      <>
        <option value="">全部</option>
        {tags.map(tag => (
          <option key={tag} value={tag}>
            {tag}
          </option>
        ))}
      </>
    );
  };

  return (
    <div className='chart-container'>
      <div className='chart-manager'>
        <select value={selectedTag} onChange={handleSelectedTagChange}>
          {renderTagOptions()}
        </select>
        <button className={showRt ? 'selected' : ''} onClick={toggleShowRt}>あ</button>
        <button className={showExp ? 'selected' : ''} onClick={toggleShowExp}>註釋</button>
      </div>
      <div className='chart-scroll'>
        {filteredWords.map((item, index) => {
          const isSelected = selectedIndex === index;
          return (
            <div 
              key={index} 
              className={`chart-item ${(isSelected) ? 'selected' : ''}`}
              onClick={() => handleItemClick(index)}
            >
              <div className={`chart-word ${(isSelected || showRt) ? '' : 'no-rt'}`}>
                {renderRubyJSX(item.word)}
              </div>
              {(isSelected || showExp) && item.exp && (
                <div className='chart-exp'>
                  {item.exp}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className='chart-spacer'></div>
    </div>
  );
}
