import { useEffect } from 'react';
import { useTerminal } from '@/hooks/use-terminal';
import { TerminalWindow } from '@/components/terminal-window';

export default function Terminal() {
  const {
    lines,
    currentInput,
    setCurrentInput,
    isTyping,
    handleKeyDown,
    inputRef,
  } = useTerminal();

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, [inputRef]);

  return (
    <div className="min-h-screen bg-terminal-bg" data-testid="terminal-page">
      <TerminalWindow
        lines={lines}
        currentInput={currentInput}
        setCurrentInput={setCurrentInput}
        isTyping={isTyping}
        handleKeyDown={handleKeyDown}
        inputRef={inputRef}
      />
    </div>
  );
}
