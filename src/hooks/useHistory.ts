import { useState, useEffect } from 'react';

export interface HistoryItem {
  id: string;
  toolSlug: string;
  input: string;
  output: string;
  timestamp: number;
}

export const useHistory = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('toolOcean.history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load history:', error);
      }
    }
  }, []);

  const addToHistory = (toolSlug: string, input: string, output: string) => {
    const item: HistoryItem = {
      id: Date.now().toString(),
      toolSlug,
      input,
      output,
      timestamp: Date.now()
    };

    const newHistory = [item, ...history].slice(0, 100); // Keep last 100 items
    setHistory(newHistory);
    localStorage.setItem('toolOcean.history', JSON.stringify(newHistory));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('toolOcean.history');
  };

  return { history, addToHistory, clearHistory };
};