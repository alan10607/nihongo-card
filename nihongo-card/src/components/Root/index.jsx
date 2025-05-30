import React, { useState, useEffect } from 'react';
import useLocalStorage from '../../utils/useLocalStorage';
import './style.css';

export default function FlashCard() {
  const DIFFICULTY = { LV1: 1, LV2: 2, DEFAULT: -1 };
  const [rawData, setRawData] = useState('');
  const [cards, setCards] = useState([]);
  const [tags, setTags] = useState([]);
  const [index, setIndex] = useState(0);
  const [tagIndex, setTagIndex] = useState(0);
  const [startX, setStartX] = useState(0); // Use this to follow up touching
  const [flipped, setFlipped] = useState(false);
  const [showRt, setShowRt] = useState(false);
  const [markLevel, setMarkLevel] = useState(DIFFICULTY.DEFAULT);
  const [markList, setMarkList] = useLocalStorage('markDict', {});
  const [searchValue, setSearchValue] = useState('');
  const [searchIndex, setSearchIndex] = useState(0);

  // Load dict
  useEffect(() => {
    fetch('/nihongo-card/lib/dict.txt', {
      method: 'GET',
      cache: 'no-store'  // prevent cache
    }).then(response => response.text())
      .then(setRawData)
      .catch((error) => console.error('Error loading dict:', error));
  }, []);

  useEffect(() => {
    if (!rawData) return;

    const { cards, tags } = parseLinesToCardsAndTags(rawData, markLevel, markList);
    console.log('Cards size:', cards.length);
    setCards(cards);
    setTags(tags);
    setIndex(0);
    setTagIndex(0);
    setFlipped(false);
  }, [rawData, markLevel]);

  const parseLinesToCardsAndTags = (data, markLevel, markList) => {
    return data.split('\n')
      .map(line => line.trim())
      .filter(line => line !== '')
      .filter(line => isInMarkLevel(line, markLevel, markList))
      .reduce(reduceLines, { cards: [], tags: [] });
  };

  const isInMarkLevel = (key, markLevel, markList) => {
    if (markLevel === DIFFICULTY.DEFAULT) return true;
    if (!markList[key]) return false;
    return markList[key] >= markLevel;
  };

  const reduceLines = (acc, line, i) => {
    const nextIndex = acc.cards.length;
    if (line.includes('**')) {
      acc.tags.push({
        text: line.replaceAll('*', ''),
        value: nextIndex
      });
    } else {
      const [word, exp = ''] = line.split(':');
      acc.cards.push({
        index: nextIndex,
        word,
        exp,
        raw: line
      });
    }
    return acc;
  };

  const parseRubyJSX = (word) => {
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
  }


  const toggleFlipped = () => setFlipped((prev) => !prev);
  const toggleShowRt = () => setShowRt((prev) => !prev);

  const goNext = () => {
    setIndex((prev) => (prev + 1) % cards.length);
    setFlipped(false);
  };

  const goPrev = () => {
    setIndex((prev) => (prev - 1 + cards.length) % cards.length);
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
      goPrev();
    } else if (distance < -30) {
      goNext();
    }
  };

  // Keyboard listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        goNext();
      } else if (e.key === 'ArrowLeft') {
        goPrev();
      } else if (e.key === 'Enter' || e.key === ' ') {
        toggleFlipped();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cards]);

  const getTagOptions = () => {
    return tags.map((tag, index) => (
      <option key={tag.value} value={tag.value}>
        {tag.text}
      </option>
    ))
  };

  const handleTagChange = (event) => {
    const nextIndex = Number(event.target.value);
    setTagIndex(nextIndex);
    setIndex(nextIndex);
    setFlipped(false);
  };

  const handleMarkFilterChange = (event) => {
    setMarkLevel(Number(event.target.value));
  };

  const handleMarkDifficulty = (difficulty) => {
    if (cards.length === 0) return;
    const key = cards[index].raw;
    setMarkList(updateMarkList(markList, key, difficulty));
  };

  const updateMarkList = (markList, key, difficulty) => {
    if (markList[key] === difficulty) {
      const { [key]: _, ...rest } = markList;
      return rest;
    } else {
      return { ...markList, [key]: difficulty };
    }
  };

  const getStickerColorCss = () => {
    const key = cards[index].raw;
    if (markList[key] === DIFFICULTY.LV1) return 'yellow';
    if (markList[key] === DIFFICULTY.LV2) return 'red';
    return ''
  };

  const handleSearchValueChange = (event) => {
    const target = event.target.value.trim();
    setSearchValue(target);

    if (target !== '') {
      const firstFound = cards.find(card => card.word.includes(target));
      if (firstFound) {
        setIndex(firstFound.index);
        setSearchIndex(firstFound.index);
      }
    } else {
      setSearchIndex(0);
    }
  };

  const getSearchOption = (cards, target = '') => {
    return cards.filter(card => card.word.includes(target))
      .map(card => (
        <option key={card.index} value={card.index}>
          {card.raw}
        </option>
      ));
  };

  const handleSearchOptionChange = (event) => {
    const nextIndex = Number(event.target.value);

    setIndex(nextIndex);
    setSearchIndex(nextIndex);
    setFlipped(false);
  };


  return (
    <div className='root-container'>
      <div className='card-manager'>
        <select value={tagIndex} onChange={handleTagChange}>
          {getTagOptions()}
        </select>
        <select value={markLevel} onChange={handleMarkFilterChange}>
          <option value={DIFFICULTY.DEFAULT}>-</option>
          <option value={DIFFICULTY.LV1}>☆</option>
          <option value={DIFFICULTY.LV2}>☆☆</option>
        </select>
        <button className={showRt ? 'selected' : ''} onClick={toggleShowRt}>あ</button>
        <button className='yellow' onClick={() => handleMarkDifficulty(DIFFICULTY.LV1)}>☆</button>
        <button className='red' onClick={() => handleMarkDifficulty(DIFFICULTY.LV2)}>☆☆</button>
      </div>

      <div className='card-manager'>
        <input
          type='text'
          value={searchValue}
          onChange={handleSearchValueChange}
          placeholder='Search'
        />
        <select className='search-selector' value={searchIndex} onChange={handleSearchOptionChange}>
          {getSearchOption(cards, searchValue)}
        </select>
      </div>

      {cards.length > 0 && (
        <div className='card-container'>
          <button onClick={goPrev}>{'<'}</button>
          <div
            className={`flashcard ${flipped ? 'flipped' : ''}`}
            onClick={toggleFlipped}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className={`sticker ${getStickerColorCss()}`}></div>
            <div className='front'>
              <div className={showRt ? '' : 'no-rt'}>{parseRubyJSX(cards[index].word)}</div>
            </div>
            <div className='back'>
              <div>{parseRubyJSX(cards[index].word)}</div>
              <div className='exp'>{cards[index].exp}</div>
            </div>
          </div>
          <button onClick={goNext}>{'>'}</button>
        </div>
      )}

      <div className='card-foot'>
        <div className='expand'></div>
        <div className='tooltip'>{index + 1}</div>
      </div>
    </div>
  );
}
