+++
title = "Writing a C Compiler in Rust: Where to Start"
description = "A walkthrough of how I approached building min_cc - a minimal C compiler from scratch in Rust."
date = 2025-03-01
[taxonomies]
tags = ["Rust", "Compilers", "Systems"]
+++

This is a sample post.

## Why build a compiler?

Compilers are one of those projects that sound intimidating until you actually start. The moment you write a lexer that tokenises your first `int main()`, something clicks. You stop treating the language as magic and start seeing it as a sequence of well-defined transformations.

That's what drove me to build `min_cc` - not to replace `gcc`, but to understand the pipeline end to end.

## The pipeline

A C compiler, stripped to its bones, does four things:

- **Lexing** - turn raw source text into a stream of tokens
- **Parsing** - turn tokens into an Abstract Syntax Tree (AST)
- **Semantic analysis** - typecheck, resolve names, catch errors
- **Code generation** - walk the AST and emit assembly or IR

```rust
#[derive(Debug, Clone, PartialEq)]
pub enum Token {
    Int,
    Return,
    Ident(String),
    Number(i64),
    Plus,
    Minus,
    Star,
    Slash,
    LParen,
    RParen,
    LBrace,
    RBrace,
    Semicolon,
}
```

## What I learned

Parsing is deceptively hard. Operator precedence alone took me two rewrites. The Pratt parser technique - associating parsing functions with token types by precedence - finally made it click.

---

*More to come as the project develops.*