import React, { useState, useEffect, useRef } from 'react';
import useLocalStorage from "../../utils/useLocalStorage";
import * as yaml from 'js-yaml';
import './style.css';

export default function FlashCard() {
  const [dict, setDict] = useState([]);
  const [index, setIndex] = useState(0);
  const [tagIndex, setTagIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [startX, setStartX] = useState(0); // Use this to follow up touching
  const [markList, setMarkList] = useLocalStorage("markList", [[],[]]);
  const filterValue = useRef(-1);

  // Load dict
  useEffect(() => {
    fetch('/nihongo-card/lib/dict.txt')
      .then((response) => response.text())
      .then((data) => {
        const parsedData = parseToDict(data);
        setDict(parsedData);
      })
      .catch((error) => console.error("Error loading dict:", error));
  }, []);
  
  const parseToDict = (data) => {
    const lines = data.split('\n');
    const tempDict = [];

    let tag = '';
    for (const line of lines) {
      if (line === '') continue;
      if (line.includes('**')) { // to tag in next card
        tag = line.replaceAll('*', '');
        continue;
      }

      const wordAndExp = line.split(":");
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
      tempDict.push({ html, exp, tag });

      tag = '';
    }

    return tempDict;
  }

  const handleFlip = () => setFlipped((prev) => !prev);

  const nextCard = () => {
    setIndex((prev) => {
      let newIndex = prev;
      for (let i = 0; i < dict.length; i++) {
        newIndex = (newIndex + 1) % dict.length;
        if (filterValue.current < 0 || markList[filterValue.current].includes(dict[newIndex])) {
          return newIndex;
        }
      }

      return prev;
    });
    setFlipped(false);
  }

  const prevCard = () => {
    setIndex((prev) => {
      let newIndex = prev;
      for (let i = 0; i < dict.length; i++) {
        newIndex = (newIndex - 1 + dict.length) % dict.length;
        if (filterValue.current < 0 || markList[filterValue.current].includes(dict[newIndex])) {
          return newIndex;
        }
      }

      return prev;
    });
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
      if (e.key === "ArrowRight") {
        nextCard();
      } else if (e.key === "ArrowLeft") {
        prevCard();
      } else if (e.key === "Enter" || e.key === ' ') {
        handleFlip();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dict]);

  const handleTagChange = (event) => {
    setTagIndex(event.target.value);
    setIndex(event.target.value);
  };

  const handleFilterChange = (event) => {
    filterValue.current = Number(event.target.value);
  };

  const handleMarkDifficulty = (difficulty) => {
    const updatedList = markList[difficulty].includes(index)
      ? markList[difficulty].filter(item => item !== index)
      : [...markList[difficulty], index]; 

    const newMarkList = [...markList];
    newMarkList[difficulty] = updatedList;
    setMarkList(newMarkList);
  };

  return (
    <div>
      <div className="card-manager">
        Go to:
        <select value={tagIndex} onChange={handleTagChange}>
          {dict.map((data, index) => ({ text: data.tag, value: index }))
            .filter(item => !!item.text)
            .map((item) => (
              <option key={item.value} value={item.value}>
                {item.text}
              </option>
          ))}
        </select>
        Select note:
        <select value={filterValue} onChange={handleFilterChange}>
          <option value="-1">-</option>
          <option value="0">☆</option>
          <option value="1">☆☆</option>
        </select>
        <button onClick={() => handleMarkDifficulty(0)}>☆</button>
        <button onClick={() => handleMarkDifficulty(1)}>☆☆</button>
      </div>

      <div className="card-container">
          {dict.length > 0 && (
            <div
              className={`flashcard ${flipped ? 'flipped' : ''}`}
              onClick={handleFlip}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <div className="front">
                <div dangerouslySetInnerHTML={{ __html: dict[index].html}} />
              </div>
              <div className="back">
                <div className="no-rt" dangerouslySetInnerHTML={{ __html: dict[index].html}} />
                <div className="exp">{dict[index].exp}</div>
              </div>
            </div>
          )}
        </div>
    </div>
 
  );
}