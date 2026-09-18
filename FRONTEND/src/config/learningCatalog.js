export const branchCatalog = {
  CSE: {
    name: "Computer Science Engineering",
    subjects: [
      {
        id: "dsa",
        name: "Data Structures & Algorithms",
        notesFile: "dsa_notes.pdf",
        topics: [
          { id: "arrays-linked-lists", name: "Arrays & Linked Lists", desc: "Understand linear data structures, sequential storage, memory representation, and node links." },
          { id: "stacks-queues", name: "Stacks & Queues", desc: "Learn LIFO and FIFO execution logic, buffer designs, and call stack simulations." },
          { id: "trees", name: "Trees & Binary Trees", desc: "Explore hierarchical structures, traversals, binary search tests, and balance factors." },
          { id: "graphs", name: "Graphs & Algorithms", desc: "Study network nodes, adjacencies, BFS/DFS traversals, and shortest path algorithms." },
          { id: "sorting-searching", name: "Sorting & Searching", desc: "Compare time complexities of bubble, quick, merge sort, and binary search." }
        ]
      },
      {
        id: "dbms",
        name: "Database Management Systems",
        notesFile: "dbms_notes.pdf",
        topics: [
          { id: "normalization", name: "Normalization", desc: "Learn redundancy reduction, functional dependencies, 1NF, 2NF, 3NF, and BCNF." },
          { id: "sql", name: "SQL Queries & Joins", desc: "Master structured query language declarations, aggregations, and inner/outer joins." },
          { id: "transactions", name: "Transactions & Concurrency", desc: "Explore database schedule execution, conflicts, schedules, and serializability." },
          { id: "acid-properties", name: "ACID Properties", desc: "Study atomicity, consistency, isolation, and durability requirements." },
          { id: "indexing", name: "Indexing & Hashing", desc: "Understand database search acceleration, B-trees, B+ trees, and hashing structures." }
        ]
      },
      {
        id: "os",
        name: "Operating Systems",
        notesFile: "operating_system_notes.pdf",
        topics: [
          { id: "processes-threads", name: "Processes & Threads", desc: "Explore execution units, PCBs, context switching, and multithreading schemas." },
          { id: "cpu-scheduling", name: "CPU Scheduling", desc: "Compare scheduling disciplines like FCFS, SJF, Round Robin, and Priority." },
          { id: "memory-management", name: "Memory Management", desc: "Learn paging, segmentation, virtual memory systems, and page replacement." },
          { id: "deadlocks", name: "Deadlocks", desc: "Understand mutual exclusion, Bankers algorithm, avoidance, and recovery." },
          { id: "file-systems", name: "File Systems", desc: "Study storage allocation, directory indexing, disk blocks, and inode designs." }
        ]
      },
      {
        id: "cn",
        name: "Computer Networks",
        notesFile: "computer_networks.pdf",
        topics: [
          { id: "osi-model", name: "OSI Model Layers", desc: "Analyze the 7-layer networking architecture and protocol separations." },
          { id: "tcp-ip", name: "TCP/IP Protocol Suite", desc: "Understand handshake logic, sliding windows, and reliable data transport." },
          { id: "routing-algorithms", name: "Routing Algorithms", desc: "Compare link-state routing, distance-vector routing, and router states." },
          { id: "ip-addressing", name: "IP Addressing & Subnetting", desc: "Master IPv4/IPv6 formats, CIDR prefixes, and network masks." },
          { id: "dns", name: "DNS & Application Protocols", desc: "Explore domain name resolution, HTTP, FTP, and SMTP mechanisms." }
        ]
      },
      {
        id: "oop",
        name: "Object Oriented Programming",
        notesFile: "oop_notes.pdf",
        topics: [
          { id: "classes-objects", name: "Classes & Objects", desc: "Learn base blueprints, instances, memory layouts, and instantiation rules." },
          { id: "inheritance", name: "Inheritance", desc: "Study parent-child relationships, subclassing, code reuse, and hierarchies." },
          { id: "polymorphism", name: "Polymorphism", desc: "Master method overloading, method overriding, and dynamic binding." },
          { id: "abstraction", name: "Abstraction", desc: "Understand interface contracts, abstract classes, and signature templates." },
          { id: "encapsulation", name: "Encapsulation & Access Modifier", desc: "Explore data hiding, public/private properties, getters, and setters." }
        ]
      }
    ]
  },
  ECE: {
    name: "Electronics & Communication Engineering",
    subjects: [
      {
        id: "digital-electronics",
        name: "Digital Electronics",
        topics: [
          { id: "boolean-algebra", name: "Boolean Algebra & K-Maps", desc: "Learn logic simplification, truth tables, and Karnaugh map minimization." },
          { id: "logic-gates", name: "Logic Gates & Families", desc: "Study basic gates, universal gates, TTL, CMOS, and propagation delays." },
          { id: "combinational-circuits", name: "Combinational Circuits", desc: "Explore adders, subtractors, multiplexers, demultiplexers, and decoders." },
          { id: "sequential-circuits", name: "Sequential Circuits", desc: "Master latches, flip-flops, counters, shift registers, and state machines." },
          { id: "converters", name: "A/D & D/A Converters", desc: "Understand resolution, sampling rates, R-2R ladders, and successive approximation." }
        ]
      },
      {
        id: "analog-electronics",
        name: "Analog Electronics",
        topics: [
          { id: "diodes", name: "Diodes & Rectifiers", desc: "Study PN junctions, zener diodes, half-wave/full-wave rectifiers, and filters." },
          { id: "bjt-biasing", name: "BJT & FET Biasing", desc: "Explore transistor operation, Q-point stabilization, and small-signal models." },
          { id: "op-amps", name: "Operational Amplifiers", desc: "Master inverting, non-inverting configurations, comparators, and integrators." },
          { id: "oscillators", name: "Oscillators & Timers", desc: "Learn Barkhausen criteria, RC phase shift, Hartley, Colpitts, and 555 timers." },
          { id: "feedback-amps", name: "Feedback Amplifiers", desc: "Compare voltage/current series/shunt feedback topologies and stability." }
        ]
      },
      {
        id: "signals-systems",
        name: "Signals & Systems",
        topics: [
          { id: "signal-types", name: "Signal Classifications", desc: "Understand continuous vs discrete, periodic, energy/power signals." },
          { id: "lti-systems", name: "LTI Systems & Convolution", desc: "Study linearity, time-invariance, impulse response, and convolution integral." },
          { id: "fourier-transform", name: "Fourier Analysis", desc: "Master Fourier series, continuous Fourier transform (FT), and frequency domains." },
          { id: "laplace-transform", name: "Laplace Transform", desc: "Explore ROC (Region of Convergence), s-plane poles/zeros, and system stability." },
          { id: "z-transform", name: "Z-Transform", desc: "Learn discrete-time system analysis, ROC, and transfer functions." }
        ]
      },
      {
        id: "communication-systems",
        name: "Communication Systems",
        topics: [
          { id: "amplitude-modulation", name: "Amplitude Modulation (AM)", desc: "Analyze modulation index, DSB-SC, SSB-SC, and envelope detectors." },
          { id: "frequency-modulation", name: "Angle Modulation (FM/PM)", desc: "Study Carson's rule, narrow/wideband FM, and phase-locked loops (PLL)." },
          { id: "pulse-modulation", name: "PCM & Digital Sampling", desc: "Explore Nyquist sampling rate, quantization noise, and PCM systems." },
          { id: "digital-modulation", name: "Digital Passband Modulation", desc: "Master ASK, FSK, PSK, QAM modulation, and constellation diagrams." },
          { id: "noise-communications", name: "Noise in Communication", desc: "Study thermal noise, SNR, noise figure, and noise performance in AM/FM." }
        ]
      },
      {
        id: "dsp",
        name: "Digital Signal Processing",
        topics: [
          { id: "dft-fft", name: "DFT & FFT Algorithms", desc: "Understand discrete Fourier transform properties and fast radix-2 algorithms." },
          { id: "iir-filters", name: "IIR Filter Design", desc: "Learn Butterworth/Chebyshev designs and impulse invariant/bilinear transforms." },
          { id: "fir-filters", name: "FIR Filter Design", desc: "Master linear phase conditions and windowing techniques (Hamming, Kaiser)." },
          { id: "multirate-dsp", name: "Multirate DSP & Decimation", desc: "Explore decimation, interpolation, sampling rate conversion, and alias filters." }
        ]
      },
      {
        id: "microprocessors",
        name: "Microprocessors & Interfacing",
        topics: [
          { id: "8085-architecture", name: "8085 Microprocessor", desc: "Study internal architecture, register array, ALU, and control unit." },
          { id: "8086-architecture", name: "8086 Microprocessor", desc: "Explore 16-bit architecture, memory segmentation, BIU, and EU operations." },
          { id: "addressing-modes", name: "Addressing Modes", desc: "Analyze direct, indirect, register, and index memory addressing schemes." },
          { id: "instruction-set", name: "Instruction Set & Programming", desc: "Write assembly instructions for arithmetic, logic, and branch control." },
          { id: "interrupts-interfacing", name: "Interrupts & Peripheral Interfacing", desc: "Study hardware/software interrupts, 8255 PPI, and memory mapped I/O." }
        ]
      }
    ]
  }
};
