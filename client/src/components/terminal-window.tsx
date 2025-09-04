import { useEffect, useRef } from 'react';

interface TerminalLine {
  id: string;
  content: string;
  isCommand?: boolean;
  timestamp: number;
}

interface TerminalWindowProps {
  lines: TerminalLine[];
  currentInput: string;
  setCurrentInput: (value: string) => void;
  isTyping: boolean;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  inputRef: React.RefObject<HTMLInputElement>;
}

export function TerminalWindow({
  lines,
  currentInput,
  setCurrentInput,
  isTyping,
  handleKeyDown,
  inputRef,
}: TerminalWindowProps) {
  const outputRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new lines are added
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [lines]);

  // Keep input focused automatically
  useEffect(() => {
    const handleClick = () => {
      if (inputRef.current && !isTyping) {
        inputRef.current.focus();
      }
    };

    const handleBlur = () => {
      if (!isTyping) {
        setTimeout(() => inputRef.current?.focus(), 0);
      }
    };

    const handleFocusLoss = () => {
      if (!isTyping) {
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    };

    // Focus input whenever typing completes
    if (!isTyping && inputRef.current) {
      inputRef.current.focus();
    }

    document.addEventListener('click', handleClick);
    document.addEventListener('focusout', handleFocusLoss);
    inputRef.current?.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('focusout', handleFocusLoss);
      inputRef.current?.removeEventListener('blur', handleBlur);
    };
  }, [inputRef, isTyping]);

  return (
    <div className="h-screen flex flex-col bg-terminal-bg" data-testid="terminal-container">

      {/* Terminal Content */}
      <div 
        ref={outputRef}
        className="flex-1 p-6 overflow-y-auto terminal-scrollbar bg-terminal-bg"
        data-testid="terminal-output"
      >
        {/* Terminal History */}
        <div data-testid="command-history">
          {lines.map((line) => (
            <div
              key={line.id}
              className={`mb-2 text-terminal-text font-mono whitespace-pre-wrap ${
                line.isCommand ? 'text-terminal-text' : ''
              }`}
              dangerouslySetInnerHTML={{ __html: line.content }}
              data-testid={`terminal-line-${line.id}`}
            />
          ))}
        </div>

        {/* Current Command Line */}
        {!isTyping && (
          <div className="flex items-center" data-testid="current-command-line">
            <span className="text-terminal-accent mr-2 font-mono" data-testid="terminal-prompt">
              siddhesh@portfolio:~$
            </span>
            <div className="relative flex-1">
              <input 
                ref={inputRef}
                type="text" 
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="bg-transparent border-none outline-none text-terminal-text font-mono w-full caret-transparent"
                autoComplete="off"
                spellCheck={false}
                data-testid="command-input"
              />
              <span 
                className="terminal-cursor absolute top-0 font-mono pointer-events-none" 
                style={{
                  left: `${currentInput.length * 0.6}em`,
                }}
                data-testid="terminal-cursor"
              >
                █
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
