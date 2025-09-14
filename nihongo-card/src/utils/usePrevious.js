import { useRef, useEffect } from 'react';

const usePrevious = (value, initialValue = undefined) => {
  const ref = useRef(initialValue);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

export default usePrevious;
