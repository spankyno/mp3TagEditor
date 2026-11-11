import React, { useRef, useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  Music,
  X,
} from 'lucide-react';
import type { MP3FileItem } from '../types/mp3';
import { formatDuration } from '../utils/formatters';
import { useI18n } from '../i18n';

interface AudioPlayerProps {
  currentTrack: MP3FileItem | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  currentTrack,
  isPlaying,
  onTogglePlay,
  onNext,
  onPrev,
  onClose,
}) => {
  const { t } = useI18n();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);

  // Sync audio source
  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;

    if (audioRef.current.src !== currentTrack.audioUrl) {
      audioRef.current.src = currentTrack.audioUrl;
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
    }

    if (isPlaying) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [currentTrack, isPlaying]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.duration && !isNaN(audioRef.current.duration)) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume || 0.8;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  if (!currentTrack) return null;

  const totalTime = duration || currentTrack.duration || 0;

  return (
    <div role="region" aria-label={t('player.label')} className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-lg px-4 py-2.5 transition-colors">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={onNext}
        onLoadedMetadata={handleTimeUpdate}
      />

      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Track Info */}
        <div className="flex items-center gap-3 min-w-0 max-w-[240px] sm:max-w-xs">
          <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
            {currentTrack.tags.picture?.url ? (
              <img
                src={currentTrack.tags.picture.url}
                alt=""
                width={40}
                height={40}
                decoding="async"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                <Music aria-hidden="true" className="w-5 h-5" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <span className="text-xs font-semibold text-slate-900 dark:text-white truncate block">
              {currentTrack.tags.title || currentTrack.currentFileName}
            </span>
            <span className="text-[11px] text-slate-600 dark:text-slate-400 truncate block">
              {currentTrack.tags.artist || t('player.unknownArtist')}
            </span>
          </div>
        </div>

        {/* Center Controls & Progress Bar */}
        <div className="flex-1 max-w-xl flex flex-col items-center gap-1">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onPrev}
              className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              title={t('player.prev')}
              aria-label={t('player.prev')}
            >
              <SkipBack aria-hidden="true" className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onTogglePlay}
              className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 shadow-2xs transition-transform active:scale-95"
              title={isPlaying ? t('list.pause') : t('list.play')}
              aria-label={isPlaying ? t('list.pause') : t('list.play')}
            >
              {isPlaying ? <Pause aria-hidden="true" className="w-4 h-4 fill-current" /> : <Play aria-hidden="true" className="w-4 h-4 fill-current ml-0.5" />}
            </button>

            <button
              type="button"
              onClick={onNext}
              className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              title={t('player.next')}
              aria-label={t('player.next')}
            >
              <SkipForward aria-hidden="true" className="w-4 h-4" />
            </button>
          </div>

          <div className="w-full flex items-center gap-2 text-[11px] font-mono tabular-nums text-slate-600 dark:text-slate-400">
            <span className="w-8 text-right">{formatDuration(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={totalTime || 100}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              aria-label={t('player.seek')}
              aria-valuetext={`${formatDuration(currentTime)} / ${formatDuration(totalTime)}`}
              className="flex-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <span className="w-8">{formatDuration(totalTime)}</span>
          </div>
        </div>

        {/* Volume & Close */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-2">
            <button
              type="button"
              onClick={toggleMute}
              className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
              title={isMuted ? t('player.unmute') : t('player.mute')}
              aria-label={isMuted ? t('player.unmute') : t('player.mute')}
            >
              {isMuted || volume === 0 ? <VolumeX aria-hidden="true" className="w-4 h-4" /> : <Volume2 aria-hidden="true" className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              aria-label={t('player.volume')}
              className="w-16 h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title={t('player.close')}
            aria-label={t('player.close')}
          >
            <X aria-hidden="true" className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
