import React, { useState } from 'react';

const theories = {
  1: {
    title: 'CPU Scheduling Algorithms',
    aim: 'To study and implement various CPU scheduling algorithms: FCFS, SJF, Priority, and Round Robin.',
    theory: 'CPU scheduling is a process which allows one process to use the CPU while the execution of another process is on hold due to unavailability of any resource like I/O etc, thereby making full use of CPU.',
    algorithms: [
      { name: 'First Come First Served (FCFS)', desc: 'Processes are dispatched according to their arrival time on the ready queue. Being a non-preemptive discipline, once a process has a CPU, it runs to completion.' },
      { name: 'Shortest Job First (SJF)', desc: 'SJF algorithm associates with each process the length of the process\'s next CPU burst. When the CPU is available, it is assigned to the process that has the smallest next CPU burst.' },
      { name: 'Priority Scheduling', desc: 'A priority number (integer) is associated with each process. The CPU is allocated to the process with the highest priority (smallest integer = highest priority).' },
      { name: 'Round Robin (RR)', desc: 'Each process gets a small unit of CPU time (time quantum), usually 10-100 milliseconds. After this time has elapsed, the process is preempted and added to the end of the ready queue.' }
    ]
  },
  2: {
    title: 'Memory Management',
    aim: 'To implement memory allocation methods for fixed partition: First Fit, Best Fit, and Worst Fit.',
    theory: 'Memory management is the functionality of an operating system which handles or manages primary memory and moves processes back and forth between main memory and disk during execution.',
    algorithms: [
      { name: 'First Fit', desc: 'Allocate the first hole that is big enough.' },
      { name: 'Best Fit', desc: 'Allocate the smallest hole that is big enough; must search entire list, unless ordered by size. Produces the smallest leftover hole.' },
      { name: 'Worst Fit', desc: 'Allocate the largest hole; must also search entire list. Produces the largest leftover hole.' }
    ]
  },
  3: {
    title: 'Page Replacement Algorithms',
    aim: 'To implement and evaluate page replacement algorithms: FIFO, LRU, Optimal.',
    theory: 'In a computer operating system that uses paging for virtual memory management, page replacement algorithms decide which memory pages to page out, sometimes called swap out, or write to disk, when a page of memory needs to be allocated.',
    algorithms: [
      { name: 'First-In-First-Out (FIFO)', desc: 'The simplest page-replacement algorithm. A FIFO replacement algorithm associates with each page the time when that page was brought into memory. When a page must be replaced, the oldest page is chosen.' },
      { name: 'Least Recently Used (LRU)', desc: 'LRU replacement associates with each page the time of that page\'s last use. When a page must be replaced, LRU chooses the page that has not been used for the longest period of time.' },
      { name: 'Optimal', desc: 'Replace the page that will not be used for the longest period of time. This guarantees the lowest possible page-fault rate for a fixed number of frames.' }
    ]
  },
  4: {
    title: 'Deadlock Detection & Banker\'s Algorithm',
    aim: 'To simulate Banker\'s algorithm for Deadlock Avoidance and Prevention.',
    theory: 'The Banker\'s algorithm, sometimes referred to as the detection algorithm, is a resource allocation and deadlock avoidance algorithm developed by Edsger Dijkstra that tests for safety by simulating the allocation of predetermined maximum possible amounts of all resources.',
    algorithms: [
       { name: "Banker's Algorithm", desc: 'When a new process enters the system, it must declare the maximum number of instances of each resource type that it may ever claim; clearly, that number may not exceed the total number of resources in the system. When a user requests a set of resources, the system must determine whether the allocation of these resources will leave the system in a safe state.'}
    ]
  },
  5: {
    title: 'Disk Scheduling Algorithms',
    aim: 'To simulate Disk Scheduling Algorithms (FCFS, SSTF, SCAN, C-SCAN, LOOK, C-LOOK).',
    theory: 'Disk scheduling is done by operating systems to schedule I/O requests arriving for the disk. Disk scheduling is also known as I/O scheduling.',
    algorithms: [
       { name: 'FCFS', desc: 'Requests are addressed in the order they arrive in the disk queue.' },
       { name: 'SSTF', desc: 'Shortest Seek Time First. Selects the request that is closest to the current head position.' },
       { name: 'SCAN', desc: 'The disk arm starts at one end of the disk, and moves toward the other end, servicing requests until it gets to the other end of the disk.' }
    ]
  }
};

export default function OSTheory({ experimentId, darkMode, onBack }) {
  const data = theories[experimentId];

  if (!data) return (
     <div className="flex items-center justify-center h-full">
        <p className={darkMode ? 'text-slate-400' : 'text-slate-500'}>Select an experiment to view theory.</p>
     </div>
  );

  return (
    <div className={`h-full overflow-y-auto p-8 ${darkMode ? 'bg-[#0f1221] text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
       <div className="max-w-4xl mx-auto space-y-8">
          
          <button onClick={onBack} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${darkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-white border hover:bg-slate-50'}`}>
             ← Back
          </button>
          
          <div className={`p-8 rounded-3xl ${darkMode ? 'bg-[#1a1f36] border border-white/5' : 'bg-white border shadow-sm'}`}>
              <h1 className="text-3xl font-bold mb-6">{data.title}</h1>
              
              <div className="space-y-6">
                 <div>
                    <h3 className="text-lg font-bold mb-2 text-violet-500">Aim</h3>
                    <p className="leading-relaxed">{data.aim}</p>
                 </div>
                 
                 <div>
                    <h3 className="text-lg font-bold mb-2 text-violet-500">Theory</h3>
                    <p className="leading-relaxed">{data.theory}</p>
                 </div>
                 
                 <div>
                    <h3 className="text-lg font-bold mb-3 text-violet-500">Algorithms</h3>
                    <div className="grid gap-4">
                       {data.algorithms.map(alg => (
                          <div key={alg.name} className={`p-4 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-slate-50 border'}`}>
                              <h4 className="font-bold mb-1">{alg.name}</h4>
                              <p className="text-sm opacity-80 leading-relaxed">{alg.desc}</p>
                          </div>
                       ))}
                    </div>
                 </div>
              </div>
          </div>
       </div>
    </div>
  );
}
