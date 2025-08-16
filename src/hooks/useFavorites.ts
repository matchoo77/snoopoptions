import { useState, useEffect } from 'react';
import { FavoriteAlert } from '../types/options';

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteAlert[]>([]);

  // Load favorites from localStorage on mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem('optionsScanner_favorites');
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (error) {
        console.error('Error loading favorites:', error);
      }
    }
  }, []);

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('optionsScanner_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const addToFavorites = (activityId: string, note?: string) => {
    const newFavorite: FavoriteAlert = {
      id: `fav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      activityId,
      timestamp: new Date().toISOString(),
      note,
    };
    setFavorites(prev => [...prev, newFavorite]);
  };

  const removeFromFavorites = (activityId: string) => {
    setFavorites(prev => prev.filter(fav => fav.activityId !== activityId));
  };

  const isFavorite = (activityId: string) => {
    return favorites.some(fav => fav.activityId === activityId);
  };

  const getFavoriteNote = (activityId: string) => {
    const favorite = favorites.find(fav => fav.activityId === activityId);
    return favorite?.note || '';
  };

  const updateFavoriteNote = (activityId: string, note: string) => {
    setFavorites(prev => prev.map(fav => 
      fav.activityId === activityId ? { ...fav, note } : fav
    ));
  };

  return {
    favorites,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    getFavoriteNote,
    updateFavoriteNote,
  };
}