import { useState } from "react";

const useLocalStorage = (key, initialValue) => {
  const storedValue = localStorage.getItem(key);
  const parsedValue = storedValue ? JSON.parse(storedValue) : initialValue;

  const [value, setValue] = useState(parsedValue);

  const setStoredValue = (newValue) => {
    const valueToStore =
      typeof newValue === "function"
        ? newValue(value)
        : newValue;

    setValue(valueToStore);
    localStorage.setItem(key, JSON.stringify(valueToStore));
  };

  return [value, setStoredValue];
}

export default useLocalStorage;
