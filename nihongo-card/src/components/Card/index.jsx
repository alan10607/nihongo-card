import React, { useState, useEffect } from 'react';
import useLocalStorage from '../../utils/useLocalStorage';
import useOpenNewTab from '../../utils/useOpenNewTab';
import './style.css';

export default function FlashCard() {
  const DIFFICULTY = { LV1: 1, LV2: 2, DEFAULT: -1 };
  const [originalCards, setOriginalCards] = useState([]);
  const [cards, setCards] = useState([]);
  const [index, setIndex] = useState(0);
  const [tags, setTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState('');
  const [cardDifficultyMap, setCardDifficultyMap] = useLocalStorage('markDict', {});
  const [selectedDifficulty, setSelectedDifficulty] = useState(DIFFICULTY.DEFAULT);
  const [searchValue, setSearchValue] = useState('');
  const [startX, setStartX] = useState(0); // Use this to follow up touching
  const [flipped, setFlipped] = useState(false);
  const [showRt, setShowRt] = useState(false);
  const openNewTab = useOpenNewTab();

  // Load dict
  useEffect(() => {
    fetch('/nihongo-card/lib/dict.txt', {
      method: 'GET',
      cache: 'no-store'  // prevent cache
    }).then(response => response.text())
      .then(setup)
      .catch((error) => console.error('Error loading dict:', error));
  }, []);

  const setup = (rawData) => {
    const { cards, tags } = parseLinesToCardsAndTags(rawData);
    console.log('Cards size:', cards.length);
    setOriginalCards(cards);
    setTags(tags);
  };

  const parseLinesToCardsAndTags = (data) => {
    return data.split('\n')
      .map(line => line.trim())
      .filter(line => line !== '')
      .reduce(reduceLines, { cards: [], tags: [] });
  };

  const reduceLines = (acc, line, i) => {
    const id = acc.cards.length;
    const tag = acc.tags.length > 0 ? acc.tags[acc.tags.length - 1] : null;
    if (line.includes('**')) {
      const nextTag = line.replaceAll('*', '');
      acc.tags.push(nextTag);
    } else {
      const [word, exp = ''] = line.split(':');
      const kanas = (word.match(/\((.*?)\)/g) || [])
        .map(k => k.replace(/[()]/g, ''));
      const tango = word.replace(/\(.*?\)/g, '')
        .replace(/[<>]/g, '');

      acc.cards.push({
        id,
        tag,
        word,
        exp,
        tango,
        kanas,
        raw: line
      });
    }
    return acc;
  };

  // Card filter
  useEffect(() => {
    const filteredCards = originalCards
      .filter(card => matchesDifficulty(card.raw, selectedDifficulty, cardDifficultyMap))
      .filter(card => matchSearchValue(card, searchValue));

      setCards(filteredCards);
      setSelectedTag('');

      if (cards.length === 0 || searchValue !== '') {
        return setIndex(0);
      }

      const currentCardId = cards[index].id;
      const nextCardIndex = filteredCards.findIndex(card => card.id === currentCardId);
      if (nextCardIndex === -1 ) {
        setIndex(0);
      } else {
        setIndex(nextCardIndex);
      }

  }, [originalCards, selectedDifficulty, cardDifficultyMap, searchValue]);

  const matchesDifficulty = (key, selectedDifficulty, cardDifficultyMap) => {
    if (selectedDifficulty === DIFFICULTY.DEFAULT) return true;
    if (!cardDifficultyMap[key]) return false;
    return cardDifficultyMap[key] >= selectedDifficulty;
  };

  const matchSearchValue = (card, searchValue) => {
    if (!searchValue) return true;
    return card.tango.includes(searchValue) || card.kanas.some(kana => kana.includes(searchValue));
  };


  useEffect(() => {
    setFlipped(false);
  }, [index]);

  const toggleFlipped = () => setFlipped((prev) => !prev);
  const toggleShowRt = () => setShowRt((prev) => !prev);

  const goNext = () => {
    setIndex((prev) => (prev + 1) % cards.length);
  };

  const goPrev = () => {
    setIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };

  const copyCard = async () => {
    const copyValue = (flipped || showRt) ? cards[index].word : cards[index].tango
    await navigator.clipboard.writeText(copyValue);
  }

  const handleOpenDict = () => {
    openNewTab('/nihongo-card/#/raw');
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
  }


  const renderTagOptions = () => {
    return tags.map(tag => (
      <option key={tag} value={tag}>
        {tag}
      </option>
    ))
  };

  const handleSelectedTagChange = (event) => {
    const selectedTag = event.target.value;
    setSelectedTag(selectedTag);
    if (selectedTag !== '') {
      const firstMatchIndex = cards.findIndex(card => card.tag === selectedTag);
      setIndex(firstMatchIndex == -1 ? 0 : firstMatchIndex);
    }
  };

  const handleSelectedDifficultyChange = (event) => {
    setSelectedDifficulty(Number(event.target.value));
  };

  const handleCardDifficulty = (difficulty) => {
    if (cards.length === 0) return;
    const key = cards[index].raw;
    setCardDifficultyMap(updateDifficultyMap(cardDifficultyMap, key, difficulty));
  };

  const updateDifficultyMap = (cardDifficultyMap, key, difficulty) => {
    if (cardDifficultyMap[key] === difficulty) {
      const { [key]: _, ...rest } = cardDifficultyMap;
      return rest;
    } else {
      return { ...cardDifficultyMap, [key]: difficulty };
    }
  };

  const getStickerColorCss = () => {
    const key = cards[index].raw;
    if (cardDifficultyMap[key] === DIFFICULTY.LV1) return 'yellow';
    if (cardDifficultyMap[key] === DIFFICULTY.LV2) return 'red';
    return ''
  };

  const handleSearchValueChange = (event) => {
    setSearchValue(event.target.value.trim());
  };

  const renderCardsOption = () => {
    return cards.map((card, index) => (
        <option key={index} value={index}>
          {card.raw}
        </option>
      ));
  };

  const handleSelectedCardsChange = (event) => {
    setIndex(Number(event.target.value));
  };


  return (
    <div className='root-container'>
      <div className='card-manager'>
        <select value={selectedTag} onChange={handleSelectedTagChange}>
          {renderTagOptions()}
        </select>
        <button className={showRt ? 'selected' : ''} onClick={toggleShowRt}>あ</button>
        <select value={selectedDifficulty} onChange={handleSelectedDifficultyChange}>
          <option value={DIFFICULTY.DEFAULT}>-</option>
          <option value={DIFFICULTY.LV1}>☆</option>
          <option value={DIFFICULTY.LV2}>☆☆</option>
        </select>
        <button className='yellow' onClick={() => handleCardDifficulty(DIFFICULTY.LV1)}>☆</button>
        <button className='red' onClick={() => handleCardDifficulty(DIFFICULTY.LV2)}>☆☆</button>
      </div>

      <div className='card-manager'>
        <input
          type='text'
          value={searchValue}
          onChange={handleSearchValueChange}
          placeholder='Search'
        />
        <select className='search-selector' value={index} onChange={handleSelectedCardsChange}>
          {renderCardsOption(cards, searchValue)}
        </select>
        <button onClick={copyCard}>📋</button>
        <button onClick={handleOpenDict}>📖</button>
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
              <div className={showRt ? '' : 'no-rt'}>{renderRubyJSX(cards[index].word)}</div>
            </div>
            <div className='back'>
              <div>{renderRubyJSX(cards[index].word)}</div>
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

