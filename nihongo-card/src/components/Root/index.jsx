import React, { useState, useEffect } from 'react';
import * as yaml from 'js-yaml';
import './style.css';

class Word {
  constructor() {
    this.textAndRt = [];
  }

  pushText(text, spell = '') {
    this.textAndRt.push({ text, spell });
  }

  getText() {
    return this.textAndRt.map(item => `<ruby>${item.text}</ruby>`).join(' ');
  }

  getTextAndRt() {
    return this.textAndRt.map(item => `<ruby>${item.text}<rt>${item.spell}</rt></ruby>`).join(' ')
  }
}

export default function FlashCard() {
  const [dict, setDict] = useState([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [startX, setStartX] = useState(0); // Use this to follow up touching
  const [text, setText] = useState('');
  const [textAndRt, setTextAndRt] = useState('');
  const [exp, setExp] = useState('');

  // Load dict
  useEffect(() => {
    fetch('/nihongo-card/lib/dict.yaml')
      .then((response) => response.text())
      .then((data) => {
        const parsedData = yaml.load(data);
        setDict(parsedData);
      })
      .catch((error) => console.error("Error loading YAML:", error));
  }, []);

  const handleFlip = () => setFlipped((prev) => !prev);

  const nextCard = () => {
    setIndex((prev) => (prev + 1) % dict.length);
    setFlipped(false);
  }

  const prevCard = () => {
    setIndex((prev) => (prev - 1 + dict.length) % dict.length);
    setFlipped(false);
  }

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

  useEffect(() => {
    if (dict.length === 0) return;

    const words = dict[index].word.split(' ');
    const tempWordData = new Word();

    for (const word of words) {
      if (word.includes('(') && word.includes(')')) {
        const openParenIndex = word.indexOf('(');
        const closeParenIndex = word.indexOf(')');
  
        const mainWord = word.substring(0, openParenIndex);
        const pronunciation = word.substring(openParenIndex + 1, closeParenIndex);
        const remained = word.substring(closeParenIndex + 1);

        tempWordData.pushText(mainWord, pronunciation);
        if (remained) {
          remained.split('').forEach((w) => {
            tempWordData.pushText(w); 
          });
        }
      } else {
        word.split('').forEach((w) => {
          tempWordData.pushText(w); 
        });
      }
    }

    setText(tempWordData.getText());
    setTextAndRt(tempWordData.getTextAndRt());
    setExp(dict[index].exp ? dict[index].exp : '');
  }, [dict, index]);


  return (
    <div className="card-container">
      {dict.length > 0 && (
        <div
          className={`flashcard ${flipped ? 'flipped' : ''}`}
          onClick={handleFlip}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="front">
            <div dangerouslySetInnerHTML={{ __html: text}} />
          </div>
          <div className="back">
            <div dangerouslySetInnerHTML={{ __html: textAndRt}} />

            <div className="exp">{exp}</div>
          </div>
        </div>
      )}
    </div>
  );
}
