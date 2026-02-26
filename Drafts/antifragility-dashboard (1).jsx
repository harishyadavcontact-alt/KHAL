import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, Cell, PieChart, Pie } from 'recharts';
import { AlertTriangle, TrendingUp, Shield, Target, Clock, Zap, Users, DollarSign, Home, Globe, Activity, ChevronRight, ChevronDown, Plus, X, Check, ZoomIn, ZoomOut, Filter, Import } from 'lucide-react';

// ============================================
// CORE DATA MODELS - THIS IS YOUR SPREADSHEET STRUCTURE
// ============================================

const INITIAL_DOMAINS = {
  // MACRO DOMAINS (Laws of the Universe)
  physics: {
    id: 'physics',
    name: 'Physics',
    law: 'Laws of Universe',
    icon: '⚛️',
    volatilitySource: 'Grid collapse, CME, natural disasters',
    stakes: 9,
    risk: 8,
    vulnerabilities: ['Grid dependency', 'CME exposure', 'Natural disaster'],
    currentFragility: 72,
    hedgeCompletion: 20,
    edgeActive: 0,
  },
  biology: {
    id: 'biology',
    name: 'Biology',
    law: 'Laws of Nature',
    icon: '🧬',
    volatilitySource: 'Atrophy, disease, aging',
    stakes: 7,
    risk: 6,
    vulnerabilities: ['Physical decay', 'Health risks', 'Aging'],
    currentFragility: 42,
    hedgeCompletion: 30,
    edgeActive: 1,
  },
  ecology: {
    id: 'ecology',
    name: 'Ecology',
    law: 'Law of Jungle',
    icon: '🦁',
    volatilitySource: 'Dominance hierarchy, predation',
    stakes: 6,
    risk: 5,
    vulnerabilities: ['Competition', 'Resource theft', 'Power dynamics'],
    currentFragility: 30,
    hedgeCompletion: 40,
    edgeActive: 2,
  },
  politics: {
    id: 'politics',
    name: 'Politics',
    law: 'Law of the Land',
    icon: '⚖️',
    volatilitySource: 'Legislation, violence, lawfare',
    stakes: 8,
    risk: 7,
    vulnerabilities: ['Asset seizure', 'Legal risk', 'Persecution'],
    currentFragility: 56,
    hedgeCompletion: 25,
    edgeActive: 1,
  },
  finance: {
    id: 'finance',
    name: 'Finance',
    law: 'Law of Time',
    icon: '💰',
    volatilitySource: 'Debt, currency collapse, poverty',
    stakes: 10,
    risk: 8,
    vulnerabilities: ['Debt exposure', 'Fiat risk', 'Market volatility'],
    currentFragility: 80,
    hedgeCompletion: 35,
    edgeActive: 3,
  },
  nurture: {
    id: 'nurture',
    name: 'Nurture',
    law: 'Laws of Nurture',
    icon: '🎭',
    volatilitySource: 'Culture, madness of crowds',
    stakes: 5,
    risk: 4,
    vulnerabilities: ['Reputation risk', 'Social pressure', 'Cancel culture'],
    currentFragility: 20,
    hedgeCompletion: 50,
    edgeActive: 2,
  },
};

// HIERARCHICAL DOMAINS (Your subsections)
const DOMAIN_HIERARCHY = {
  personal: {
    name: 'Personal',
    subdomains: ['health', 'skills', 'mindset', 'relationships'],
  },
  familial: {
    name: 'Familial',
    subdomains: ['spouse', 'children', 'parents', 'extended'],
  },
  social: {
    name: 'Social',
    subdomains: ['friends', 'network', 'community', 'reputation'],
  },
  economic: {
    name: 'Economic',
    subdomains: ['income', 'assets', 'debt', 'investments'],
  },
  political: {
    name: 'Political',
    subdomains: ['local', 'national', 'international', 'legal'],
  },
  private: {
    name: 'Private (Covert)',
    subdomains: ['hidden_assets', 'backup_plans', 'escape_routes', 'contingencies'],
  },
  public: {
    name: 'Public (Overt)',
    subdomains: ['brand', 'stated_positions', 'public_assets', 'known_alliances'],
  },
};

