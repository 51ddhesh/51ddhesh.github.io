+++
title = "Getting the Cat Out of the Heap"
description = "A walkthrough of optimizing C++ code from naive methods to hitting kernel bypass"
date = 2026-04-15
[taxonomies]
tags = ["C++", "Low Latency", "High Performance", "SIMD", "Vectorization"]
+++

In performance critical areas like high-frequency trading arenas, latency is the difference between making or losing capital.

In this blog, we will be optimizing a text book parser from processing ~440M ticks per second to processing ~25B ticks per second.


## Version 0: The Naive, Idiomatic C++ processor

A standard textbook feed handler consists of an order book having a generic `Message` that is polymorphic. Hence, we create a base class, derive specific tick types and manage their lifetimes. 

```cpp
#pragma once

#include <vector>
#include <memory>
#include <cstdint>

// Generic market processing interface
class MarketMessage {
public:
    virtual ~MarketMessage() = default;
    virtual void process() = 0;
};

// Specific implementation for adding an order
class AddOrderMessage : public MarketMessage {
    uint64_t timestamp;
    uint64_t order_id;
    uint32_t price;
    uint32_t quantity;
    char side; // Buy / Sell

public:
    AddOrderMessage(uint64_t ts, uint64_t id, uint32_t p, uint32_t q, char s) :
        timestamp(ts), order_id(id), price(p), quantity(q), side(s) {}


    void process() override {
        // Dummy state machine update logic
        asm volatile("" : : "g"(price), "g"(quantity) : "memory");
    }
};

void process_stream(const std::vector<std::shared_ptr<MarketMessage>>& stream) {
    for (const auto& msg : stream) {
        msg -> process(); // Latency trap
    }
}
```

Now, this code is clean, but it is fundamentally hostile to modern CPU architectures. The following Google Benchmark and `perf` result will show it.

```bash
--------------------------------------------------------------
Benchmark         Time         CPU  Iterations UserCounters...
--------------------------------------------------------------
Naive/10K       8095 ns     8067 ns      64906 items_per_second=1.23966G/s
Naive/100K     80437 ns    80079 ns       8692 items_per_second=1.24877G/s
Naive/1M     2424241 ns  2413241 ns        290 items_per_second=414.381M/s

 Performance counter stats:

       7,87,43,674      cache-misses:u
    5,35,97,05,947      cache-references:u
```

We are hitting a **cache-cliff**. The CPU is spending more time waiting for main memory and looking up vtable addresses than it does calculating anything.


## Version 1: Data Oriented Design

To quote Martin Thompson, to achieve mechanical sympathy, we must stop thinking about 'Objects' and start thinking about 'Data'. The CPU prefetcher loves predictable, contiguous memory. We need to kill the heap allocations, remove the vtables and pack our data tightly aligning with the 64 byte L1 cache lines. 

```cpp
enum class MsgType : uint8_t {
    ADD,
    CANCEL,
    MODIFY
};

// Flat contiguous POD struct
struct MarketMessagePod {
    uint64_t timestamp;
    uint64_t order_id;
    uint32_t price;
    uint32_t quantity;
    MsgType type;
    char side;
};

void process_stream(const std::vector<MarketMessagePod>& stream) {
    for (const auto& msg : stream) {
        // Switch-case replaces virtual dispatch
        switch (msg.type) {
            case MsgType::ADD:
                // Dummy state machine update
                asm volatile("" : : "g"(msg.price), "g"(msg.quantity) : "memory");
                break;
            // ...
        }
    }
}
```

By switching to an array of structs (AoS), the results are immediate:

```bash
------------------------------------------------------------
Benchmark       Time         CPU  Iterations UserCounters...
------------------------------------------------------------
DoD/10K      2760 ns     2752 ns      253335 items_per_second=3.63315G/s
DoD/100K    31076 ns    30974 ns       22501 items_per_second=3.22853G/s
DoD/1M    1074340 ns  1068376 ns         650 items_per_second=936M/s

 Performance counter stats:

       9,94,29,596      cache-misses:u                                                        
    7,49,13,99,026      cache-references:u                                                    
```
We can now process double the ticks at ~936M per second. But, this increased the cache misses but also increased the number of cache references as well. We can find the percentage of cache misses as: 
$$
\frac{cache\\_misses}{cache\\_references} \times 100 \\%
$$

