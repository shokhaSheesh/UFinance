"use client"

import { useEffect, useRef, useState } from 'react';
import { HiOutlinePause } from "react-icons/hi2";

const MIN_GAP = 0; // ← was 5. Set to 0 to let thumbs touch, or 0.5 for a hair of separation

const CustomMonthSlider = ({ value, onChange }) => {
  const [activeThumb, setActiveThumb] = useState(null);
  const trackRef = useRef(null);

  useEffect(() => {
    const handlePointerMove = (e) => {
      if (activeThumb && trackRef.current) {
        const rect = trackRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const percent = (x / rect.width) * 100;

        const newValue = [...value];
        if (activeThumb === 'start') {
          newValue[0] = Math.min(percent, value[1] - MIN_GAP);
        } else {
          newValue[1] = Math.max(percent, value[0] + MIN_GAP);
        }
        onChange(newValue);
      }
    };

    const handlePointerUp = () => setActiveThumb(null);

    if (activeThumb) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [activeThumb, value, onChange]);

  const handleThumbDown = (e, thumb) => {
    e.stopPropagation();
    setActiveThumb(thumb);
  };

  const handleTrackDown = (e) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width * 100;

    const distStart = Math.abs(x - value[0]);
    const distEnd = Math.abs(x - value[1]);
    const thumb = distStart < distEnd ? 'start' : 'end';

    const newValue = [...value];
    if (thumb === 'start') {
      newValue[0] = Math.min(x, value[1] - MIN_GAP);
    } else {
      newValue[1] = Math.max(x, value[0] + MIN_GAP);
    }
    onChange(newValue);
    setActiveThumb(thumb);
  };

  return (
    <div
      ref={trackRef}
      className="relative w-full overflow-visible! h-3 bg-gray-ucode-25 border border-neutral-200 rounded-full cursor-pointer select-none group"
      onPointerDown={handleTrackDown}
    >
      <div
        className="absolute h-3 rounded-full"
        style={{ left: `${value[0]}%`, right: `${100 - value[1]}%`, backgroundColor: '#B4B4B4' }}
      />
      {/* Left Thumb */}
      <div
        className="absolute top-1/2 overflow-visible! -translate-y-1/2 -ml-[12px] w-8 h-8 rounded-full shadow-sm flex items-center justify-center cursor-grab transition-shadow hover:shadow-lg text-white"
        style={{
          left: `${value[0]}%`,
          backgroundColor: '#B4B4B4',
          zIndex: activeThumb === 'start' ? 30 : 20, // ← active thumb on top
        }}
        onPointerDown={(e) => handleThumbDown(e, 'start')}
      >
        <HiOutlinePause className="size-4 text-black" />
      </div>
      {/* Right Thumb */}
      <div
        className="absolute top-1/2 overflow-visible! -translate-y-1/2 -ml-[12px] w-8 h-8 rounded-full shadow-sm flex items-center justify-center cursor-grab active:cursor-grabbing transition-shadow hover:shadow-lg text-white"
        style={{
          left: `${value[1]}%`,
          backgroundColor: '#B4B4B4',
          zIndex: activeThumb === 'end' ? 30 : 20,
        }}
        onPointerDown={(e) => handleThumbDown(e, 'end')}
      >
        <HiOutlinePause className="size-4 text-black" />
      </div>
    </div>
  );
};

export default CustomMonthSlider;