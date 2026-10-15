const express = require('express');

const router = express.Router();

const homeContent = {
  highlights: [
    { title: 'Anywhere Access', text: 'Run practical sessions from any device, anywhere in the world.' },
    { title: 'Secure Workspaces', text: 'Keep labs isolated and protected for safe learning experiences.' },
    { title: 'Live Insights', text: 'Track progress and evaluate submissions in real time.' },
  ],
  learningSteps: [
    { number: '01', title: 'Choose your lab', text: 'Pick Database, Computer Networks, or Operating Systems and enter the right workspace.' },
    { number: '02', title: 'Run the experiment', text: 'Build, simulate, and test your practical work in a guided virtual lab environment.' },
    { number: '03', title: 'Submit and improve', text: 'Submit your work, review feedback, and strengthen the skills you will use in your career.' },
  ],
  labBenefits: [
    { title: 'Interactive experiments', text: 'Change inputs, run simulations, and see how systems respond in real time.' },
    { title: 'Guided practical work', text: 'Follow structured experiment steps that make complex computer science topics easier to understand.' },
    { title: 'Feedback and evaluation', text: 'Submit reports, prepare for viva, and track your progress with meaningful feedback.' },
  ],
  labs: [
    { title: 'Database Management', description: 'Practice SQL, schema design, and query optimization in a guided environment.', practice: ['SQL queries', 'ER diagrams', 'Database design'], imageKey: 'dbms' },
    { title: 'Computer Networks', description: 'Simulate routing, protocols, and topology design with live feedback.', practice: ['Network topology', 'Routing', 'Protocols'], imageKey: 'networks' },
    { title: 'Operating Systems', description: 'Explore CPU scheduling, memory allocation, and file systems interactively.', practice: ['CPU scheduling', 'Memory management', 'Deadlocks'], imageKey: 'operatingSystems' },
  ],
  upcomingExperiments: [
    { lab: 'Database Management', title: 'SQL Query Practice', meta: 'Queries and optimization', accent: 'blue' },
    { lab: 'Computer Networks', title: 'Network Topology Builder', meta: 'Devices and routing', accent: 'cyan' },
    { lab: 'Operating Systems', title: 'CPU Scheduling Lab', meta: 'Process scheduling', accent: 'emerald' },
  ],
  announcements: [
    { date: '01', month: 'SEP', title: 'Virtual lab access is now available', text: 'Students can enter all three subject workspaces from the home page.' },
    { date: '05', month: 'SEP', title: 'Submit your practical reports', text: 'Remember to complete your report and viva preparation after each experiment.' },
  ],
};

router.get('/', (req, res) => {
  res.json(homeContent);
});

module.exports = router;