Using this formula, the cache-miss rate for the initial (version 1) approach is $1.46 \\%$. For the new data oriented design, this rate becomes $1.327 \\%$. Hence, the cache-miss rate decreases as well. 

## Version 2: Static Resolution, CRTP and Branch Hinting
Now, the memory is aligned, but now we face a control-flow bottleneck. The `switch` statement introduces conditional branches, risking pipeline flushes. We need to use Curiously Recurring Template Pattern (CRTP) and compiler attributes to eliminate branching entirely. We inherit the `MarketMessagePod` from the V2 data oriented design.

```cpp
#include <data_oriented.hpp>

template <typename Derived>
class MessageHandler {
public:
    inline void handle(const MarketMessagePod& msg) {
        static_cast<Derived*>(this) -> process_impl(msg);
    }
};

class FastOrderBook : public MessageHandler<FastOrderBook> {
public:
    inline void process_impl(const MarketMessagePod& msg) {
        if (msg.type == MsgType::ADD) [[likely]] {
            asm volatile("" : : "g"(msg.price), "g"(msg.quantity) : "memory");
        } 
        else [[unlikely]] {
            asm volatile("" : : "g"(msg.order_id) : "memory");
        }
    }
};

void process_stream(const std::vector<MarketMessagePod>& stream, FastOrderBook& book) {
    const size_t size = stream.size();
    const MarketMessagePod* __restrict__ data = stream.data();

    #pragma GCC unroll 4
    for (size_t i = 0; i < size; i++) {
        book.handle(data[i]);
    }
}
```

The throughput now jumps to 1.15 Billion per ticks.

```bash
------------------------------------------------------------------
Benchmark             Time        CPU   Iterations UserCounters...
------------------------------------------------------------------
SR_CRTP_BH/10K     3206 ns    3198 ns       185542 items_per_second=3.12661G/s
SR_CRTP_BH/100K   32419 ns   32318 ns        21525 items_per_second=3.09423G/s
SR_CRTP_BH/1M    874833 ns  869572 ns          795 items_per_second=1.14999G/s

 Performance counter stats for:

       8,59,02,211      cache-misses:u                                                        
    6,40,36,81,500      cache-references:u
```

## Version 3: Silicon Symphony: SIMD Vectorization

Writing custom deep learning libraries teaches you very quickly that calculating token generation rates relies entirely on packing the CPU's wide registers. Processing scalar values is a waste of silicon. We can apply that exact same SIMD acceleration to our market data parser.

To use AVX2 intrinsics, we must flip our architecture inside out to a Struct of Arrays (SoA) to provide the 256-bit registers with uniform data.

```cpp
#include <immintrin.h> // AVX/SSE Intrinsics

struct MarketDataSoA {
    alignas(64) std::vector<uint64_t> timestamps;
    alignas(64) std::vector<uint64_t> order_ids;
    alignas(64) std::vector<uint32_t> prices;
    alignas(64) std::vector<uint32_t> quantities;
    alignas(64) std::vector<uint8_t> types; 

    void reserve(size_t size) {
        timestamps.reserve(size); order_ids.reserve(size);
        prices.reserve(size); quantities.reserve(size); types.reserve(size);
    }
};

inline void process_stream_simd(const MarketDataSoA& book, size_t size) {
    const uint32_t* __restrict__ qty_ptr = book.quantities.data();
    size_t i = 0;
    
    __m256i vector_accumulator = _mm256_setzero_si256();

    for (; i + 8 <= size; i += 8) {
        __m256i q_vec = _mm256_loadu_si256(reinterpret_cast<const __m256i*>(qty_ptr + i));
        vector_accumulator = _mm256_add_epi32(vector_accumulator, q_vec);
    }

    for (; i < size; i++) {
        asm volatile("" : : "g"(qty_ptr[i]) : "memory");
    }
    
    asm volatile("" : : "x"(vector_accumulator) : "memory");
}
```

