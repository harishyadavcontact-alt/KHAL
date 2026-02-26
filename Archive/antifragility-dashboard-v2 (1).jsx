import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertTriangle, TrendingUp, Shield, Target, Clock, Zap, ChevronRight, ChevronDown, Plus, X, Check, ZoomIn, ZoomOut, Filter, Import, Edit2, Save } from 'lucide-react';

// ============================================
// COMPLETE DATA STRUCTURE FROM EXCEL
// ============================================

const COMPLETE_HIERARCHY = {
  // MACRO DOMAINS (Level 1)
  macroDomains: [
    {
      id: 'physics',
      level: 1,
      name: 'PHYSICS - Law of Universe',
      stakes: 9,
      risk: 8,
      fragility: 72,
      hedgeCompletion: 20,
      edgeActive: 0,
      status: '🔴 CRITICAL',
      icon: '⚛️',
      stateOfArt: {
        philosophersStone: 'Transform volatility into survival through preparation',
        vulnerabilities: ['Grid collapse', 'CME exposure', 'Natural disasters'],
        ends: {
          barbell: {
            hedge: ['Build Faraday cages', 'Stock 2yr supplies', 'Off-grid power'],
            edge: ['Solar panel investments', 'Disaster recovery consulting'],
          },
        },
        means: {
          heuristics: [
            { name: 'Better Safe Than Sorry', methods: ['Over-preparation', 'Redundancy', 'Faraday protection'] },
            { name: 'Via Negativa', methods: ['Remove grid dependency', 'Eliminate single points of failure'] },
          ],
        },
      },
      stateOfAffairs: {
        affairs: [
          { id: 'AF-PH001', task: 'Build Faraday cage', priority: 72, status: 'NOT STARTED', due: 14, progress: 0, subtasks: 3 },
          { id: 'AF-PH002', task: 'Stock 2yr supplies', priority: 65, status: 'NOT STARTED', due: 60, progress: 0, subtasks: 5 },
        ],
        interests: [],
      },
    },
    {
      id: 'finance',
      level: 1,
      name: 'FINANCE - Law of Time',
      stakes: 10,
      risk: 8,
      fragility: 80,
      hedgeCompletion: 35,
      edgeActive: 3,
      status: '🔴 CRITICAL',
      icon: '💰',
      stateOfArt: {
        philosophersStone: 'Transform time into antifragile wealth',
        vulnerabilities: ['Debt exposure ($50k)', 'Fiat collapse risk', 'Market volatility'],
        ends: {
          barbell: {
            hedge: ['Clear all debt', 'Buy 50oz gold', 'Offshore trust', '6mo cash reserve'],
            edge: ['Bitcoin 10%', 'OTM AI calls', 'Master sales skill'],
          },
        },
        means: {
          heuristics: [
            { name: 'Fuck You Money', methods: ['Build $1M portfolio', 'Escape wage slavery', 'Rich-get-richer group'] },
            { name: 'Via Negativa', methods: ['Debt elimination', 'Cut toxic assets', 'Remove fragility'] },
            { name: 'Lindy Effect', methods: ['Gold > crypto for defense', 'Trust old institutions', 'Proven methods'] },
          ],
        },
      },
      stateOfAffairs: {
        affairs: [
          { id: 'AF001', task: 'Clear all debt', priority: 90, status: 'IN PROGRESS', due: 30, progress: 0.35, subtasks: 3 },
          { id: 'AF002', task: 'Buy 50oz gold', priority: 80, status: 'NOT STARTED', due: 7, progress: 0, subtasks: 2 },
          { id: 'AF003', task: 'Offshore trust', priority: 70, status: 'NOT STARTED', due: 60, progress: 0, subtasks: 5 },
        ],
        interests: [
          { id: 'IN001', bet: 'Bitcoin 10%', convexity: 5.0, allocation: '$5,000', status: 'NOT STARTED', upside: 'Unlimited', downside: '10% max' },
          { id: 'IN002', bet: 'NVDA OTM calls', convexity: 10.0, allocation: '$500', status: 'NOT STARTED', upside: '100x', downside: 'Premium only' },
          { id: 'IN003', bet: 'Sales mastery', convexity: 999, allocation: '200hrs', status: 'IN PROGRESS', upside: 'Uncapped income', downside: 'Time only' },
        ],
      },
    },
    // Other domains abbreviated for brevity
    { id: 'biology', level: 1, name: 'BIOLOGY - Law of Nature', stakes: 7, risk: 6, fragility: 42, icon: '🧬' },
    { id: 'ecology', level: 1, name: 'ECOLOGY - Law of Jungle', stakes: 6, risk: 5, fragility: 30, icon: '🦁' },
    { id: 'politics', level: 1, name: 'POLITICS - Law of Land', stakes: 8, risk: 7, fragility: 56, icon: '⚖️' },
    { id: 'nurture', level: 1, name: 'NURTURE - Laws of Nurture', stakes: 5, risk: 4, fragility: 20, icon: '🎭' },
  ],
  
  // HIERARCHY SUBSECTIONS (Level 2-3)
  hierarchySections: [
    {
      id: 'personal',
      level: 2,
      name: 'PERSONAL',
      parent: null,
      children: ['personal-health', 'personal-skills', 'personal-mindset'],
      affairs: [
        { id: 'AF-P001', task: 'Annual health checkup', priority: 70, status: 'SCHEDULED', domain: 'health' },
      ],
      interests: [
        { id: 'IN-P001', bet: 'Learn salsa dancing', convexity: 5.0, domain: 'skills' },
      ],
    },
    { id: 'personal-health', level: 3, name: 'Health', parent: 'personal', children: [] },
    { id: 'personal-skills', level: 3, name: 'Skills', parent: 'personal', children: [] },
    { id: 'personal-mindset', level: 3, name: 'Mindset', parent: 'personal', children: [] },
    
    {
      id: 'familial',
      level: 2,
      name: 'FAMILIAL',
      parent: null,
      children: ['familial-spouse', 'familial-children', 'familial-parents'],
      affairs: [
        { id: 'AF-F001', task: 'Update family trust', priority: 85, status: 'NOT STARTED' },
      ],
      interests: [],
    },
    { id: 'familial-spouse', level: 3, name: 'Spouse', parent: 'familial', children: [] },
    { id: 'familial-children', level: 3, name: 'Children', parent: 'familial', children: [] },
    { id: 'familial-parents', level: 3, name: 'Parents', parent: 'familial', children: [] },
    
    {
      id: 'economic',
      level: 2,
      name: 'ECONOMIC',
      parent: null,
      children: ['economic-income', 'economic-assets', 'economic-investments'],
      affairs: [
        { id: 'AF-E001', task: 'Diversify income streams', priority: 75, status: 'IN PROGRESS' },
      ],
      interests: [
        { id: 'IN-E001', bet: 'Startup angel investments', convexity: 8.0, allocation: '$2,500' },
      ],
    },
    { id: 'economic-income', level: 3, name: 'Income', parent: 'economic', children: [] },
    { id: 'economic-assets', level: 3, name: 'Assets', parent: 'economic', children: [] },
    { id: 'economic-investments', level: 3, name: 'Investments', parent: 'economic', children: [] },
    
    { id: 'social', level: 2, name: 'SOCIAL', parent: null, children: ['social-friends', 'social-network', 'social-reputation'] },
    { id: 'social-friends', level: 3, name: 'Friends', parent: 'social', children: [] },
    { id: 'social-network', level: 3, name: 'Network', parent: 'social', children: [] },
    { id: 'social-reputation', level: 3, name: 'Reputation', parent: 'social', children: [] },
    
    { id: 'political', level: 2, name: 'POLITICAL', parent: null, children: ['political-local', 'political-national', 'political-international'] },
    { id: 'political-local', level: 3, name: 'Local', parent: 'political', children: [] },
    { id: 'political-national', level: 3, name: 'National', parent: 'political', children: [] },
    { id: 'political-international', level: 3, name: 'International', parent: 'political', children: [] },
    
    { id: 'private', level: 2, name: 'PRIVATE (Covert)', parent: null, children: ['private-hidden', 'private-contingencies'] },
    { id: 'private-hidden', level: 3, name: 'Hidden Assets', parent: 'private', children: [] },
    { id: 'private-contingencies', level: 3, name: 'Contingencies', parent: 'private', children: [] },
    
    { id: 'public', level: 2, name: 'PUBLIC (Overt)', parent: null, children: ['public-brand', 'public-stated'] },
    { id: 'public-brand', level: 3, name: 'Brand', parent: 'public', children: [] },
    { id: 'public-stated', level: 3, name: 'Stated Positions', parent: 'public', children: [] },
  ],
};

