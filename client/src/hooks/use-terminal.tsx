import { useState, useEffect, useRef, useCallback } from 'react';

interface TerminalLine {
  id: string;
  content: string;
  isCommand?: boolean;
  timestamp: number;
}

interface TerminalCommand {
  name: string;
  description: string;
  execute: () => string;
}

export function useTerminal() {
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentInput, setCurrentInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addLine = useCallback((content: string, isCommand = false) => {
    const newLine: TerminalLine = {
      id: `line-${Date.now()}-${Math.random()}`,
      content,
      isCommand,
      timestamp: Date.now(),
    };
    setLines(prev => [...prev, newLine]);
  }, []);

  const clearTerminal = useCallback(() => {
    setLines([]);
  }, []);

  const typewriterEffect = useCallback((text: string, speed = 4) => {
    return new Promise<void>((resolve) => {
      setIsTyping(true);
      const lineId = `typing-${Date.now()}`;
      
      // Add empty line initially
      setLines(prev => [...prev, {
        id: lineId,
        content: '',
        timestamp: Date.now(),
      }]);

      let index = 0;
      const timer = setInterval(() => {
        if (index <= text.length) {
          setLines(prev => prev.map(line => 
            line.id === lineId 
              ? { ...line, content: text.substring(0, index) }
              : line
          ));
          index++;
        } else {
          clearInterval(timer);
          setIsTyping(false);
          resolve();
        }
      }, speed);
    });
  }, []);

  const commands: Record<string, TerminalCommand> = {
    help: {
      name: 'help',
      description: 'Show available commands',
      execute: () => `
Available commands:
  <span class="text-terminal-accent">whoami</span>     - About me
  <span class="text-terminal-accent">skills</span>     - Technical skills
  <span class="text-terminal-accent">projects</span>   - My projects
  <span class="text-terminal-accent">coding</span>     - Competitive programming
  <span class="text-terminal-accent">goals</span>      - My goals and aspirations 
  <span class="text-terminal-accent">learning</span>   - What I'm learning now
  <span class="text-terminal-accent">positions</span>  - Positions of responsibility
  <span class="text-terminal-accent">contact</span>    - Get in touch
  <span class="text-terminal-accent">resume</span>     - Download resume
  <span class="text-terminal-accent">github</span>     - View GitHub profile
  <span class="text-terminal-accent">clear</span>      - Clear terminal
  <span class="text-terminal-accent">help</span>       - Show this help

Type any command to get started!`
    },

    whoami: {
      name: 'whoami',
      description: 'About me',
      execute: () => `
<div class="ascii-art text-terminal-accent text-xs mb-3">
░▒▓████████▓▒░▒▓█▓▒░▒▓███████▓▒░░▒▓███████▓▒░░▒▓█▓▒░░▒▓█▓▒░▒▓████████▓▒░░▒▓███████▓▒░▒▓█▓▒░░▒▓█▓▒░ 
░▒▓█▓▒░   ░▒▓████▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░      ░▒▓█▓▒░      ░▒▓█▓▒░░▒▓█▓▒░ 
░▒▓█▓▒░      ░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░      ░▒▓█▓▒░      ░▒▓█▓▒░░▒▓█▓▒░ 
░▒▓███████▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓████████▓▒░▒▓██████▓▒░  ░▒▓██████▓▒░░▒▓████████▓▒░ 
       ░▒▓█▓▒░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░             ░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░ 
       ░▒▓█▓▒░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░             ░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░ 
░▒▓███████▓▒░░▒▓█▓▒░▒▓███████▓▒░░▒▓███████▓▒░░▒▓█▓▒░░▒▓█▓▒░▒▓████████▓▒░▒▓███████▓▒░░▒▓█▓▒░░▒▓█▓▒░ 
                                                                                                   
</div>

<span class="text-terminal-accent">Name:</span> Siddhesh Badnapurkar
<span class="text-terminal-accent">I am a:</span> Computer Science Major | Low Level Systems Enthusiast

<span class="text-terminal-accent">About Me:</span>
I am an undergrad with a love for algorithms, low level systems and building 
meaningful software for hunans. I love to learn and implement ideas into code.

<span class="text-terminal-accent">Currently, I am:</span>
• into competitive programming
• learning the web  
• implementing deep learning papers
• into GPU kernel programming
`
    },

    skills: {
      name: 'skills',
      description: 'Technical skills',
      execute: () => `
┌─ TECHNICAL SKILLS ────────────────────────────────────────
│
│ Languages:
│   • C 
│   • C++ 
│   • Rust 
│   • Go 
│   • Python 
│   • JavaScript 
│   • Java 
│
│ Frameworks & Libraries:
│   • Tokio.rs
│   • gin-gonic/gin
│   • Vulkan
│   • Boost.asio
│   • OpenGL
│   • Simple DirectMedia Layer (SDL3)
│   • FastAPI
│   • NumPy
│   • PyTorch
│   • Triton
│
│ Tools & Technologies:
│   • Git
│   • Unix
│   • PostgreSQL
│   • Vim/Neovim
│   • Jupyter
│   • MongoDB
│
└──────────────────────────────────────────────────────────`
    },

    projects: {
      name: 'projects',
      description: 'My projects',
      execute: () => `
┌─ FEATURED PROJECTS ────────────────────────────────────────
│
│ [1] min_cc
│     Ultra minimal C compiler, written in Rust
│     Tech: Rust
│     → Type: open min_cc
│
│ [2] Market Pipeline
│     A high performance, high frequency financial market pipeline
│     Tech: C++
│     → Type: open pipeline
│
│ [3] Rusttp
│     High Performance, Concurrent, Thread Safe web server
│     Tech: Rust
│     → Type: open rusttp
│
│ [4] Kilo
│     A POSIX compliant text editor, written in under ~1000 lines of C
│     Tech: C
│     → Type: open kilo
│
│ [5] Proton
│     A simple math engine made to learn about expression parsing
│     Tech: Rust
│     → Type: open proton
│
└──────────────────────────────────────────────────────────`
    },

    coding: {
      name: 'coding',
      description: 'Competitive programming',
      execute: () => `
┌─ COMPETITIVE PROGRAMMING ────────────────────────────────────────
│
│ Platform Profiles:
│
│ 🏆 LeetCode        51ddhesh
│    → Type: open leetcode
│
│ 🚀 Codeforces     s1ddhesh
│    → Type: open codeforces
│
│ 🔥 CodeChef       siddheshb95
│    → Type: open codechef
│
│ ⭐ AtCoder        siddhesh_b
│    → Type: open atcoder
│
└──────────────────────────────────────────────────────────`
    },

      learning: {
      name: 'learning',
      description: 'What I\'m learning now',
      execute: () => `
┌─ CURRENT LEARNING JOURNEY ────────────────────────────────────────
│
│ 🎓 Currently Studying:
│
│   📚 Advanced Computer Science Topics:
│   • Kernel level optimizations
│   • System Design & Distributed Systems
│   • Network Programming and Security Protocols
│   • Mathematics of Deep Neural Networks
│
│   💻 Technical Skills in Progress:
│   • Deep Learning Architecture
│   • Web Technologies
│   • CUDA (Compute Unified Device Architecture)
│   • Triton
│
│   📖 Currently Reading:
│   • "Comprehensive Rust" by Android Team at Google
│   • "Building Neural Networks from Scratch" by Harrison Kinsley and Daniel Kukiela
│   • "Just the Mathematics" by AJ Hobson
│
│
│ 🎓 What I will study next:
│   • Reinforcement Learning
│   • FPGA
│   • Nextjs
│   • On-chain applications on Solana with Rust
│   • Mobile Development with React Native
│
└──────────────────────────────────────────────────────────`
    },

    positions: {
      name: 'positions',
      description: 'Positions of responsibility',
      execute: () => `
┌─ RESPONSIBILITIES ───────────────────────────────────
│
│ 🎯 Current Positions:
│
│   👨‍💼 Technical Team Member
│   • Competitive Coding Club (March 2025 - Present)
│   • Organizing post contest discussions.
│   • Mentoring students in competitive programming.
│ 
│ 📜 Previous Roles:
│
│   📚 Machine Learning Coordinator
│   • Google Developer Groups on Campus (October 2024 - September 2025)
│   • Working towards building a community interested in tech. 
│   • Learnt about OSS initiatives by Google.
│   
│   📚 Team Member
│   • AlgoBharat Blockchain Club (October 2024 - September 2025)
│   • Learning to build on-chain applications with AlgoKit.
│   • Attending workshops and meetups organized by AlgoBharat.
│
│
│   🏆 Content Writer (August 2024 - February 2025)
│   • Association of Computer Science and Business Systems
│   • Wrote 15+ plagiarism-free articles and posts.
│   • Created invitations and scripts for flagship events. 
│
└──────────────────────────────────────────────────────────`
    },
    goals: {
      name: 'goals',
      description: 'My aspirations',
      execute: () => `
┌─ GOALS & ASPIRATIONS ────────────────────────────────────────
│
│ 🎯 Short-term Goals (2025):
│   • Reach Specialist on Codeforces
│   • Complete 700 LeetCode problems
│   • Master system design fundamentals
│   • Contribute to 3 major OSS projects
│
│ 🚀 Long-term Vision:
│   • Land SWE role at a top tech company
│   • Specialize in high performance systems
│   • Earn lots of money
│   • Teach what I'm learning
│
│ 💡 Learning Path:
│   • Advanced algorithms 
│   • C++, Rust, Go 
│   • Deep learning 
│   • Concurrency
│   • Low-level Systems Programming
│
└──────────────────────────────────────────────────────────`
    },

    contact: {
      name: 'contact',
      description: 'Get in touch',
      execute: () => `
┌─ CONTACT INFORMATION ────────────────────────────────────────
│
│ 📧 Email:     siddheshbadnapurkar@gmail.com
│    → Type: email me
│
│ 💼 LinkedIn:  linkedin.com/in/siddhesh-badnapurkar
│    → Type: open linkedin
│
│ 🐙 GitHub:    github.com/51ddhesh
│    → Type: open github
│
│ 🐦 Twitter:   @51ddhesh
│    → Type: open twitter
│
│ 📍 Location:   India
│
│ 💬 Feel free to reach out for:
│   • Collaboration opportunities
│   • Technical discussions
│   • Internship/job opportunities
│
└──────────────────────────────────────────────────────────`
    },

    resume: {
      name: 'resume',
      description: 'Download resume',
      execute: () => {
        window.open('https://drive.google.com/file/d/1r-vGZ6XOPZElAXU0Kn0SERAvaFykAbGc/view?usp=sharing', '_blank');
        return `
<span class="text-terminal-accent">📄 Downloading resume...</span>

<span class="text-terminal-text">File:</span> Resume.pdf
<span class="text-terminal-text">Size:</span> 119KB
<span class="text-terminal-text">Last Updated:</span> September 2025

<span class="text-green-400">[████████████████████████████████] 100%</span>

<span class="text-terminal-accent">✅ Resume downloaded successfully!</span>

`;
      }
    },

    github: {
      name: 'github',
      description: 'View GitHub profile',
      execute: () => {
        window.open('https://github.com/51ddhesh', '_blank');
        return `
<span class="text-terminal-accent">🐙 Opening GitHub profile...</span>
`;
      }
    },

    clear: {
      name: 'clear',
      description: 'Clear terminal',
      execute: () => 'CLEAR_TERMINAL'
    }
  };

  // Sub-commands for opening external links
  const subCommands: Record<string, () => string> = {
    'email me': () => {
      window.open('mailto:siddheshbadnapurkar@gmail.com', '_blank');
      return `<span class="text-terminal-accent">📧 Opening email client...</span>`;
    },
    
    'open linkedin': () => {
      window.open('https://www.linkedin.com/in/siddhesh-badnapurkar/', '_blank');
      return `<span class="text-terminal-accent">💼 Opening LinkedIn profile...</span>`;
    },
    
    'open github': () => {
      window.open('https://github.com/51ddhesh', '_blank');
      return `<span class="text-terminal-accent">🐙 Opening GitHub profile...</span>`;
    },
    
    'open twitter': () => {
      window.open('https://x.com/51ddhesh', '_blank');
      return `<span class="text-terminal-accent">🐦 Opening Twitter profile...</span>`;
    },
    
    'open min_cc': () => {
      window.open('https://github.com/51ddhesh/min_cc', '_blank');
      return `<span class="text-terminal-accent">Opening min_cc...</span>`;
    },
    
    'open pipeline': () => {
      window.open('https://github.com/51ddhesh/market_pipeline', '_blank');
      return `<span class="text-terminal-accent">Opening Market Pipeline project...</span>`;
    },
    
    'open rusttp': () => {
      window.open('https://github.com/51ddhesh/rust_webserver', '_blank');
      return `<span class="text-terminal-accent">Opening rusttp</span>`;
    },
    
    'open kilo': () => {
      window.open('https://github.com/51ddhesh/kilo-editor', '_blank');
      return `<span class="text-terminal-accent">Opening kilo...</span>`;
    },
    
    'open proton': () => {
      window.open('https://github.com/51ddhesh/proton_lite', '_blank');
      return `<span class="text-terminal-accent">Opening Proton...</span>`;
    },
    
    'open leetcode': () => {
      window.open('https://leetcode.com/51ddhesh', '_blank');
      return `<span class="text-terminal-accent">🏆 Opening LeetCode profile...</span>`;
    },
    
    'open codeforces': () => {
      window.open('https://codeforces.com/profile/s1ddhesh', '_blank');
      return `<span class="text-terminal-accent">🚀 Opening Codeforces profile...</span>`;
    },
    
    'open codechef': () => {
      window.open('https://codechef.com/users/siddheshb95', '_blank');
      return `<span class="text-terminal-accent">🔥 Opening CodeChef profile...</span>`;
    },
    
    'open atcoder': () => {
      window.open('https://atcoder.jp/users/siddhesh_b', '_blank');
      return `<span class="text-terminal-accent">⭐ Opening AtCoder profile...</span>`;
    }
  };

  const executeCommand = useCallback(async (command: string) => {
    // Add command to history display
    addLine(`<span class="text-terminal-accent">siddhesh@portfolio:~$</span> ${command}`, true);

    const lowerCommand = command.toLowerCase().trim();
    
    // Check if it's a main command
    if (commands[lowerCommand]) {
      const result = commands[lowerCommand].execute();
      if (result === 'CLEAR_TERMINAL') {
        clearTerminal();
        return;
      }
      await typewriterEffect(result);
    } 
    // Check if it's a sub-command
    else if (subCommands[lowerCommand]) {
      const result = subCommands[lowerCommand]();
      await typewriterEffect(result);
    } 
    // Command not found
    else {
      await typewriterEffect(`<span class="text-terminal-error">Command not found: ${command}</span>
Try typing <span class="text-terminal-accent">'help'</span> to see available commands.`);
    }

    // Update command history
    setCommandHistory(prev => [...prev, command]);
    setHistoryIndex(-1);
  }, [addLine, clearTerminal, typewriterEffect]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isTyping) return;

    if (e.key === 'Enter') {
      const command = currentInput.trim();
      if (command) {
        executeCommand(command);
        setCurrentInput('');
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setCurrentInput(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setCurrentInput('');
        } else {
          setHistoryIndex(newIndex);
          setCurrentInput(commandHistory[newIndex]);
        }
      }
    }
  }, [isTyping, currentInput, commandHistory, historyIndex, executeCommand]);

  // Initialize with welcome message
  useEffect(() => {
    const initTerminal = async () => {
      await typewriterEffect(`<div class="ascii-art text-terminal-accent text-sm mb-4">
██╗    ██╗███████╗██╗      ██████╗ ██████╗ ███╗   ███╗███████╗
██║    ██║██╔════╝██║     ██╔════╝██╔═══██╗████╗ ████║██╔════╝
██║ █╗ ██║█████╗  ██║     ██║     ██║   ██║██╔████╔██║█████╗  
██║███╗██║██╔══╝  ██║     ██║     ██║   ██║██║╚██╔╝██║██╔══╝  
╚███╔███╔╝███████╗███████╗╚██████╗╚██████╔╝██║ ╚═╝ ██║███████╗
 ╚══╝╚══╝ ╚══════╝╚══════╝ ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝
</div>
<div class="text-terminal-text mb-2">
<span class="text-terminal-accent">siddhesh@portfolio:~$</span> Welcome to the terminal.
</div>
<div class="text-terminal-text mb-2">
Type <span class="text-terminal-accent font-bold">'help'</span> to see available commands.
</div>
<div class="text-terminal-text mb-4">
Use <span class="text-terminal-accent">↑ ↓</span> arrows for command history.
</div>`);
    };
    
    initTerminal();
  }, [typewriterEffect]);

  return {
    lines,
    currentInput,
    setCurrentInput,
    isTyping,
    handleKeyDown,
    inputRef,
    commands: Object.values(commands),
    subCommands,
  };
}
