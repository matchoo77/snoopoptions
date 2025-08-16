import React, { useState } from 'react';
import { Star, MessageSquare } from 'lucide-react';

interface FavoriteButtonProps {
  activityId: string;
  isFavorite: boolean;
  note: string;
  onToggleFavorite: (activityId: string, note?: string) => void;
  onUpdateNote: (activityId: string, note: string) => void;
}

export function FavoriteButton({ 
  activityId, 
  isFavorite, 
  note, 
  onToggleFavorite, 
  onUpdateNote 
}: FavoriteButtonProps) {
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteValue, setNoteValue] = useState(note);

  const handleToggleFavorite = () => {
    if (!isFavorite) {
      setShowNoteInput(true);
    } else {
      onToggleFavorite(activityId);
    }
  };

  const handleSaveNote = () => {
    onToggleFavorite(activityId, noteValue);
    setShowNoteInput(false);
  };

  const handleUpdateNote = () => {
    onUpdateNote(activityId, noteValue);
    setShowNoteInput(false);
  };

  const handleCancel = () => {
    setNoteValue(note);
    setShowNoteInput(false);
  };

  if (showNoteInput) {
    return (
      <div className="flex flex-col gap-2 p-2 bg-gray-50 rounded border">
        <textarea
          value={noteValue}
          onChange={(e) => setNoteValue(e.target.value)}
          placeholder="Add a note about this alert..."
          className="w-full px-2 py-1 text-xs border border-gray-300 rounded resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
          rows={2}
          autoFocus
        />
        <div className="flex gap-1">
          <button
            onClick={isFavorite ? handleUpdateNote : handleSaveNote}
            className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save
          </button>
          <button
            onClick={handleCancel}
            className="px-2 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={handleToggleFavorite}
        className={`p-1 rounded transition-colors ${
          isFavorite
            ? 'text-yellow-500 hover:text-yellow-600'
            : 'text-gray-400 hover:text-yellow-500'
        }`}
        title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        <Star className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
      </button>
      
      {isFavorite && (
        <button
          onClick={() => setShowNoteInput(true)}
          className="p-1 rounded text-gray-400 hover:text-blue-500 transition-colors"
          title={note ? 'Edit note' : 'Add note'}
        >
          <MessageSquare className={`w-4 h-4 ${note ? 'fill-current text-blue-500' : ''}`} />
        </button>
      )}
    </div>
  );
}