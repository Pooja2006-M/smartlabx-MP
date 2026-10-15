import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import dbmsImage from '../assets/DBMS.png';
import networksImage from '../assets/CN.png';
import operatingSystemsImage from '../assets/os.png';

const labImages = { dbms: dbmsImage, networks: networksImage, operatingSystems: operatingSystemsImage };
const experimentAccentClasses = {
  blue: 'bg-blue-50 text-blue-700',
  cyan: 'bg-cyan-50 text-cyan-700',
  emerald: 'bg-emerald-50 text-emerald-700',
};

const emptyHomeContent = {
  highlights: [],
  learningSteps: [],
  labBenefits: [],
  labs: [],
  upcomingExperiments: [],
  announcements: [],
};

export default function Home() {
  const navigate = useNavigate();
  const [content, setContent] = useState(emptyHomeContent);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let isMounted = true;

    api.get('/home')
      .then(({ data }) => {
        if (isMounted) setContent(data);
      })
      .catch(() => {
        if (isMounted) setLoadError('Home content is unavailable. Please start the backend and refresh.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const { highlights, learningSteps, labBenefits, labs, upcomingExperiments, announcements } = content;

  const handleOpenLab = (labTitle) => {
    const targetRoute =
      labTitle === 'Computer Networks'
        ? '/computer-networks'
        : labTitle === 'Operating Systems'
        ? '/os-lab'
        : '/database-lab';

    const student = JSON.parse(localStorage.getItem('user') || 'null');
    if (student?.role === 'student' && localStorage.getItem('token')) {
      navigate(targetRoute);
      return;
    }
    navigate('/student-login', { state: { from: targetRoute } });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <nav className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex cursor-pointer items-center gap-2" onClick={() => window.scrollTo(0, 0)}>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <span className="text-2xl font-semibold tracking-tight text-slate-900">SmartLabX</span>
            </div>
          </div>
          <div className="hidden items-center gap-8 sm:flex">
            <a href="#home" className="text-sm font-semibold text-slate-900">Home</a>
            <a href="#about" className="text-sm font-medium text-slate-600 transition hover:text-blue-600">About</a>
            <a href="#laboratories" className="text-sm font-medium text-slate-600 transition hover:text-blue-600">Labs</a>
            <a href="#contact" className="text-sm font-medium text-slate-600 transition hover:text-blue-600">Contact</a>
          </div>
          <Link to="/login" className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700">
            Portal Login
          </Link>
        </div>
      </nav>

      {isLoading ? (
        <div className="border-b border-blue-100 bg-blue-50 px-4 py-3 text-center text-sm font-medium text-blue-700">Loading SmartLabX learning content...</div>
      ) : null}
      {loadError ? (
        <div className="border-b border-rose-100 bg-rose-50 px-4 py-3 text-center text-sm font-medium text-rose-700">{loadError}</div>
      ) : null}

      <section id="home" className="relative flex min-h-[calc(100vh-80px)] items-center overflow-hidden pt-16 pb-24 text-slate-900 sm:pt-24 sm:pb-32">
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:px-8">
          <div className="max-w-xl">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-700">Virtual Lab Environment</span>
            <h1 className="mt-4 text-4xl font-bold leading-[1.15] tracking-tight text-slate-800 sm:text-5xl">
              Secure, simple & <br />
              <span className="text-blue-700">organized virtual labs</span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-slate-600">
              SmartLabX brings database, networking, and operating systems virtual machines, intelligent proctoring, and practical assignments together in one focused workspace for universities.
            </p>
            <div className="mt-10 flex flex-col gap-6 sm:flex-row sm:items-center">
              <Link to="/login" className="inline-flex items-center justify-center rounded-lg bg-blue-700 px-7 py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-800">
                Know More &rarr;
              </Link>
              <div className="flex cursor-pointer items-center gap-3 transition hover:opacity-80">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-700 shadow-sm">
                  <svg className="h-6 w-6 ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <div>
                  <strong className="block text-sm font-bold text-slate-900">Watch Product Demo</strong>
                  <span className="text-xs text-slate-500">See SmartLabX in Action</span>
                </div>
              </div>
            </div>
          </div>
          <div className="relative h-[500px] w-full">
            {/* Aesthetic overlapping cards like the reference image */}
            <div className="absolute right-0 top-0 h-[350px] w-[300px] overflow-hidden rounded-3xl border-4 border-white bg-slate-200 shadow-2xl">
              <img src="/assets/hero.png" alt="Office/Lab" className="h-full w-full object-cover" />
            </div>
            <div className="absolute bottom-0 left-0 h-[220px] w-[260px] overflow-hidden rounded-3xl border-4 border-white bg-slate-200 shadow-2xl z-10">
              <img src="/assets/hero.png" alt="Student" className="h-full w-full object-cover" />
            </div>
            <div className="absolute left-8 top-32 z-20 flex flex-col items-center justify-center rounded-2xl bg-white p-6 shadow-[0_12px_40px_-18px_rgba(15,23,42,0.2)]">
              <span className="text-3xl font-extrabold text-blue-700">99.9%</span>
              <span className="mt-1 text-xs font-semibold text-slate-500">Uptime & Accuracy</span>
            </div>
            <div className="absolute -bottom-8 right-8 z-30 w-[240px] rounded-2xl border border-slate-100 bg-white p-4 shadow-2xl">
               <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-2">
                 <span className="text-[10px] font-bold uppercase text-slate-400">Lab Pass</span>
                 <div className="h-4 w-4 rounded-full bg-slate-200"></div>
               </div>
               <div className="grid grid-cols-2 gap-2 text-[10px]">
                 <span className="text-slate-400">Student</span>
                 <strong className="text-slate-800">John Doe</strong>
                 <span className="text-slate-400">From</span>
                 <strong className="text-slate-800">CS Dept</strong>
                 <span className="text-slate-400">Status</span>
                 <strong className="text-blue-600">Active</strong>
               </div>
               <div className="mt-3 h-10 w-full rounded bg-slate-100"></div>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="soft-pill">Why SmartLabX stands out</p>
            <h2 className="section-title mt-4">A modern lab suite built for students and faculty.</h2>
            <p className="mt-4 text-lg text-slate-600">
              Bridging the gap between theory and practice through a streamlined and secure virtual infrastructure.
            </p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {highlights.map((item) => (
              <div key={item.title} className="glass-card p-8">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6l4 2" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-3 text-slate-600">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white py-20 text-slate-900">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:px-8">
          <div>
            <p className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-sm font-medium text-cyan-300">Your learning journey</p>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">A practical path from theory to real lab skills.</h2>
            <p className="mt-5 max-w-lg leading-8 text-slate-600">
              Every SmartLabX session is designed to help you move one clear step forward, with the right balance of explanation, experimentation, and feedback.
            </p>
            <div className="mt-8 grid max-w-md grid-cols-2 gap-3 text-sm">
              <div className="border-l-2 border-cyan-500 pl-4"><strong className="block text-2xl text-slate-950">3</strong><span className="text-slate-500">core subjects</span></div>
              <div className="border-l-2 border-amber-500 pl-4"><strong className="block text-2xl text-slate-950">24/7</strong><span className="text-slate-500">practice access</span></div>
            </div>
            <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm">
              <img src="/assets/hero.png" alt="Students learning in a virtual engineering laboratory" className="h-40 w-full object-cover object-center" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {learningSteps.map((step) => (
              <div key={step.number} className="border-t border-slate-200 pt-5">
                <span className="text-sm font-bold tracking-[0.2em] text-cyan-600">{step.number}</span>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="laboratories" className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="soft-pill">Available labs</p>
            <h2 className="section-title mt-4">Explore a rich catalog of digital laboratories.</h2>
            <p className="mt-4 text-lg text-slate-600">
              Choose from hands-on modules designed for database, networking, and system-level learning.
            </p>
          </div>
          <div className="mt-12 grid gap-8 lg:grid-cols-3">
            {labs.map((lab) => (
              <div key={lab.title} className="group overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-50 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                <div className="flex h-48 items-center justify-center bg-gradient-to-br from-slate-700 via-slate-800 to-blue-700">
                  {labImages[lab.imageKey] ? (
                    <img
                      src={labImages[lab.imageKey]}
                      alt={`${lab.title} lab`}
                      className="h-full w-full object-cover object-left"
                      onError={(event) => {
                        event.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : <div className="flex h-full items-center justify-center text-sm font-semibold text-white">Lab preview unavailable</div>}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-slate-900">{lab.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{lab.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {lab.practice.map((topic) => (
                      <span key={topic} className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">{topic}</span>
                    ))}
                  </div>
                  <button
                    onClick={() => handleOpenLab(lab.title)}
                    className="mt-5 inline-flex items-center font-semibold text-blue-700 transition hover:text-blue-900"
                  >
                    Open {lab.title}
                    <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="announcements" className="border-t border-slate-200 bg-white py-20">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[1.35fr_0.65fr] lg:px-8">
          <div>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="soft-pill">Keep learning</p>
                <h2 className="section-title mt-4">Upcoming experiments</h2>
              </div>
              <span className="hidden text-sm text-slate-500 sm:block">Practice at your own pace</span>
            </div>
            <div className="mt-8 grid gap-4">
              {upcomingExperiments.map((experiment) => (
                <div key={experiment.title} className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${experimentAccentClasses[experiment.accent] || 'bg-slate-100 text-slate-700'}`}>LAB</div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{experiment.lab}</p>
                      <h3 className="mt-1 text-lg font-semibold text-slate-900">{experiment.title}</h3>
                      <p className="mt-1 text-sm text-slate-600">{experiment.meta}</p>
                    </div>
                  </div>
                  <button onClick={() => handleOpenLab(experiment.lab)} className="inline-flex items-center justify-center rounded-lg border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50">
                    Start lab
                    <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="soft-pill">Latest updates</p>
            <h2 className="section-title mt-4">Announcements</h2>
            <div className="mt-8 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-slate-50 px-5">
              {announcements.map((announcement) => (
                <article key={announcement.title} className="flex gap-4 py-5">
                  <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                    <strong className="text-lg leading-none">{announcement.date}</strong>
                    <span className="mt-1 text-[9px] font-bold tracking-wider">{announcement.month}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{announcement.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{announcement.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="soft-pill">Built for practical learning</p>
              <h2 className="section-title mt-4">Everything you need inside the lab.</h2>
            </div>
            <p className="max-w-md text-sm leading-7 text-slate-600">Move from your first experiment to a confident submission with one connected learning workspace.</p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {labBenefits.map((benefit, index) => (
              <div key={benefit.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-sm font-bold text-blue-700">0{index + 1}</span>
                <h3 className="mt-5 text-lg font-semibold text-slate-900">{benefit.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{benefit.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="bg-blue-50 py-16">
        <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-8 px-4 sm:px-6 md:flex-row md:items-center lg:px-8">
          <div>
            <p className="soft-pill border-blue-200 bg-white text-blue-700">Ready to learn?</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">Start your next practical session today.</h2>
            <p className="mt-3 max-w-xl text-slate-600">Join your class workspace and turn your next lesson into hands-on experience.</p>
          </div>
          <Link to="/student-login" className="inline-flex shrink-0 items-center rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-700">
            Student login
            <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>



      <footer className="border-t border-slate-200 bg-slate-800 py-12 text-slate-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <span className="text-xl font-semibold text-white">SmartLabX</span>
              </div>
              <p className="mt-4 max-w-md text-sm leading-7 text-slate-400">
                A polished virtual laboratory ecosystem designed to transform practical engineering education through modern cloud-based learning.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white">Quick Links</h4>
              <ul className="mt-4 space-y-2 text-sm">
                <li><a href="#home" className="transition hover:text-white">Home</a></li>
                <li><a href="#about" className="transition hover:text-white">About</a></li>
                <li><a href="#laboratories" className="transition hover:text-white">Labs</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white">Support</h4>
              <ul className="mt-4 space-y-2 text-sm">
                <li><Link to="/student-login" className="transition hover:text-white">Student Login</Link></li>
                <li><Link to="/login" className="transition hover:text-white">Portal Login</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-10 border-t border-slate-700 pt-6 text-center text-sm text-slate-400">
            <p>&copy; {new Date().getFullYear()} SmartLabX Educational Ecosystem. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