// STRATEGY MATRIX DATA (6 Fronts)
const STRATEGY_FRONTS = [
  { front: 'ALLIES', percentage: 40, status: '🟢 STRONG', moves: 3, strength: 8, notes: 'Partner X, Network Y' },
  { front: 'ENEMIES', percentage: 10, status: '🟡 MONITORED', moves: 1, strength: 6, notes: 'Competitor A' },
  { front: 'OVERT', percentage: 60, status: '🟢 ACTIVE', moves: 5, strength: 7, notes: 'Public brand, rhetoric' },
  { front: 'COVERT', percentage: 40, status: '🟡 BUILDING', moves: 2, strength: 5, notes: 'Hidden assets' },
  { front: 'OFFENSE', percentage: 10, status: '🟢 EXECUTING', moves: 3, strength: 7, notes: 'Interests active' },
  { front: 'DEFENSE', percentage: 90, status: '🟡 IN PROGRESS', moves: 6, strength: 6, notes: 'Affairs 35% done' },
  { front: 'CONVENTIONAL', percentage: 70, status: '🟢 STANDARD', moves: 8, strength: 8, notes: 'By-the-book' },
  { front: 'UNCONVENTIONAL', percentage: 30, status: '🟡 EXPERIMENTAL', moves: 2, strength: 5, notes: 'Guerrilla tactics' },
];

