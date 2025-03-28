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
  const DIFFICULTY = { LV1: 0, LV2: 1, DEFAULT: -1 };
  const [markList, setMarkList] = useLocalStorage('markList', [[], []]);
  const [markFilterLevel, setMarkFilterLevel] = useState(DIFFICULTY.DEFAULT);

  // Load dict
  useEffect(() => {
    fetch('/nihongo-card/lib/dict.txt')
      .then((response) => response.text())
      .then((data) => {
        const parsedData = parseToDict(data);
        console.log('dict size', parsedData.length);
        setDict(parsedData);
        setIndex(0);
      })
      .catch((error) => console.error('Error loading dict:', error));
  }, [markFilterLevel]);

  const parseToDict = (data) => {
    const lines = data.split('\n');
    const tempDict = [];

    let tag = '';
    for (const line of lines) {
      if (line === '') continue;
      if (markFilterLevel >= 0 && !markList[markFilterLevel].includes(line)) continue;
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

    if (distance > 50) {
      prevCard();
    } else if (distance < -50) {
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
    setTagIndex(event.target.value);
    setIndex(event.target.value);
  };

  const handleMarkDifficulty = (difficulty) => {
    const key = dict[index].raw;
    const updatedList = markList[difficulty].includes(key)
      ? markList[difficulty].filter(item => item !== key)
      : [...markList[difficulty], key];

    const newMarkList = [...markList];
    newMarkList[difficulty] = updatedList;
    setMarkList(newMarkList);
  };

  const handleMarkFilterChange = (event) => {
    setMarkFilterLevel(event.target.value);
  };

  const getStickerColorCss = () => {
    const key = dict[index].raw;
    if (markList[DIFFICULTY.LV2].includes(key)) return "red";
    if (markList[DIFFICULTY.LV1].includes(key)) return "yellow";
    return ""
  }

  const getTagOptions = () => {
    return dict.map((data, index) => ({ text: data.tag, value: index }))
      .filter(item => !!item.text)
      .map((item) => (
        <option key={item.value} value={item.value}>
          {item.text}
        </option>
      ));
  }


  return (
    <div className='root-container'>
      <div className='card-manager'>
        <select value={tagIndex} onChange={handleTagChange}>
          {getTagOptions()}
        </select>
        <div className='expand'></div>
        <select value={markFilterLevel} onChange={handleMarkFilterChange}>
          <option value={DIFFICULTY.DEFAULT}>-</option>
          <option value={DIFFICULTY.LV1}>☆</option>
          <option value={DIFFICULTY.LV2}>☆☆</option>
        </select>
        <button onClick={handleShowRt}>あ</button>
        <button className='yellow' onClick={() => handleMarkDifficulty(DIFFICULTY.LV1)}>☆</button>
        <button className='red' onClick={() => handleMarkDifficulty(DIFFICULTY.LV2)}>☆☆</button>
      </div>

      <div className='card-container'>
        {dict.length > 0 && (
          <div
            className={`flashcard ${flipped ? 'flipped' : ''}`}
            onClick={handleFlip}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className={`sticker ${getStickerColorCss()}`}></div>
            <div className='front'>
              <div className={`${showRt ? '' : 'no-rt'}`} dangerouslySetInnerHTML={{ __html: dict[index].html }} />
            </div>
            <div className='back'>
              <div dangerouslySetInnerHTML={{ __html: dict[index].html }} />
              <div className='exp'>{dict[index].exp}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}