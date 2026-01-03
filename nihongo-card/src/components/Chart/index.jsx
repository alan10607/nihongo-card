import React, { useState, useEffect, useRef } from 'react';
import useLocalStorage from '../../utils/useLocalStorage';
import './style.css';

export default function Chart() {
  const [words, setWords] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState('');
  const [filteredWords, setFilteredWords] = useState([]);
  const [showExp, setShowExp] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [hiddenMap, setHiddenMap] = useLocalStorage('chartHidden', {});
  const [isMemorizeMode, setIsMemorizeMode] = useState(false);
  const [pendingHideWords, setPendingHideWords] = useState([]);

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

  const toggleShowExp = () => setShowExp((prev) => !prev);
  const togglesMemorizeMode = () => {
    setIsMemorizeMode(prev => {
      const next = !prev;
      setShowExp(!next);
      setSelectedIndex(null);
      return next;
    });
  }
  

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

  const handlePassBtn = (e, key, item) => {
    e.stopPropagation();
    setPendingHideWords(prev => [...prev, key]);

    setTimeout(() => {
      hideWord(item);
      setPendingHideWords(prev => prev.filter(k => k !== key));
    }, 300); // same as CSS transition time
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
        <button className={showExp ? 'selected' : ''} onClick={toggleShowExp}>註釋</button>
        <button className={isMemorizeMode ? 'selected' : ''} onClick={togglesMemorizeMode}>考試</button>
        <button 
          className={hiddenMap[selectedTag]?.length > 0 ? 'selected' : ''}
          style={isMemorizeMode ? {} : { display: 'none' }}
          onClick={restoreHidden}>
          復原 {hiddenMap[selectedTag]?.length > 0 ? hiddenMap[selectedTag].length : ''}
        </button>
      </div>
      <div className='chart-scroll'>
        {filteredWords
        .filter(item => {
          if (!isMemorizeMode) return true;
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
              className={`chart-item 
                ${isSelected ? 'selected' : ''} 
                ${pendingHideWords.includes(key) ? 'swipe-hide' : ''}`
              }
              onClick={() => handleItemClick(key)}
            >
              <div className="chart-item-content">
                <div className={`chart-word ${(isSelected || showExp) ? '' : 'no-rt'}`}>
                  {renderRubyJSX(item.word)}
                </div>
                {(isSelected || showExp) && item.exp && (
                  <div className='chart-exp'>
                    {item.exp}
                  </div>
                )}
                {isMemorizeMode && (
                  <button
                    className='chart-pass-btn'
                    onClick={(e) => handlePassBtn(e, key, item)}
                  >
                    ✔
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className='chart-spacer'></div>
    </div>
  );
}