// ============================================
// MAIN DASHBOARD COMPONENT
// ============================================
const Dashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [age, setAge] = useState(30);
  const [lifeExpectancy, setLifeExpectancy] = useState(80);
  const [view, setView] = useState('mission-command');
  const [zoomLevel, setZoomLevel] = useState('macro'); // macro | meso | micro
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [expandedItems, setExpandedItems] = useState({});
  const [showNewInterestModal, setShowNewInterestModal] = useState(false);
  const [filterLevel, setFilterLevel] = useState('all'); // all | level1 | level2 | level3

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const lifeProgress = (age / lifeExpectancy) * 100;
  const daysLived = Math.floor(age * 365.25);
  const daysRemaining = Math.floor((lifeExpectancy - age) * 365.25);

  const toggleExpand = (id) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // ============================================
  // RENDER: HUD (Time Tracking)
  // ============================================
  const renderHUD = () => (
    <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-lg p-4 border border-gray-700 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Clock className="w-5 h-5" />
          HUD - TIME DEPLOYMENT
        </h2>
        <div className="text-right">
          <div className="text-xs text-gray-400">Current Time</div>
          <div className="text-lg font-mono text-white">{currentTime.toLocaleTimeString()}</div>
        </div>
      </div>
      
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-gray-800 rounded p-3">
          <div className="text-gray-400 text-xs mb-1">Age</div>
          <div className="text-2xl font-bold text-blue-400">{age}y</div>
          <div className="text-xs text-gray-500">{daysLived.toLocaleString()} days</div>
        </div>
        
        <div className="bg-gray-800 rounded p-3">
          <div className="text-gray-400 text-xs mb-1">Remaining</div>
          <div className="text-2xl font-bold text-orange-400">{lifeExpectancy - age}y</div>
          <div className="text-xs text-gray-500">{daysRemaining.toLocaleString()} days</div>
        </div>
        
        <div className="bg-gray-800 rounded p-3">
          <div className="text-gray-400 text-xs mb-1">Life Progress</div>
          <div className="text-2xl font-bold text-purple-400">{lifeProgress.toFixed(1)}%</div>
          <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2">
            <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${lifeProgress}%` }} />
          </div>
        </div>
        
        <div className="bg-gray-800 rounded p-3">
          <div className="text-gray-400 text-xs mb-1">Location</div>
          <div className="text-lg font-bold text-green-400">Chennai, IN</div>
          <div className="text-xs text-gray-500">GMT+5:30</div>
        </div>
      </div>
    </div>
  );

  // ============================================
  // RENDER: STRATEGY CIRCLE (6 Fronts)
  // ============================================
  const renderStrategyCircle = () => {
    const COLORS = {
      'ALLIES': '#10b981',
      'ENEMIES': '#ef4444',
      'OVERT': '#3b82f6',
      'COVERT': '#8b5cf6',
      'OFFENSE': '#f59e0b',
      'DEFENSE': '#06b6d4',
      'CONVENTIONAL': '#6b7280',
      'UNCONVENTIONAL': '#ec4899',
    };

    const pieData = STRATEGY_FRONTS.map(f => ({
      name: f.front,
      value: f.percentage,
      color: COLORS[f.front],
    }));

    return (
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-500" />
          Strategic Posture - 6 Fronts
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="space-y-2">
            {STRATEGY_FRONTS.map(f => (
              <div key={f.front} className="bg-gray-900 rounded p-2 text-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-white">{f.front}</span>
                  <span className="text-xs">{f.status}</span>
                </div>
                <div className="text-xs text-gray-400">{f.notes}</div>
                <div className="flex items-center gap-3 mt-1 text-xs">
                  <span>Moves: {f.moves}</span>
                  <span>Strength: {f.strength}/10</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ============================================
  // RENDER: AGGREGATED HIERARCHY (Dynamic Zoom)
  // ============================================
  const renderHierarchyItem = (item, level = 0) => {
    const isExpanded = expandedItems[item.id];
    const hasChildren = item.children && item.children.length > 0;
    const indent = level * 24;

    const affairs = item.stateOfAffairs?.affairs || item.affairs || [];
    const interests = item.stateOfAffairs?.interests || item.interests || [];

    return (
      <div key={item.id} className="mb-1">
        <div
          className="flex items-center gap-2 p-2 rounded hover:bg-gray-700 cursor-pointer transition-colors"
          style={{ paddingLeft: `${indent + 8}px` }}
          onClick={() => {
            if (hasChildren) toggleExpand(item.id);
            if (item.level === 1) setSelectedDomain(item.id);
          }}
        >
          {hasChildren && (
            isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
          {!hasChildren && <div className="w-4" />}
          
          <span className="text-lg">{item.icon}</span>
          <span className={`${level === 0 ? 'font-bold text-white' : level === 1 ? 'font-semibold text-gray-300' : 'text-gray-400'}`}>
            {item.name}
          </span>
          
          {item.fragility !== undefined && (
            <span className={`ml-auto text-xs px-2 py-1 rounded ${
              item.fragility > 50 ? 'bg-red-900 text-red-300' :
              item.fragility > 30 ? 'bg-yellow-900 text-yellow-300' :
              'bg-green-900 text-green-300'
            }`}>
              F: {item.fragility}
            </span>
          )}
          
          {item.status && (
            <span className="text-xs">{item.status}</span>
          )}
        </div>

        {isExpanded && (
          <div style={{ paddingLeft: `${indent + 32}px` }} className="mt-2 space-y-2">
            {/* Affairs */}
            {affairs.length > 0 && (
              <div>
                <div className="text-xs font-bold text-green-400 mb-1">AFFAIRS (Defense):</div>
                {affairs.map(affair => (
                  <div key={affair.id} className="flex items-center gap-2 text-xs bg-gray-900 rounded p-2 mb-1">
                    <Check className="w-3 h-3 text-green-500" />
                    <span className="text-gray-300">{affair.task}</span>
                    <span className="ml-auto text-blue-400">P: {affair.priority}</span>
                    {affair.progress > 0 && (
                      <span className="text-purple-400">{(affair.progress * 100).toFixed(0)}%</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Interests */}
            {interests.length > 0 && (
              <div>
                <div className="text-xs font-bold text-red-400 mb-1">INTERESTS (Offense):</div>
                {interests.map(interest => (
                  <div key={interest.id} className="flex items-center gap-2 text-xs bg-gray-900 rounded p-2 mb-1">
                    <Target className="w-3 h-3 text-red-500" />
                    <span className="text-gray-300">{interest.bet}</span>
                    <span className="ml-auto text-orange-400">C: {interest.convexity}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Recursive children */}
            {hasChildren && item.children.map(childId => {
              const child = [...COMPLETE_HIERARCHY.macroDomains, ...COMPLETE_HIERARCHY.hierarchySections].find(i => i.id === childId);
              return child ? renderHierarchyItem(child, level + 1) : null;
            })}
          </div>
        )}
      </div>
    );
  };

  const renderAggregatedHierarchy = () => {
    const visibleItems = zoomLevel === 'macro' 
      ? COMPLETE_HIERARCHY.macroDomains 
      : zoomLevel === 'meso'
      ? [...COMPLETE_HIERARCHY.macroDomains, ...COMPLETE_HIERARCHY.hierarchySections.filter(h => h.level === 2)]
      : [...COMPLETE_HIERARCHY.macroDomains, ...COMPLETE_HIERARCHY.hierarchySections];

    return (
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-500" />
            Aggregated Hierarchy - {zoomLevel.toUpperCase()} View
          </h3>
          
          <div className="flex gap-2">
            <button
              onClick={() => setZoomLevel('macro')}
              className={`px-3 py-1 rounded text-sm ${zoomLevel === 'macro' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
            >
              <ZoomOut className="w-4 h-4 inline mr-1" />
              Macro
            </button>
            <button
              onClick={() => setZoomLevel('meso')}
              className={`px-3 py-1 rounded text-sm ${zoomLevel === 'meso' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
            >
              Meso
            </button>
            <button
              onClick={() => setZoomLevel('micro')}
              className={`px-3 py-1 rounded text-sm ${zoomLevel === 'micro' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
            >
              <ZoomIn className="w-4 h-4 inline mr-1" />
              Micro
            </button>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {COMPLETE_HIERARCHY.macroDomains.map(domain => renderHierarchyItem(domain, 0))}
          
          {(zoomLevel === 'meso' || zoomLevel === 'micro') && (
            <>
              <div className="my-4 border-t border-gray-700 pt-4">
                <div className="text-sm font-bold text-gray-400 mb-2">HIERARCHY SUBSECTIONS</div>
              </div>
              {COMPLETE_HIERARCHY.hierarchySections
                .filter(h => h.level === 2)
                .map(section => renderHierarchyItem(section, 0))}
            </>
          )}
        </div>
      </div>
    );
  };

  // ============================================
  // RENDER: NEW INTEREST MODAL (With Import System)
  // ============================================
  const renderNewInterestModal = () => {
    if (!showNewInterestModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-lg border border-gray-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Plus className="w-6 h-6" />
                CREATE NEW INTEREST
              </h2>
              <button onClick={() => setShowNewInterestModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Basic Info */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-sm text-gray-400 block mb-1">Interest Name</label>
                <input type="text" className="w-full bg-gray-900 text-white rounded px-3 py-2 border border-gray-700" placeholder="e.g., Bitcoin Position" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Domain</label>
                  <select className="w-full bg-gray-900 text-white rounded px-3 py-2 border border-gray-700">
                    <option>Finance</option>
                    <option>Physics</option>
                    <option>Biology</option>
                    <option>Ecology</option>
                    <option>Politics</option>
                    <option>Nurture</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Allocation (% of portfolio)</label>
                  <input type="number" className="w-full bg-gray-900 text-white rounded px-3 py-2 border border-gray-700" placeholder="Max 10%" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Upside Potential</label>
                  <input type="text" className="w-full bg-gray-900 text-white rounded px-3 py-2 border border-gray-700" placeholder="e.g., Unlimited, 100x" />
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Downside Risk (Max Loss)</label>
                  <input type="text" className="w-full bg-gray-900 text-white rounded px-3 py-2 border border-gray-700" placeholder="e.g., 10% of portfolio" />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-700 pt-6 mb-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Import className="w-5 h-5 text-blue-500" />
                IMPORT STRUCTURE
              </h3>
              
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 bg-gray-900 rounded cursor-pointer hover:bg-gray-850">
                  <input type="checkbox" className="w-4 h-4" />
                  <div>
                    <div className="text-white font-semibold">Import ENDS (Barbell Strategy)</div>
                    <div className="text-xs text-gray-400">Pulls: Hedge/Edge from selected domain</div>
                  </div>
                </label>
                
                <label className="flex items-center gap-3 p-3 bg-gray-900 rounded cursor-pointer hover:bg-gray-850">
                  <input type="checkbox" className="w-4 h-4" />
                  <div>
                    <div className="text-white font-semibold">Import MEANS (Heuristics + Methods)</div>
                    <div className="text-xs text-gray-400">Pulls: Heuristics library, techniques</div>
                  </div>
                </label>
                
                <label className="flex items-center gap-3 p-3 bg-gray-900 rounded cursor-pointer hover:bg-gray-850">
                  <input type="checkbox" className="w-4 h-4" />
                  <div>
                    <div className="text-white font-semibold">Import Related AFFAIRS</div>
                    <div className="text-xs text-gray-400">Links: Defensive tasks that support this</div>
                  </div>
                </label>
                
                <label className="flex items-center gap-3 p-3 bg-gray-900 rounded cursor-pointer hover:bg-gray-850">
                  <input type="checkbox" className="w-4 h-4" />
                  <div>
                    <div className="text-white font-semibold">Import Related INTERESTS</div>
                    <div className="text-xs text-gray-400">Links: Other bets in same domain</div>
                  </div>
                </label>
              </div>
            </div>

            <div className="border-t border-gray-700 pt-6 mb-6">
              <h3 className="text-lg font-bold text-white mb-4">PLANNING & LOGISTICS</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Define KPIs</label>
                  <textarea className="w-full bg-gray-900 text-white rounded px-3 py-2 border border-gray-700 h-20" placeholder="e.g., Bitcoin price $100k, Portfolio +50%" />
                </div>
                
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Objective</label>
                  <input type="text" className="w-full bg-gray-900 text-white rounded px-3 py-2 border border-gray-700" placeholder="e.g., Gain from BTC volatility" />
                </div>
                
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Key Results (ORKs)</label>
                  <textarea className="w-full bg-gray-900 text-white rounded px-3 py-2 border border-gray-700 h-20" placeholder="KR1: Accumulate 0.5 BTC by Q2&#10;KR2: Never exceed 10% allocation" />
                </div>
                
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Schedule & Milestones</label>
                  <div className="space-y-2">
                    <input type="text" className="w-full bg-gray-900 text-white rounded px-3 py-2 border border-gray-700" placeholder="Phase 1: Research wallets - Due: [Date]" />
                    <input type="text" className="w-full bg-gray-900 text-white rounded px-3 py-2 border border-gray-700" placeholder="Phase 2: Buy on dip - Due: [Date]" />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-700 pt-6 mb-6">
              <h3 className="text-lg font-bold text-white mb-4">DECISION FILTERS</h3>
              
              <div className="space-y-4">
                <div className="bg-yellow-900 bg-opacity-20 border border-yellow-700 rounded p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    <span className="font-bold text-yellow-300">ERGODICITY CHECK</span>
                  </div>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="w-4 h-4" />
                    <span className="text-sm text-gray-300">Can I survive if this goes to zero?</span>
                  </label>
                  <input type="text" className="w-full mt-2 bg-gray-900 text-white rounded px-3 py-2 border border-gray-700 text-sm" placeholder="Notes: Only 10% allocation, won't kill me..." />
                </div>
                
                <div className="bg-blue-900 bg-opacity-20 border border-blue-700 rounded p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                    <span className="font-bold text-blue-300">JENSEN'S CHECK</span>
                  </div>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="w-4 h-4" />
                    <span className="text-sm text-gray-300">Is payoff convex (gains from volatility)?</span>
                  </label>
                  <input type="text" className="w-full mt-2 bg-gray-900 text-white rounded px-3 py-2 border border-gray-700 text-sm" placeholder="Notes: More volatility = more upside, limited downside..." />
                </div>
                
                <div className="bg-green-900 bg-opacity-20 border border-green-700 rounded p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-green-500" />
                    <span className="font-bold text-green-300">BARBELL CHECK</span>
                  </div>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="w-4 h-4" />
                    <span className="text-sm text-gray-300">Does this fit in 10% allocation?</span>
                  </label>
                  <div className="mt-2 text-sm text-gray-300">
                    Current allocation: 7% → +3% if approved = 10% ✓
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded flex items-center justify-center gap-2">
                <Check className="w-5 h-5" />
                CREATE & EXECUTE
              </button>
              <button className="px-6 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded">
                Save as Draft
              </button>
              <button onClick={() => setShowNewInterestModal(false)} className="px-6 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ============================================
  // RENDER: MISSION COMMAND VIEW
  // ============================================
  const renderMissionCommand = () => (
    <div className="space-y-4">
      {renderHUD()}
      
      <div className="grid grid-cols-2 gap-4">
        {renderStrategyCircle()}
        {renderAggregatedHierarchy()}
      </div>

      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Quick Actions</h3>
          <button
            onClick={() => setShowNewInterestModal(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Interest
          </button>
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          {COMPLETE_HIERARCHY.macroDomains.map(domain => (
            <button
              key={domain.id}
              onClick={() => setSelectedDomain(domain.id)}
              className="bg-gray-700 hover:bg-gray-600 rounded-lg p-3 text-left transition-all"
            >
              <div className="text-3xl mb-2">{domain.icon}</div>
              <div className="font-bold text-white text-sm">{domain.name.split(' - ')[0]}</div>
              <div className="flex items-center justify-between mt-2 text-xs">
                <span className="text-gray-400">F: {domain.fragility}</span>
                <span className={`${domain.fragility > 50 ? 'text-red-400' : 'text-green-400'}`}>
                  {domain.status}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // ============================================
  // MAIN RENDER
  // ============================================
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">⚛️ GENESIS - ANTIFRAGILITY OPERATING SYSTEM</h1>
          <p className="text-gray-400">Dynamic Hierarchy · Macro/Micro Zoom · Strategic 6 Fronts</p>
        </div>

        {renderMissionCommand()}
        {renderNewInterestModal()}
      </div>
    </div>
  );
};

export default Dashboard;