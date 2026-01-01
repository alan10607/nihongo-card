import React, { useState, useEffect, useRef } from 'react';
import useLocalStorage from '../../utils/useLocalStorage';
import './style.css';

export default function Chart() {
  const [words, setWords] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState('');
  const [filteredWords, setFilteredWords] = useState([]);
  const [showRt, setShowRt] = useState(true);
  const [showExp, setShowExp] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [hiddenMap, setHiddenMap] = useLocalStorage('chartHidden', {});
  const startXRef = useRef(null);
  const [dragState, setDragState] = useState({key: null, x: 0, swiping: false});

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

  const shiftTag = (step) => {
    if (tags.length === 0) return;
  
    const currentIndex = tags.indexOf(selectedTag);
    const safeIndex = currentIndex === -1 ? 0 : currentIndex;
    const nextIndex = (safeIndex + step + tags.length) % tags.length;
  
    setSelectedTag(tags[nextIndex]);
    setSelectedIndex(null);
  };

  const handlePrevTag = () => shiftTag(-1);
  const handleNextTag = () => shiftTag(1);

  const hideWord = (item) => {
    setHiddenMap(prev => {
      const prevList = prev[item.tag] || [];
      if (prevList.includes(item.word)) return prev;
  
      return {
        ...prev,
        [item.tag]: [...prevList, item.word]
      };
    });
  };

  const restoreHidden = () => {
    setHiddenMap(prev => {
      const copy = { ...prev };
      delete copy[selectedTag];
      return copy;
    });
  };

  const handleItemClick = (index) => {
    if (selectedIndex === index) {
      setSelectedIndex(null);
    } else {
      setSelectedIndex(index);
    }
  };

  const handleDragStart = (e, key) => {
    startXRef.current = e.clientX ?? e.touches[0].clientX;
    setDragState({ key: key, x: 0, swiping: true });

  };

  const handleDragMove = (e, key) => {
    if (startXRef.current === null) return;
    const clientX = e.clientX ?? e.touches[0].clientX;
    const deltaX = clientX - startXRef.current;
    if (deltaX > 10) {
      setDragState({ key: key, x: deltaX, swiping: true });

      if (e.currentTarget) {
        if (deltaX > 20) e.currentTarget.classList.add('swiping');
        else e.currentTarget.classList.remove('swiping');
      }
    }
  };

  const handleDragEnd = (e, key, item) => {
    if (startXRef.current === null) return;
    if (e.currentTarget) {
      e.currentTarget.classList.remove('swiping');
    }
    startXRef.current = null;
    
    const deltaX = dragState?.x || 0;
    if (deltaX > 120) {
      setDragState({ key: key, x: 1000, swiping: false });

      setTimeout(() => {
        hideWord(item);
        setDragState({ key: null, x: 0, swiping: false });
      }, 300); // same as CSS transition time
    } else {
      setDragState({ key: key, x: 0, swiping: false });

    }
  };

  const handleMouseDown = (e, key, item) => {
    startXRef.current = e.clientX;
    setDragState({ key: key, x: 0, swiping: true });

  
    // MouseMove
    const handleMouseMove = (ev) => {
      if (startXRef.current === null) return;
      const deltaX = ev.clientX - startXRef.current;
      setDragState({ key: key, x: deltaX, swiping: true });

  
      const el = document.querySelector(`[data-key="${key}"]`);
      if (el) {
        if (deltaX > 20) el.classList.add('swiping');
        else el.classList.remove('swiping');
      }
    };
  
    // MouseUp
    const handleMouseUp = (ev) => {
      const deltaX = ev.clientX - startXRef.current;
      startXRef.current = null;

      const el = document.querySelector(`[data-key="${key}"]`);
      if (el) el.classList.remove('swiping');

      if (deltaX > 120) {
        setDragState({ key: key, x: 1000, swiping: false });

        setTimeout(() => {
          hideWord(item);
          setDragState({ key: null, x: 0, swiping: false });
        }, 300); // same as CSS transition time
      } else {
        setDragState({ key: key, x: 0, swiping: false });

      }

      startXRef.current = null;

      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
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
        <button onClick={handlePrevTag}>◀</button>
        <button onClick={handleNextTag}>▶</button>
        <div className='expand'></div>
        <button className={showRt ? 'selected' : ''} onClick={toggleShowRt}>あ</button>
        <button className={showExp ? 'selected' : ''} onClick={toggleShowExp}>註釋</button>
        <button onClick={restoreHidden}>
          復原 {hiddenMap[selectedTag]?.length > 0 ? hiddenMap[selectedTag].length : ''}
        </button>
      </div>
      <div className='chart-scroll'>
        {filteredWords
        .filter(item => {
          const hiddenList = hiddenMap[selectedTag] || [];
          return !hiddenList.includes(item.word);
        })
        .map((item, index) => {
          const key = item.word;
          const isSelected = selectedIndex === key;
          return (
            <div 
              key={key}
              data-key={key} 
              className={`chart-item ${(isSelected) ? 'selected' : ''}`}
              style={{
                transform: dragState?.key === key ? `translateX(${dragState?.x || 0}px)` : '',
                transition: dragState?.key === key ? 'none' : 'transform 0.3s ease, opacity 0.3s ease',
              }}
              onClick={() => handleItemClick(key)}
              onTouchStart={(e) => handleDragStart(e, key)}
              onTouchMove={(e) => handleDragMove(e, key)}
              onTouchEnd={(e) => handleDragEnd(e, key, item)}
              onMouseDown={(e) => handleMouseDown(e, key, item)}
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
