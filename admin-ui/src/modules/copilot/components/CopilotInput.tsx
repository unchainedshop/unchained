import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  CameraIcon,
  PaperAirplaneIcon,
  XMarkIcon,
  StopIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import useLocalStorage from '../../common/hooks/useLocalStorage';
import { useChatContext } from '../ChatContext';
const CopilotInput: React.FC = () => {
  const [input, setInput] = useState('');
  const { status, stop, handleSubmit, addInterruptionMessage, reload } =
    useChatContext();
  const [inputHistory, setInputHistory] = useLocalStorage(
    'copilot-input-history',
    [],
  );

  const [historyIndex, setHistoryIndex] = useState(-1);

  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isStopped, setIsStopped] = useState(false);

  useEffect(() => {
    if (status === 'submitted' || status === 'streaming') {
      setIsStopped(false);
    }
  }, [status]);

  const handleStop = () => {
    const currentStatus = status;
    setIsStopped(true);
    stop();
    setTimeout(() => {
      addInterruptionMessage(currentStatus);
    }, 100);
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (input.trim() || imageUrls.length > 0) {
        setInput('');
        setInputHistory((prev) => [...prev, input]);
        setHistoryIndex(-1);
        const imgs = [...imageUrls];
        setImageUrls([]);
        handleSubmit(input as any, imgs);
      }
    } catch (e) {
      // Don't log authentication errors to console as they're handled in the UI
      const errorMessage = e instanceof Error ? e.message : String(e);
      if (
        !errorMessage.includes('401') &&
        !errorMessage.includes('invalid_token')
      ) {
        console.error(e);
      }
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch(
        process.env.NEXT_PUBLIC_TEMP_FILE_UPLOAD_URL || '/temp-upload',
        {
          method: 'POST',
          body: formData,
          credentials: 'include',
        },
      );

      const data = await res.json();
      return data?.url;
    } catch (err) {
      console.error('Upload failed', err);
      return null;
    }
  };
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setUploading(true);

    const files = Array.from(e.target.files);
    const uploadedUrls = await Promise.all(
      files.map((file) => uploadImage(file)),
    );

    setImageUrls((prev) => [
      ...prev,
      ...(uploadedUrls.filter(Boolean) as string[]),
    ]);
    setUploading(false);
  };

  const setInputValue = (value: string) => setInput(value);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      let newIndex = historyIndex;
      if (e.key === 'ArrowUp') {
        newIndex =
          historyIndex === -1
            ? inputHistory.length - 1
            : Math.max(0, historyIndex - 1);
      } else if (e.key === 'ArrowDown') {
        newIndex = historyIndex + 1;
        if (newIndex >= inputHistory.length) {
          newIndex = -1;
        }
      }

      setHistoryIndex(newIndex);
      setInputValue(newIndex === -1 ? '' : inputHistory[newIndex]);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (inputHistory.length > 0) {
        setInputHistory(JSON.stringify(inputHistory.slice(-50)));
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [inputHistory]);

  return (
    <div className="sticky bottom-6 max-w-4xl mx-auto w-full">
      <form
        onSubmit={onSubmit}
        className="bg-white dark:bg-slate-800 shadow-2xl border border-slate-300 dark:border-slate-700 rounded-md p-3"
      >
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="flex-1 border-0 bg-slate-50 dark:bg-slate-700 dark:text-slate-200 dark:placeholder-slate-400 rounded-md px-4 py-2 focus:ring-2 focus:ring-slate-400"
          />
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
            id="image-upload"
          />
          <label
            htmlFor="image-upload"
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer focus:ring-2 focus:ring-sky-300 focus:outline-hidden rounded"
            title="Upload images"
            tabIndex={0}
          >
            <CameraIcon className="h-6 w-6" strokeWidth={2} />
          </label>

          {(status === 'submitted' || status === 'streaming') && !isStopped ? (
            <button
              type="button"
              onClick={handleStop}
              className="p-2 bg-slate-900 dark:bg-slate-700 text-white rounded transition-colors"
              title="Stop generation"
            >
              <StopIcon className="h-6 w-6" strokeWidth={2} />
            </button>
          ) : (
            <>
              <button
                type="submit"
                disabled={!input.trim() && imageUrls.length === 0}
                className="p-2 bg-slate-900 dark:bg-slate-700 text-white hover:bg-slate-800 dark:hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-900 dark:disabled:bg-slate-600 disabled:cursor-not-allowed focus:ring-2 focus:ring-sky-300 focus:outline-hidden rounded transition-colors"
              >
                <PaperAirplaneIcon className="h-6 w-6" strokeWidth={2} />
              </button>
              {(status === 'ready' || isStopped) && (
                <button
                  type="button"
                  onClick={reload}
                  className="p-2 bg-slate-500 dark:bg-slate-600 text-white hover:bg-slate-600 dark:hover:bg-slate-500 rounded transition-colors ml-2"
                  title="Regenerate last response"
                >
                  <ArrowPathIcon className="h-4 w-4" />
                </button>
              )}
            </>
          )}
        </div>

        {uploading && (
          <p className="mt-2 text-sm text-slate-500">Uploading...</p>
        )}

        {imageUrls.length > 0 && (
          <div className="mt-2 flex gap-3 flex-wrap">
            {imageUrls.map((img, i) => (
              <div key={img} className="relative">
                <Image
                  src={img}
                  alt={`Selected ${i}`}
                  width={64}
                  height={64}
                  className="h-16 w-16 object-cover rounded-md"
                />
                <button
                  type="button"
                  onClick={() =>
                    setImageUrls((prev) =>
                      prev.filter((_, index) => index !== i),
                    )
                  }
                  className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                >
                  <XMarkIcon className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>
            ))}
          </div>
        )}
      </form>
    </div>
  );
};

export default CopilotInput;