```bash
------------------------------------------------------------
Benchmark       Time        CPU   Iterations UserCounters...
------------------------------------------------------------
SIMD/10K      298 ns     297 ns      2340635 items_per_second=33.6261G/s
SIMD/100K    3374 ns    3364 ns       207721 items_per_second=29.7253G/s
SIMD/1M     38100 ns   37976 ns        18422 items_per_second=26.3322G/s

 Performance counter stats for:

      18,69,98,149      cache-misses:u                                                        
    9,39,03,07,057      cache-references:u
```
**26 Billion Ticks per second**. That is a staggering 60x gain in performance. This is still not enough for low latency trading. 


## Version 4: Kernel Bypass

A single Linux scheduler tick takes about 3 to 5 microseconds. In that tiny window, our Version 3 SIMD loop could have processed over 100,000 messages. If the OS decides to pause our thread, we lose the trade.

We must guarantee determinism by isolating our thread. A custom kernel supports tuning the bootloader parameters (`isolcpus=2 nohz_full=2 rcu_nocbs=2`) to completely evict the OS from a specific core.

Then, we bind our execution strictly to that physical silicon:

```cpp
#pragma once
#include <pthread.h>
#include <sched.h>
#include <stdexcept>
#include <iostream>
#include <simd_vectorized.hpp> // Reusing our peak SIMD logic

class HardwareIsolator {
public:
    static void pin_thread_to_core(int core_id) {
        cpu_set_t cpuset;
        CPU_ZERO(&cpuset);
        CPU_SET(core_id, &cpuset);
        
        pthread_t current_thread = pthread_self();
        if (pthread_setaffinity_np(current_thread, sizeof(cpu_set_t), &cpuset) != 0) {
            std::cerr << "WARNING: Failed to pin thread to core " << core_id << "\n";
        }
    }
};

// The V4 processing function simply wraps V3 but ensures we are pinned
inline void process_stream(const MarketDataSoA& book, size_t size, int target_core) {
    HardwareIsolator::pin_thread_to_core(target_core);
    
    // Execute the hyper-optimized SIMD loop
    process_stream_simd(book, size);
}
```

Running the benchmark with FIFO real time priority (with `sudo chrt -f 99`), we get:

```bash
----------------------------------------------------------
Benchmark       Time       CPU  Iterations UserCounters...
----------------------------------------------------------
Metal/10K    1222 ns   1219 ns      578139 items_per_second=8.20443G/s
Metal/100K   4604 ns   4592 ns      142760 items_per_second=21.7761G/s
Metal/1M    39963 ns  39890 ns       17527 items_per_second=25.0692G/s

 Performance counter stats for:

      12,87,16,735      cache-misses:u                                                        
    6,94,77,45,302      cache-references:u
```

Bypassing the OS slightly decreased our peak throughput from ~26 G/s to ~25 G/s. This is because we have hit the physical limits of the silicon's memory bandwidth.

But in low latency arenas, peak throughput is a vanity metric; jitter is the only metric that pays. We traded a tiny fraction of theoretical throughput for absolute, unwavering determinism.

## The Numbers

| Method | Cache Misses | Cache References | Throughput |
|:-------|:-------------|:-----------------|:-----------|
|Naive   |78743674      |5359705947        |414.381M/s  |
|Data Oriented Design|99429596|7491399026  |936M/s      |
|Static Processing + CRTP|85902211|6403681500|1.15G/s   |
|SIMD Processing|186998149|9390307057      |26.3322G/s  |
|Metal   |128716735     |6947745302        |25.0692G/s  |


## End

The code files for this implementation are available [here](https://github.com/51ddhesh/latency-progression) and are free to use under [the Boost Software License 1.0](https://www.boost.org/LICENSE_1_0.txt).