// STRATEGY MATRIX: Overt/Covert × Ally/Enemy × Offense/Defense = 8 combinations
const STRATEGY_MATRIX = [
  { id: 1, overt: true, ally: true, offense: true, label: 'Public Alliance Attack', example: 'Partnership announcement' },
  { id: 2, overt: true, ally: true, offense: false, label: 'Public Alliance Defense', example: 'Joint statement defending position' },
  { id: 3, overt: true, ally: false, offense: true, label: 'Public Enemy Attack', example: 'Public criticism, lawsuit' },
  { id: 4, overt: true, ally: false, offense: false, label: 'Public Enemy Defense', example: 'Counter-statement, PR defense' },
  { id: 5, overt: false, ally: true, offense: true, label: 'Covert Alliance Attack', example: 'Secret partnership to outmaneuver enemy' },
  { id: 6, overt: false, ally: true, offense: false, label: 'Covert Alliance Defense', example: 'Backchannel support, hidden hedge' },
  { id: 7, overt: false, ally: false, offense: true, label: 'Covert Enemy Attack', example: 'Short position, anonymous expose' },
  { id: 8, overt: false, ally: false, offense: false, label: 'Covert Enemy Defense', example: 'Hidden safeguards against enemy' },
];

const Dashboard = () => {
  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const [currentTime, setCurrentTime] = useState(new Date());
  const [age, setAge] = useState(30);
  const [lifeExpectancy, setLifeExpectancy] = useState(80);
  const [domains, setDomains] = useState(INITIAL_DOMAINS);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [view, setView] = useState('mission-command'); // mission-command, war-gaming, surgical-execution
  
  // VIRTUE SPIRAL STAGES
  const [virtueSpiral, setVirtueSpiral] = useState({
    stage1_fragile: 60, // % identifying vulnerabilities
    stage2_robust: 30, // % hedging affairs
    stage3_antifragile: 15, // % executing interests
    stage4_convex: 5, // % compounding wins
  });

  // Time tracking
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculate life metrics
  const timeOnEarth = age * 365.25 * 24 * 60 * 60;
  const timeRemaining = (lifeExpectancy - age) * 365.25 * 24 * 60 * 60;
  const lifeProgress = (age / lifeExpectancy) * 100;
  const daysLived = Math.floor(age * 365.25);
  const daysRemaining = Math.floor((lifeExpectancy - age) * 365.25);

  // ============================================
  // JENSEN'S INEQUALITY VISUALIZATION DATA
  // ============================================
  // Shows: E[f(X)] ≠ f(E[X]) for convex/concave functions
  // Concave (bad) = average of outcomes < outcome of average
  // Convex (good) = average of outcomes > outcome of average
  const jensensData = [
    { x: 0, linear: 0, concave: 0, convex: 0, label: 'Low Vol' },
    { x: 20, linear: 20, concave: 35, convex: 10, label: '' },
    { x: 40, linear: 40, concave: 55, convex: 25, label: '' },
    { x: 60, linear: 60, concave: 70, convex: 45, label: 'Med Vol' },
    { x: 80, linear: 80, concave: 82, convex: 70, label: '' },
    { x: 100, linear: 100, concave: 90, convex: 100, label: 'High Vol' },
  ];

  // ============================================
  // ERGODICITY VISUALIZATION DATA
  // ============================================
  // Non-ergodic = time average ≠ ensemble average (YOU can die even if average survives)
  // Ergodic = time average = ensemble average (safe to take repeated bets)
  const ergodicityData = [
    { 
      trial: 1, 
      ensembleAvg: 50, 
      path1: 55, 
      path2: 45, 
      path3: 52,
      yourPath: 55,
      bankruptcyLine: 0,
    },
    { 
      trial: 2, 
      ensembleAvg: 50, 
      path1: 60, 
      path2: 30, 
      path3: 65,
      yourPath: 62,
      bankruptcyLine: 0,
    },
    { 
      trial: 3, 
      ensembleAvg: 50, 
      path1: 70, 
      path2: 0, // BANKRUPTCY
      path3: 75,
      yourPath: 48,
      bankruptcyLine: 0,
    },
    { 
      trial: 4, 
      ensembleAvg: 50, 
      path1: 80, 
      path2: 0, 
      path3: 85,
      yourPath: 35,
      bankruptcyLine: 0,
    },
    { 
      trial: 5, 
      ensembleAvg: 50, 
      path1: 90, 
      path2: 0, 
      path3: 95,
      yourPath: 25,
      bankruptcyLine: 0,
    },
  ];

  // ============================================
  // TAIL RISK VISUALIZATION DATA
  // ============================================
  // Shows fat tails vs normal distribution
  const tailRiskData = [
    { x: -4, normal: 0.0001, fatTail: 0.05, label: 'Extreme Loss' },
    { x: -3, normal: 0.004, fatTail: 0.1, label: '' },
    { x: -2, normal: 0.054, fatTail: 0.15, label: 'Left Tail' },
    { x: -1, normal: 0.242, fatTail: 0.2, label: '' },
    { x: 0, normal: 0.399, fatTail: 0.25, label: 'Mean' },
    { x: 1, normal: 0.242, fatTail: 0.2, label: '' },
    { x: 2, normal: 0.054, fatTail: 0.15, label: 'Right Tail' },
    { x: 3, normal: 0.004, fatTail: 0.1, label: '' },
    { x: 4, normal: 0.0001, fatTail: 0.05, label: 'Extreme Gain' },
  ];

  // ============================================
  // BARBELL PORTFOLIO VISUALIZATION
  // ============================================
  const barbellData = [
    { category: 'Ultra-Safe\n(90%)', value: 90, color: '#10b981' },
    { category: 'Ultra-Risk\n(10%)', value: 10, color: '#ef4444' },
  ];

  // Calculate aggregate fragility
  const avgFragility = Object.values(domains).reduce((sum, d) => sum + d.currentFragility, 0) / 6;
  const barbellBalance = {
    defense: Object.values(domains).reduce((sum, d) => sum + d.hedgeCompletion, 0) / 6,
    offense: Object.values(domains).reduce((sum, d) => sum + d.edgeActive, 0),
  };

  // ============================================
  // RADAR CHART DATA (Fragility Spider)
  // ============================================
  const radarData = Object.values(domains).map(d => ({
    domain: d.name,
    fragility: d.currentFragility,
    fullMark: 100,
  }));

  // ============================================
  // VOLATILITY MAPPING DATA
  // ============================================
  // X-axis: Probability, Y-axis: Impact
  const volatilityMap = Object.values(domains).map(d => ({
    name: d.name,
    probability: d.risk * 10, // Convert 1-10 to %
    impact: d.stakes * 10,
    fragility: d.currentFragility,
    icon: d.icon,
  }));

  // ============================================
  // RENDER FUNCTIONS
  // ============================================

  const renderMissionCommand = () => (
    <div className="space-y-4">
      {/* HUD - Time & Life Tracking */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Clock className="w-6 h-6" />
            MISSION COMMAND - HUD
          </h2>
          <div className="text-right">
            <div className="text-sm text-gray-400">Current Time</div>
            <div className="text-xl font-mono text-white">
              {currentTime.toLocaleTimeString()}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded p-4">
            <div className="text-gray-400 text-sm mb-1">Age</div>
            <div className="text-3xl font-bold text-blue-400">{age}y</div>
            <div className="text-xs text-gray-500">{daysLived.toLocaleString()} days lived</div>
          </div>
          
          <div className="bg-gray-800 rounded p-4">
            <div className="text-gray-400 text-sm mb-1">Time Remaining</div>
            <div className="text-3xl font-bold text-orange-400">{lifeExpectancy - age}y</div>
            <div className="text-xs text-gray-500">{daysRemaining.toLocaleString()} days left</div>
          </div>
          
          <div className="bg-gray-800 rounded p-4">
            <div className="text-gray-400 text-sm mb-1">Life Progress</div>
            <div className="text-3xl font-bold text-purple-400">{lifeProgress.toFixed(1)}%</div>
            <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
              <div 
                className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${lifeProgress}%` }}
              />
            </div>
          </div>
          
          <div className="bg-gray-800 rounded p-4">
            <div className="text-gray-400 text-sm mb-1">Location</div>
            <div className="text-lg font-bold text-green-400">Chennai, IN</div>
            <div className="text-xs text-gray-500">5.5h GMT+5:30</div>
          </div>
        </div>
      </div>

      {/* Fragility Overview & Barbell Balance */}
      <div className="grid grid-cols-2 gap-4">
        {/* Fragility Spider Chart */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Fragility Radar - 6 Domains
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#4b5563" />
              <PolarAngleAxis dataKey="domain" tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#9ca3af' }} />
              <Radar name="Fragility" dataKey="fragility" stroke="#ef4444" fill="#ef4444" fillOpacity={0.5} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
              />
            </RadarChart>
          </ResponsiveContainer>
          <div className="text-center mt-2">
            <div className="text-sm text-gray-400">Average Fragility Score</div>
            <div className={`text-3xl font-bold ${avgFragility > 50 ? 'text-red-400' : avgFragility > 30 ? 'text-yellow-400' : 'text-green-400'}`}>
              {avgFragility.toFixed(0)}
            </div>
          </div>
        </div>

        {/* Barbell Balance */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-500" />
            Barbell Strategy - 90/10
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barbellData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
              <XAxis type="number" domain={[0, 100]} tick={{ fill: '#9ca3af' }} />
              <YAxis type="category" dataKey="category" tick={{ fill: '#9ca3af' }} width={100} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563', borderRadius: '8px' }}
              />
              <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                {barbellData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-green-900/30 rounded p-3">
              <div className="text-sm text-green-400">Defense (Affairs)</div>
              <div className="text-2xl font-bold text-green-300">{barbellBalance.defense.toFixed(0)}%</div>
            </div>
            <div className="bg-red-900/30 rounded p-3">
              <div className="text-sm text-red-400">Offense (Interests)</div>
              <div className="text-2xl font-bold text-red-300">{barbellBalance.offense} active</div>
            </div>
          </div>
        </div>
      </div>

      {/* Virtue Spiral Progress */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-500" />
          Virtue Spiral - Path to Antifragility
        </h3>
        <div className="space-y-3">
          {Object.entries(virtueSpiral).map(([stage, progress], idx) => {
            const labels = ['Stage 1: FRAGILE → Identify', 'Stage 2: ROBUST → Hedge', 'Stage 3: ANTIFRAGILE → Execute', 'Stage 4: CONVEX → Compound'];
            const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6'];
            return (
              <div key={stage}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-300">{labels[idx]}</span>
                  <span className="text-sm font-bold" style={{ color: colors[idx] }}>{progress}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div 
                    className="h-3 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${progress}%`,
                      backgroundColor: colors[idx]
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Domain Quick Actions */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">6 Domains - Click to Drill Down</h3>
        <div className="grid grid-cols-3 gap-3">
          {Object.values(domains).map(domain => (
            <button
              key={domain.id}
              onClick={() => {
                setSelectedDomain(domain.id);
                setActiveTab('state-of-art');
              }}
              className="bg-gray-700 hover:bg-gray-600 rounded-lg p-4 text-left transition-all border border-gray-600 hover:border-blue-500"
            >
              <div className="text-3xl mb-2">{domain.icon}</div>
              <div className="font-bold text-white">{domain.name}</div>
              <div className="text-xs text-gray-400 mb-2">{domain.law}</div>
              <div className="flex items-center justify-between">
                <div className="text-xs">
                  <span className="text-gray-400">Fragility: </span>
                  <span className={`font-bold ${domain.currentFragility > 50 ? 'text-red-400' : 'text-green-400'}`}>
                    {domain.currentFragility}
                  </span>
                </div>
                <div className="text-xs">
                  <span className="text-gray-400">Hedge: </span>
                  <span className="font-bold text-blue-400">{domain.hedgeCompletion}%</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderWarGaming = () => (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-red-900 to-red-800 rounded-lg p-6 border border-red-700">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Zap className="w-6 h-6" />
          WAR GAMING - Ergodicity & Jensen's Inequality
        </h2>
        <p className="text-gray-300 mt-2">Plan for tail risks. Think convex. Understand path dependence.</p>
      </div>

      {/* Jensen's Inequality Visualization */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-2">Jensen's Inequality - Convex vs Concave Payoffs</h3>
        <p className="text-sm text-gray-400 mb-4">
          🔴 Concave (bad): You lose from volatility. E[f(X)] &lt; f(E[X])<br/>
          🟢 Convex (good): You gain from volatility. E[f(X)] &gt; f(E[X])<br/>
          ⚪ Linear: Volatility neutral.
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={jensensData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
            <XAxis dataKey="x" label={{ value: 'Volatility →', position: 'insideBottom', offset: -5, fill: '#9ca3af' }} tick={{ fill: '#9ca3af' }} />
            <YAxis label={{ value: '← Payoff', angle: -90, position: 'insideLeft', fill: '#9ca3af' }} tick={{ fill: '#9ca3af' }} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563', borderRadius: '8px' }}
            />
            <Legend />
            <Line type="monotone" dataKey="convex" stroke="#10b981" strokeWidth={3} name="Convex (Antifragile)" dot={{ fill: '#10b981', r: 5 }} />
            <Line type="monotone" dataKey="linear" stroke="#6b7280" strokeWidth={2} name="Linear (Neutral)" strokeDasharray="5 5" />
            <Line type="monotone" dataKey="concave" stroke="#ef4444" strokeWidth={3} name="Concave (Fragile)" dot={{ fill: '#ef4444', r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-4 bg-gray-900 rounded p-4">
          <div className="text-sm text-gray-300">
            <strong className="text-green-400">Strategy:</strong> Design affairs with limited downside (hedge) and interests with unlimited upside (edge). Avoid middle ground.
          </div>
        </div>
      </div>

      {/* Ergodicity Visualization */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-2">Ergodicity - Time Average vs Ensemble Average</h3>
        <p className="text-sm text-gray-400 mb-4">
          ⚠️ Non-ergodic domain: Even if average survives, YOU can die (path 2 bankrupted).<br/>
          💀 One bad trial can end your game. Avoid ruin at all costs.
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={ergodicityData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
            <XAxis dataKey="trial" label={{ value: 'Time / Trials →', position: 'insideBottom', offset: -5, fill: '#9ca3af' }} tick={{ fill: '#9ca3af' }} />
            <YAxis label={{ value: '← Wealth', angle: -90, position: 'insideLeft', fill: '#9ca3af' }} tick={{ fill: '#9ca3af' }} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563', borderRadius: '8px' }}
            />
            <Legend />
            <Line type="monotone" dataKey="ensembleAvg" stroke="#6b7280" strokeWidth={2} name="Ensemble Avg (Others)" strokeDasharray="5 5" />
            <Line type="monotone" dataKey="path1" stroke="#10b981" strokeWidth={2} name="Survivor Path" />
            <Line type="monotone" dataKey="path2" stroke="#ef4444" strokeWidth={2} name="Bankrupt Path" />
            <Line type="monotone" dataKey="path3" stroke="#3b82f6" strokeWidth={2} name="Winner Path" />
            <Line type="monotone" dataKey="yourPath" stroke="#f59e0b" strokeWidth={3} name="YOUR Path" dot={{ fill: '#f59e0b', r: 6 }} />
            <Line type="monotone" dataKey="bankruptcyLine" stroke="#dc2626" strokeWidth={2} strokeDasharray="3 3" name="Ruin" />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-4 bg-gray-900 rounded p-4">
          <div className="text-sm text-gray-300">
            <strong className="text-orange-400">Key Insight:</strong> Never risk ruin. Use barbell: 90% safe (can't bankrupt you) + 10% asymmetric (can't kill you if it fails).
          </div>
        </div>
      </div>

      {/* Tail Risk Distribution */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-2">Tail Risk - Fat Tails vs Normal Distribution</h3>
        <p className="text-sm text-gray-400 mb-4">
          🔴 Fat tails: Extreme events happen MORE than normal distribution predicts.<br/>
          🎯 Strategy: Over-prepare for left tail (hedge), over-expose to right tail (edge).
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={tailRiskData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
            <XAxis dataKey="x" label={{ value: 'Standard Deviations from Mean', position: 'insideBottom', offset: -5, fill: '#9ca3af' }} tick={{ fill: '#9ca3af' }} />
            <YAxis label={{ value: '← Probability', angle: -90, position: 'insideLeft', fill: '#9ca3af' }} tick={{ fill: '#9ca3af' }} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563', borderRadius: '8px' }}
            />
            <Legend />
            <Area type="monotone" dataKey="normal" stroke="#6b7280" fill="#6b7280" fillOpacity={0.3} name="Normal (Naive)" />
            <Area type="monotone" dataKey="fatTail" stroke="#ef4444" fill="#ef4444" fillOpacity={0.5} name="Fat Tails (Reality)" />
          </AreaChart>
        </ResponsiveContainer>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="bg-red-900/30 rounded p-3">
            <div className="text-sm text-red-400">Left Tail (Catastrophe)</div>
            <div className="text-xs text-gray-300 mt-1">Hedge: Insurance, Faraday cage, gold, supplies</div>
          </div>
          <div className="bg-green-900/30 rounded p-3">
            <div className="text-sm text-green-400">Right Tail (Windfall)</div>
            <div className="text-xs text-gray-300 mt-1">Edge: Bitcoin, startups, OTM options, skills</div>
          </div>
        </div>
      </div>

      {/* Volatility Mapping (Risk vs Impact) */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-2">Volatility Mapping - Probability vs Impact</h3>
        <p className="text-sm text-gray-400 mb-4">
          Size of bubble = current fragility. Top-right = highest priority to hedge.
        </p>
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
            <XAxis 
              type="number" 
              dataKey="probability" 
              name="Probability (%)" 
              label={{ value: 'Probability (Risk) →', position: 'insideBottom', offset: -5, fill: '#9ca3af' }}
              tick={{ fill: '#9ca3af' }}
              domain={[0, 100]}
            />
            <YAxis 
              type="number" 
              dataKey="impact" 
              name="Impact (Stakes)" 
              label={{ value: '← Impact (Stakes)', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
              tick={{ fill: '#9ca3af' }}
              domain={[0, 100]}
            />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563', borderRadius: '8px' }}
              formatter={(value, name, props) => {
                if (name === 'probability') return [`${value}%`, 'Probability'];
                if (name === 'impact') return [`${value}%`, 'Impact'];
                return [value, name];
              }}
            />
            <Legend />
            <Scatter name="Domains" data={volatilityMap} fill="#8884d8">
              {volatilityMap.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fragility > 50 ? '#ef4444' : entry.fragility > 30 ? '#f59e0b' : '#10b981'} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
        <div className="mt-4 grid grid-cols-6 gap-2">
          {volatilityMap.map(domain => (
            <div key={domain.name} className="bg-gray-900 rounded p-2 text-center">
              <div className="text-2xl">{domain.icon}</div>
              <div className="text-xs text-gray-400">{domain.name}</div>
              <div className="text-xs font-bold text-white">{domain.fragility}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Strategy Matrix: Overt/Covert × Ally/Enemy × Offense/Defense */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">Strategy Matrix - 8 Combinations</h3>
        <div className="grid grid-cols-2 gap-4">
          {STRATEGY_MATRIX.map(strat => (
            <div 
              key={strat.id}
              className={`rounded-lg p-4 border-2 ${
                strat.offense ? 'bg-red-900/20 border-red-700' : 'bg-blue-900/20 border-blue-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {strat.overt ? '👁️' : '🕵️'} 
                  {strat.ally ? '🤝' : '⚔️'}
                  {strat.offense ? '⚡' : '🛡️'}
                </div>
                <div className="text-xs bg-gray-900 rounded px-2 py-1 text-gray-400">
                  #{strat.id}
                </div>
              </div>
              <div className="font-bold text-white text-sm mb-1">{strat.label}</div>
              <div className="text-xs text-gray-400">{strat.example}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderDomainDetail = () => {
    if (!selectedDomain) return null;
    const domain = domains[selectedDomain];

    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-blue-900 to-blue-800 rounded-lg p-6 border border-blue-700">
          <button 
            onClick={() => setSelectedDomain(null)}
            className="text-blue-300 hover:text-white mb-4 flex items-center gap-2"
          >
            ← Back to Overview
          </button>
          <div className="flex items-center gap-4">
            <div className="text-6xl">{domain.icon}</div>
            <div>
              <h2 className="text-3xl font-bold text-white">{domain.name}</h2>
              <p className="text-gray-300">{domain.law}</p>
              <p className="text-sm text-gray-400 mt-1">Volatility: {domain.volatilitySource}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-gray-800 p-2 rounded-lg">
          {['state-of-art', 'state-of-affairs', 'decision-canvas'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 px-4 rounded transition-all ${
                activeTab === tab 
                  ? 'bg-blue-600 text-white font-bold' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {tab.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            </button>
          ))}
        </div>

        {/* State of Art */}
        {activeTab === 'state-of-art' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-bold text-white mb-4">Philosopher's Stone - Asymmetry</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Stakes (What You Could Lose)</span>
                    <input 
                      type="number" 
                      value={domain.stakes}
                      onChange={(e) => {
                        const newDomains = {...domains};
                        newDomains[selectedDomain].stakes = parseInt(e.target.value);
                        newDomains[selectedDomain].currentFragility = newDomains[selectedDomain].stakes * newDomains[selectedDomain].risk;
                        setDomains(newDomains);
                      }}
                      className="w-20 bg-gray-700 text-white rounded px-2 py-1 text-center font-bold"
                      min="1"
                      max="10"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Risk (Probability)</span>
                    <input 
                      type="number" 
                      value={domain.risk}
                      onChange={(e) => {
                        const newDomains = {...domains};
                        newDomains[selectedDomain].risk = parseInt(e.target.value);
                        newDomains[selectedDomain].currentFragility = newDomains[selectedDomain].stakes * newDomains[selectedDomain].risk;
                        setDomains(newDomains);
                      }}
                      className="w-20 bg-gray-700 text-white rounded px-2 py-1 text-center font-bold"
                      min="1"
                      max="10"
                    />
                  </div>
                  <div className="border-t border-gray-700 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 font-bold">Fragility Score</span>
                      <span className={`text-2xl font-bold ${
                        domain.currentFragility > 50 ? 'text-red-400' : 
                        domain.currentFragility > 30 ? 'text-yellow-400' : 
                        'text-green-400'
                      }`}>
                        {domain.currentFragility}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-bold text-white mb-4">Vulnerabilities (Non-Linearity)</h3>
                <div className="space-y-2">
                  {domain.vulnerabilities.map((vuln, idx) => (
                    <div key={idx} className="flex items-start gap-2 bg-gray-900 rounded p-2">
                      <AlertTriangle className="w-4 h-4 text-red-500 mt-1 flex-shrink-0" />
                      <span className="text-sm text-gray-300">{vuln}</span>
                    </div>
                  ))}
                </div>
                <button className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition-all">
                  + Add Vulnerability
                </button>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-bold text-white mb-4">Barbell Strategy - Ends</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-900/20 rounded-lg p-4 border border-green-700">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-5 h-5 text-green-400" />
                    <h4 className="font-bold text-green-300">HEDGE (90% - Defense)</h4>
                  </div>
                  <div className="text-sm text-gray-300 mb-2">Cap downside. Remove tail risk.</div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-400">Completion:</span>
                    <span className="text-lg font-bold text-green-400">{domain.hedgeCompletion}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${domain.hedgeCompletion}%` }}
                    />
                  </div>
                </div>

                <div className="bg-red-900/20 rounded-lg p-4 border border-red-700">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="w-5 h-5 text-red-400" />
                    <h4 className="font-bold text-red-300">EDGE (10% - Offense)</h4>
                  </div>
                  <div className="text-sm text-gray-300 mb-2">Uncap upside. Asymmetric bets.</div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-400">Active Bets:</span>
                    <span className="text-lg font-bold text-red-400">{domain.edgeActive}</span>
                  </div>
                  <button className="w-full bg-red-600 hover:bg-red-700 text-white py-1 rounded text-sm">
                    + Add Interest
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-bold text-white mb-4">Means - Heuristics & Methods</h3>
              <div className="space-y-2">
                <div className="bg-gray-900 rounded p-3">
                  <div className="font-bold text-blue-400 mb-1">Via Negativa</div>
                  <div className="text-sm text-gray-400">Remove fragility first. Stop doing stupid things.</div>
                </div>
                <div className="bg-gray-900 rounded p-3">
                  <div className="font-bold text-blue-400 mb-1">Lindy Effect</div>
                  <div className="text-sm text-gray-400">Prefer what has survived time. Old &gt; New.</div>
                </div>
                <div className="bg-gray-900 rounded p-3">
                  <div className="font-bold text-blue-400 mb-1">Skin in the Game</div>
                  <div className="text-sm text-gray-400">Follow revealed preferences. Watch money/time, not words.</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* State of Affairs */}
        {activeTab === 'state-of-affairs' && (
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-bold text-white mb-4">Affairs (Defensive Tasks)</h3>
              <div className="space-y-3">
                <div className="bg-gray-900 rounded p-4 border-l-4 border-green-500">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-bold text-white">Task: Clear all debt</div>
                    <div className="text-xs bg-green-900 text-green-300 px-2 py-1 rounded">HIGH PRIORITY</div>
                  </div>
                  <div className="text-sm text-gray-400 mb-2">Stakes: 10 | Risk: 9 | Priority: 90</div>
                  <div className="flex gap-2">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded">View Subtasks</button>
                    <button className="bg-gray-700 hover:bg-gray-600 text-white text-xs px-3 py-1 rounded">Schedule</button>
                  </div>
                </div>
                <div className="bg-gray-900 rounded p-4 border-l-4 border-yellow-500">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-bold text-white">Task: Build Faraday cage</div>
                    <div className="text-xs bg-yellow-900 text-yellow-300 px-2 py-1 rounded">MEDIUM</div>
                  </div>
                  <div className="text-sm text-gray-400 mb-2">Stakes: 9 | Risk: 8 | Priority: 72</div>
                  <div className="flex gap-2">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded">View Subtasks</button>
                    <button className="bg-gray-700 hover:bg-gray-600 text-white text-xs px-3 py-1 rounded">Schedule</button>
                  </div>
                </div>
              </div>
              <button className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded">
                + Add Affair
              </button>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-bold text-white mb-4">Interests (Offensive Bets)</h3>
              <div className="space-y-3">
                <div className="bg-gray-900 rounded p-4 border-l-4 border-red-500">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-bold text-white">Bet: Bitcoin position (10%)</div>
                    <div className="text-xs bg-red-900 text-red-300 px-2 py-1 rounded">ASYMMETRIC</div>
                  </div>
                  <div className="text-sm text-gray-400 mb-2">Upside: Unlimited | Downside: 10% max | Convexity: 5.0</div>
                  <div className="flex gap-2">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded">View Plan</button>
                    <button className="bg-gray-700 hover:bg-gray-600 text-white text-xs px-3 py-1 rounded">Execute</button>
                  </div>
                </div>
              </div>
              <button className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded">
                + Add Interest
              </button>
            </div>
          </div>
        )}

        {/* Decision Canvas */}
        {activeTab === 'decision-canvas' && (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-bold text-white mb-4">Decision Writing Canvas - Think Clearly</h3>
            <p className="text-sm text-gray-400 mb-4">
              Sit your ass down. Define ends (barbell), means (heuristics), affairs, and interests. War game this domain.
            </p>
            <textarea
              className="w-full h-96 bg-gray-900 text-white rounded-lg p-4 border border-gray-700 focus:border-blue-500 focus:outline-none font-mono text-sm"
              placeholder="Write your strategic thinking here...

What are the ENDS? (Barbell strategy)
- Hedge (90%): 
- Edge (10%): 

What are the MEANS? (Heuristics, methods, techniques)
- 

What are the AFFAIRS? (Defensive tasks to remove fragility)
- 

What are the INTERESTS? (Offensive bets for asymmetry)
- 

War Gaming:
- Best case scenario:
- Worst case scenario:
- Most likely scenario:
- Preparation needed:"
            />
            <div className="mt-4 flex gap-2">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-bold">
                Save Decision Log
              </button>
              <button className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded">
                Create Tasks from This
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ============================================
  // MAIN RENDER
  // ============================================
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Top Navigation */}
        <div className="mb-6 flex gap-2">
          {[
            { id: 'mission-command', label: 'Mission Command', icon: Target },
            { id: 'war-gaming', label: 'War Gaming', icon: Zap },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => {
                setView(id);
                setSelectedDomain(null);
              }}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all ${
                view === id 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        {selectedDomain ? renderDomainDetail() : 
         view === 'mission-command' ? renderMissionCommand() : 
         renderWarGaming()}
      </div>
    </div>
  );
};

export default Dashboard;
