import { useState } from 'react';
import { Star } from 'lucide-react';
import './StarRating.scss';

export default function StarRating({ value, onChange, size = 'md' }) {
  const [hovered, setHovered] = useState(null);
  const interactive = typeof onChange === 'function';

  const display = hovered !== null ? hovered : (value || 0);
  const iconSize = size === 'lg' ? 22 : size === 'sm' ? 14 : 18;

  return (
    <div className={`star-rating star-rating--${size}`}>
      {[1, 2, 3, 4, 5].map(star => (
        <span
          key={star}
          className={[
            'star-rating__star',
            star <= display ? 'star-rating__star--filled' : '',
            interactive ? 'star-rating__star--interactive' : '',
          ].filter(Boolean).join(' ')}
          onClick={() => interactive && onChange(star)}
          onMouseEnter={() => interactive && setHovered(star)}
          onMouseLeave={() => interactive && setHovered(null)}
        >
          <Star
            size={iconSize}
            fill={star <= display ? 'currentColor' : 'none'}
            strokeWidth={1.5}
          />
        </span>
      ))}
    </div>
  );
}
