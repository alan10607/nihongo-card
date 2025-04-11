import React, { useState, useEffect } from 'react';
import useLocalStorage from '../../utils/useLocalStorage';
import './style.css';

export default function FlashCard() {
  const [dict, setDict] = useState([]);
  const [index, setIndex] = useState(0);
  const [tagIndex, setTagIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [startX, setStartX] = useState(0); // Use this to follow up touching
  const [showRt, setShowRt] = useState(false);
  const DIFFICULTY = { LV1: 1, LV2: 2, DEFAULT: -1 };
  const [markList, setMarkList] = useLocalStorage('markDict', {});
  const [markLevel, setMarkLevel] = useState(DIFFICULTY.DEFAULT);
  const [goToIndex, setGoToIndex] = useState(-1);

  // Load dict
  useEffect(() => {
    fetch('/nihongo-card/lib/dict.txt', {
      method: 'GET',
      cache: 'no-store'  // prevent cache
    }).then((response) => response.text())
      .then((data) => {
        const parsedData = parseToDict(data);
        console.log('dict size', parsedData.length);
        setDict(parsedData);
        setIndex(0);
      })
      .catch((error) => console.error('Error loading dict:', error));
  }, [markLevel]);

  const parseToDict = (data) => {
    const lines = data.split('\n');
    const tempDict = [];

    let tag = '';
    for (const line of lines) {
      if (line === '') continue;
      if (!isInMarkLevel(line)) continue;
      if (line.includes('**')) { // to tag in next card
        tag = line.replaceAll('*', '');
        continue;
      }

      const wordAndExp = line.split(':');
      const word = wordAndExp[0];
      const exp = wordAndExp[1] || '';
      let html = '<ruby>';
      let rtFlag = false;
      let multiRt = false;

      for (let i = 0; i < word.length; i++) {
        const ch = word[i];
        if (ch === ' ') {
          // do nothing
        } else if (ch === ',') {
          html += ', ';
        } else if (ch === '<') { // rt for multi word
          html += '</ruby> <ruby>';
          multiRt = true;
        } else if (ch === '>') {
          multiRt = false;
        } else if (ch === '(') {
          html += '<rt>';
          rtFlag = true;
        } else if (ch === ')') {
          html += '</rt>';
          rtFlag = false;
        } else {
          if (i > 0 && !rtFlag && !multiRt) {
            html += '</ruby> <ruby>';
          }
          html += ch;
        }
      }

      html += '</ruby>';
      tempDict.push({ html, exp, tag, raw: line });

      tag = '';
    }

    return tempDict;
  }

  const isInMarkLevel = (key) => {
    if (markLevel === DIFFICULTY.DEFAULT) return true;
    if (!markList[key]) return false;
    return markList[key] >= markLevel;
  }

  const handleFlip = () => setFlipped((prev) => !prev);
  const handleShowRt = () => setShowRt((prev) => !prev);

  const nextCard = () => {
    setIndex((prev) => (prev + 1) % dict.length);
    setFlipped(false);
  }

  const prevCard = () => {
    setIndex((prev) => (prev - 1 + dict.length) % dict.length);
    setFlipped(false);
  };

  const handleTouchStart = (e) => {
    const touchStart = e.touches[0].clientX;
    setStartX(touchStart);
  };

  const handleTouchEnd = (e) => {
    const touchEnd = e.changedTouches[0].clientX;
    const distance = touchEnd - startX;

    if (distance > 30) {
      prevCard();
    } else if (distance < -30) {
      nextCard();
    }
  };

  // Keyboard listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        nextCard();
      } else if (e.key === 'ArrowLeft') {
        prevCard();
      } else if (e.key === 'Enter' || e.key === ' ') {
        handleFlip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dict]);

  const handleTagChange = (event) => {
    const nextIndex = Number(event.target.value);
    setTagIndex(nextIndex);
    setIndex(nextIndex);
    setFlipped(false);
  };

  const handleMarkDifficulty = (difficulty) => {
    const newMarkList = { ...markList };
    const key = dict[index].raw;
    difficulty = Number(difficulty);
    if (newMarkList[key] === difficulty) {
      delete newMarkList[key];
    } else {
      newMarkList[key] = difficulty;
    }

    setMarkList(newMarkList);
  };

  const handleMarkFilterChange = (event) => {
    setMarkLevel(Number(event.target.value));
  };

  const getStickerColorCss = () => {
    const key = dict[index].raw;
    if (markList[key] === DIFFICULTY.LV1) return 'yellow';
    if (markList[key] === DIFFICULTY.LV2) return 'red';
    return ''
  }

  const getTagOptions = () => {
    return dict.map((data, index) => ({ text: data.tag, value: index }))
      .filter(item => !!item.text) // exclude empty tag
      .map((item) => (
        <option key={item.value} value={item.value}>
          {item.text}
        </option>
      ));
  }

  const handleGoToChange = (event) => {
    const nextIndex = Number(event.target.value);
    if (nextIndex === -1) return;
    
    setGoToIndex(nextIndex);
    setIndex(nextIndex);
    setFlipped(false);
  };

  return (
    <div className='root-container'>
      <div className='card-manager'>
        <select value={tagIndex} onChange={handleTagChange}>
          {getTagOptions()}
        </select>
        <div className='expand'></div>
        <select value={markLevel} onChange={handleMarkFilterChange}>
          <option value={DIFFICULTY.DEFAULT}>-</option>
          <option value={DIFFICULTY.LV1}>☆</option>
          <option value={DIFFICULTY.LV2}>☆☆</option>
        </select>
        <button className={showRt ? 'selected' : ''} onClick={handleShowRt}>あ</button>
        <button className='yellow' onClick={() => handleMarkDifficulty(DIFFICULTY.LV1)}>☆</button>
        <button className='red' onClick={() => handleMarkDifficulty(DIFFICULTY.LV2)}>☆☆</button>
      </div>
      
      <div className='card-manager'>
        <select className='go-to-selector' value={goToIndex} onChange={handleGoToChange}>
        <option key='-1' value='-1'>-</option>
          {dict.map((data, index) => (
            <option key={index} value={index}>
              {data.raw}
            </option>
          ))}
        </select>
      </div>


      <div className='card-container'>
        <button onClick={prevCard}>{"<"}</button>
        {dict.length > 0 && (
          <div
            className={`flashcard ${flipped ? 'flipped' : ''}`}
            onClick={handleFlip}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className={`sticker ${getStickerColorCss()}`}></div>
            <div className='front'>
              <div className={showRt ? '' : 'no-rt'} dangerouslySetInnerHTML={{ __html: dict[index].html }} />
            </div>
            <div className='back'>
              <div dangerouslySetInnerHTML={{ __html: dict[index].html }} />
              <div className='exp'>{dict[index].exp}</div>
            </div>
          </div>
        )}
        <button onClick={nextCard}>{">"}</button>
      </div>

      <div className='card-foot'>
        <div className='expand'></div>
        <div className='tooltip'>{index + 1}</div>
      </div>
    </div>
  );
}