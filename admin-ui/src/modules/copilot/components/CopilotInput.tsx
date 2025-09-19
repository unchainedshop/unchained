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
        const trimmedInput = input.trim();
        setInput('');
        if (
          trimmedInput &&
          (inputHistory.length === 0 ||
            inputHistory[inputHistory.length - 1] !== trimmedInput)
        ) {
          setInputHistory((prev) => [...prev, trimmedInput]);
        }
        const imgs = [...imageUrls];
        setImageUrls([]);
        handleSubmit(input as any, imgs);
      }
    } catch (e) {
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() || imageUrls.length > 0) {
        const form = e.currentTarget.closest('form');
        form?.requestSubmit();
      }
      return;
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (inputHistory.length > 0) {
        localStorage.setItem(
          'copilot-input-history',
          JSON.stringify(inputHistory.slice(-50)),
        );
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [inputHistory, setInputHistory]);

  useEffect(() => {
    if (input === '') {
      const textarea = document.getElementById(
        'copilot-input',
      ) as HTMLTextAreaElement;
      if (textarea) {
        textarea.style.height = '20px';
      }
    }
  }, [input]);

  return (
    <div className="sticky bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <form onSubmit={onSubmit} className="relative">
          <div className="flex items-end bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 focus-within:border-gray-400 dark:focus-within:border-gray-500">
            {imageUrls.length > 0 && (
              <div className="p-3 pb-0">
                <div className="flex gap-2 flex-wrap">
                  {imageUrls.map((img, i) => (
                    <div key={img} className="relative">
                      <Image
                        src={img}
                        alt={`Selected ${i}`}
                        width={48}
                        height={48}
                        className="h-12 w-12 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setImageUrls((prev) =>
                            prev.filter((_, index) => index !== i),
                          )
                        }
                        className="absolute -top-1 -right-1 bg-gray-600 hover:bg-gray-700 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs transition-colors"
                      >
                        <XMarkIcon className="h-3 w-3" strokeWidth={2} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex-1 flex items-center min-h-12">
              <div className="flex-1 px-3">
                <textarea
                  value={input}
                  id="copilot-input"
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Message Copilot..."
                  className="w-full border-0 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-0 focus:outline-none resize-none text-base leading-5 overflow-hidden py-1"
                  rows={1}
                  style={{
                    height: '20px',
                    minHeight: '20px',
                    maxHeight: '120px',
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = '20px';
                    const scrollHeight = target.scrollHeight;
                    target.style.height = Math.min(scrollHeight, 120) + 'px';
                    if (scrollHeight > 120) {
                      target.style.overflowY = 'auto';
                    } else {
                      target.style.overflowY = 'hidden';
                    }
                  }}
                />
              </div>

              <div className="flex items-center gap-1 p-2">
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
                  className="flex items-center justify-center w-8 h-8 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all duration-200"
                  title="Attach images"
                  tabIndex={0}
                >
                  <CameraIcon className="h-5 w-5" strokeWidth={1.5} />
                </label>

                {(status === 'ready' || isStopped) && (
                  <button
                    type="button"
                    onClick={reload}
                    className="flex items-center justify-center w-8 h-8 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all duration-200"
                    title="Regenerate last response"
                  >
                    <ArrowPathIcon className="h-5 w-5" strokeWidth={1.5} />
                  </button>
                )}

                {(status === 'submitted' || status === 'streaming') &&
                !isStopped ? (
                  <button
                    type="button"
                    onClick={handleStop}
                    className="flex items-center justify-center w-8 h-8 bg-gray-600 dark:bg-gray-700 text-white hover:bg-gray-700 dark:hover:bg-gray-600 rounded-full transition-all duration-200"
                    title="Stop generation"
                  >
                    <StopIcon className="h-5 w-5" strokeWidth={1.5} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!input.trim() && imageUrls.length === 0}
                    className="flex items-center justify-center w-8 h-8 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed rounded-full transition-all duration-200"
                    title="Send message"
                  >
                    <PaperAirplaneIcon className="h-5 w-5" strokeWidth={1.5} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {uploading && (
            <div className="mt-2 px-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Uploading images...
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default CopilotInput;
