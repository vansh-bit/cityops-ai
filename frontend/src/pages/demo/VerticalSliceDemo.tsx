import { useState, useEffect, useRef } from 'react';
import './VerticalSliceDemo.css';
import { 
  IconRoad, IconSpray, IconDroplet, IconCameraUpload, 
  IconEye, IconMapPin, IconBook, IconCpu, IconShieldCheck,
  IconAlertTriangle, IconCheck, IconCircle, IconSend
} from '../../components/TablerIcons';
import { Images } from '../../images';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const getImg = (name: string) => {
  const key = Object.keys(Images).find(k => k.startsWith(name));
  return key ? (Images as any)[key] : '';
};

const SCENARIOS = [
  {
    id: 'pothole',
    Icon: IconRoad,
    label: 'Pothole',
    subLabel: 'Road Damage',
    thumbnail: getImg('pothole_image'),
    data: {
      imageUri: 'gs://cityops-demo/pothole-main-st.jpg',
      location: { lat: 41.8818, lng: -87.6705 },
      address: '1247 W. Madison St, Ward 17, Chicago IL 60607',
      assetId: 'RD-CHI-2026-004821',
      description: 'Deep pothole on Main St, damaged my tire.',
      dimensions: '~0.4m diameter, depth 6cm',
      repairCost: '$380–$520 (standard asphalt patch)',
      crewType: 'Road Maintenance Crew — Unit 7',
      municipalCode: 'Chicago § 10-20-080',
      classification: 'Pothole / Road Hazard',
      department: 'Public Works',
      priority: 'High',
      confidence: 88,
      escalate: false
    }
  },
  {
    id: 'graffiti',
    Icon: IconSpray,
    label: 'Graffiti',
    subLabel: 'Municipal Check',
    thumbnail: getImg('graffiti_image'),
    data: {
      imageUri: 'gs://cityops-demo/graffiti-park.jpg',
      location: { lat: 41.8827, lng: -87.6233 },
      address: 'Millennium Park Fountain, Chicago IL',
      assetId: 'PK-CHI-2026-001133',
      description: 'Offensive graffiti on the park fountain.',
      dimensions: '~2.1m² coverage',
      repairCost: '$150 (chemical wash)',
      crewType: 'Parks & Rec Team',
      municipalCode: 'Chicago § 7-28-065',
      classification: 'Graffiti / Vandalism',
      department: 'Parks Department',
      priority: 'Routine',
      confidence: 94,
      escalate: false
    }
  },
  {
    id: 'water-main',
    Icon: IconDroplet,
    label: 'Water Break',
    subLabel: 'Emergency',
    thumbnail: getImg('water_main_image'),
    data: {
      imageUri: 'gs://cityops-demo/water-leak.jpg',
      location: { lat: 41.8855, lng: -87.6473 },
      address: 'W. Lake St & N. Halsted St, Chicago IL',
      assetId: 'WM-CHI-2026-007742',
      description: 'Massive water leak flooding.',
      dimensions: '8-inch cast iron main',
      repairCost: 'Requires assessment',
      crewType: 'Emergency Water Team',
      municipalCode: 'Emergency § 11-12-010',
      classification: 'Water Main Rupture',
      department: 'Water Services',
      priority: 'Critical',
      confidence: 98,
      escalate: false
    }
  },
  {
    id: 'suspicious',
    Icon: IconAlertTriangle,
    label: 'Suspicious Structure',
    subLabel: 'Low Confidence',
    thumbnail: getImg('suspicious_structure_image'),
    data: {
      imageUri: 'gs://cityops-demo/shack.jpg',
      location: { lat: 41.8781, lng: -87.6298 },
      address: '200 Block S. State St, Chicago IL',
      assetId: 'UNKNOWN',
      description: 'Weird wooden shack blocking.',
      dimensions: 'Unknown',
      repairCost: 'N/A',
      crewType: 'Municipal Inspector',
      municipalCode: 'Review Required',
      classification: 'Unverified Structure',
      department: 'Buildings',
      priority: 'Review',
      confidence: 47,
      escalate: true
    }
  }
];

type Step = 'selection' | 'processing' | 'results' | 'report-generating' | 'preview' | 'submitting' | 'success';

export function VerticalSliceDemo() {
  const [step, setStep] = useState<Step>('selection');
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeNode, setActiveNode] = useState(0);
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const activeIntervals = useRef<any[]>([]);
  const activeTimeouts = useRef<any[]>([]);

  useEffect(() => {
    return () => {
      activeIntervals.current.forEach(clearInterval);
      activeTimeouts.current.forEach(clearTimeout);
    };
  }, []);

  const [showVision, setShowVision] = useState(false);
  const [showMaps, setShowMaps] = useState(false);
  const [showConfidence, setShowConfidence] = useState(false);
  const [displayConfidence, setDisplayConfidence] = useState(0);

  const [reportGenStep, setReportGenStep] = useState(0);

  const [successAnim, setSuccessAnim] = useState(0);
  const [copied, setCopied] = useState(false);

  // For scenarios we use predefined data. For upload, we will use the backend response.
  const scenario = SCENARIOS.find(s => s.id === selectedScenario) || SCENARIOS[0];

  useEffect(() => {
    if (terminalEndRef.current) {
      try {
        terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
      } catch (e) {
        try { terminalEndRef.current.scrollIntoView(); } catch(e2) {}
      }
    }
  }, [terminalLines]);

  const streamTerminal = (lines: string[], onComplete: () => void) => {
    let currentLine = 0;
    const interval = setInterval(() => {
      if (currentLine < lines.length) {
        const nextLine = lines[currentLine];
        setTerminalLines(prev => [...prev, String(nextLine || '')]);
        currentLine++;
      } else {
        clearInterval(interval);
        onComplete();
      }
    }, 400);
    activeIntervals.current.push(interval);
  };

  const handleExecute = () => {
    if (!selectedScenario) return;
    
    activeIntervals.current.forEach(clearInterval);
    activeTimeouts.current.forEach(clearTimeout);
    activeIntervals.current = [];
    activeTimeouts.current = [];

    setStep('processing');
    setResult(null);
    setTerminalLines([]);
    setActiveNode(0);
    setUploadError(null);

    // If it's a real upload, we make the API call while animating the terminal
    if (selectedScenario === 'upload' && uploadFile) {
      setIsUploading(true);
      
      const formData = new FormData();
      formData.append('image', uploadFile);
      formData.append('description', 'User uploaded incident image');
      formData.append('demoMode', 'true');

      // Kick off the fetch request concurrently with the animation
      const fetchPromise = fetch(`${API_URL}/api/v1/analyze`, {
        method: 'POST',
        body: formData
      })
      .then(res => res.json())
      .then(data => {
        if (!data.success) throw new Error(data.error?.message || 'Upload failed');
        return data;
      });

      // Define a generic terminal flow for custom uploads
      const customFlow = [
        { node: 1, lines: ['[VISION AGENT] Analyzing custom citizen upload...', '  → Segmentation and extraction initiated...'] },
        { node: 2, lines: ['\n[GIS AGENT] Bypassing geolocation (no metadata)...', '  → Location unknown'] },
        { node: 3, lines: ['\n[MUNICIPAL RULES AGENT] Querying municipal databases...', '  → Matching visual signatures to city codes'] },
        { node: 4, lines: ['\n[DECISION AGENT] Synthesizing output payload...', '  → Finalizing operational recommendation...'] },
        { node: 5, lines: ['\n[CONFIDENCE AGENT] Aggregating deterministic evidence...', '  → Calculating final confidence score...'] }
      ];

      let currentStepIndex = 0;
      let fetchedResult: any = null;
      let fetchError: any = null;

      fetchPromise.then(res => fetchedResult = res).catch(err => fetchError = err);

      const executeNextStep = () => {
        if (currentStepIndex >= customFlow.length) {
          // Wait for fetch if it's still running
          const checkFetch = setInterval(() => {
            if (fetchError) {
              clearInterval(checkFetch);
              setIsUploading(false);
              setUploadError(fetchError.message);
              setStep('selection');
            } else if (fetchedResult) {
              clearInterval(checkFetch);
              setIsUploading(false);
              setResult(fetchedResult);
              setStep('results');
            }
          }, 500);
          activeIntervals.current.push(checkFetch);
          return;
        }
        const step = customFlow[currentStepIndex];
        setActiveNode(step.node);
        streamTerminal(step.lines, () => {
          currentStepIndex++;
          // if fetch completed early, we can still let the animation finish its sequence
          executeNextStep();
        });
      };
      
      executeNextStep();
      return;
    }
    
    // Original Mock Flow
    const flow = [
      {
        node: 1, 
        lines: [
          `[VISION AGENT] Analyzing citizen upload...`,
          `  → Segmentation complete: ${scenario.data.classification}`,
          `  → Priority extracted: ${scenario.data.priority}`,
          `  → Dimensions mapped: ${scenario.data.dimensions}`
        ]
      },
      {
        node: 2, 
        lines: [
          `\n[GIS AGENT] Requesting geospatial cross-reference...`,
          `  → Coordinates: ${scenario.data.location.lat}° N, ${scenario.data.location.lng}° W`,
          `  → Node match: ${scenario.data.assetId}`,
          `  → Address resolved: ${scenario.data.address}`
        ]
      },
      {
        node: 3, 
        lines: [
          `\n[MUNICIPAL RULES AGENT] Validating jurisdiction and codes...`,
          `  → Code matched: ${scenario.data.municipalCode}`,
          `  → Department identified: ${scenario.data.department}`
        ]
      },
      {
        node: 4, 
        lines: [
          `\n[DECISION AGENT] Synthesizing output payload...`,
          `  → Routing confirmed to ${scenario.data.department}`,
          `  → Final classification locked: ${scenario.data.classification}`
        ]
      },
      {
        node: 5, 
        lines: [
          `\n[CONFIDENCE AGENT] Aggregating deterministic evidence...`,
          `  → Sub-score weights assigned`,
          `  → Overall calculation: ${scenario.data.confidence}%`,
          scenario.data.escalate ? `  → FLAG: ESCALATED FOR HUMAN REVIEW` : `  → FLAG: APPROVED FOR AUTOMATION`
        ]
      }
    ];

    let currentStepIndex = 0;
    
    const executeNextStep = () => {
      if (currentStepIndex >= flow.length) {
        const timeout = setTimeout(fetchMockResult, 800);
        activeTimeouts.current.push(timeout);
        return;
      }
      const step = flow[currentStepIndex];
      setActiveNode(step.node);
      streamTerminal(step.lines, () => {
        currentStepIndex++;
        executeNextStep();
      });
    };

    executeNextStep();
  };
  
  const fetchMockResult = () => {
    const json = {
      decision: {
        category: scenario.data.classification,
        assignedDepartment: scenario.data.department,
        priority: scenario.data.priority,
        reasoning: "Visual analysis confirmed the presence of a hazard. Maps verified the location falls within municipal jurisdiction.",
        address: scenario.data.address,
        assetId: scenario.data.assetId,
        crewType: scenario.data.crewType
      },
      confidence: {
        overallScore: scenario.data.confidence,
        escalationRequired: scenario.data.escalate,
        reasoning: scenario.data.escalate ? "Confidence below safety threshold." : "N/A"
      },
      visionResult: {
        issueType: scenario.data.classification,
        severity: scenario.data.priority,
        dimensions: scenario.data.dimensions
      },
      runtimeMetadata: {
        durationMs: 3450,
      }
    };
    
    setResult(json);
    setStep('results');
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setUploadFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setSelectedScenario('upload');
    }
  };

  useEffect(() => {
    if (step === 'results') {
      setShowVision(false);
      setShowMaps(false);
      setShowConfidence(false);
      setDisplayConfidence(0);
      
      const t1 = setTimeout(() => setShowVision(true), 400);
      const t2 = setTimeout(() => setShowMaps(true), 800);
      const t3 = setTimeout(() => {
        setShowConfidence(true);
        if (result?.confidence?.overallScore) {
          const target = result.confidence.overallScore;
          let current = 0;
          const stepValue = target / 20;
          const timer = setInterval(() => {
            current += stepValue;
            if (current >= target) {
              setDisplayConfidence(target);
              clearInterval(timer);
            } else {
              setDisplayConfidence(Math.floor(current));
            }
          }, 30);
          activeIntervals.current.push(timer);
        }
      }, 1400);
      
      activeTimeouts.current.push(t1, t2, t3);
      
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }
  }, [step, result]);

  useEffect(() => {
    if (step === 'success') {
      setSuccessAnim(0);
      const t1 = setTimeout(() => setSuccessAnim(1), 350);
      const t2 = setTimeout(() => setSuccessAnim(2), 700);
      const t3 = setTimeout(() => setSuccessAnim(3), 1050);
      const t4 = setTimeout(() => setSuccessAnim(4), 1400);
      
      activeTimeouts.current.push(t1, t2, t3, t4);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
    }
  }, [step]);

  const handleGenerateReport = () => {
    setStep('report-generating');
    setReportGenStep(0);
    
    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      if (currentStep >= 5) {
        clearInterval(interval);
        setStep('preview');
      } else {
        setReportGenStep(currentStep);
      }
    }, 600);
    activeIntervals.current.push(interval);
  };

  const handleSubmit = () => {
    setStep('submitting');
    const t = setTimeout(() => {
      setStep('success');
    }, 1500);
    activeTimeouts.current.push(t);
  };

  const copyLink = () => {
    setCopied(true);
    const t = setTimeout(() => setCopied(false), 2000);
    activeTimeouts.current.push(t);
  };

  // --- Render Functions ---

  const renderSelection = () => (
    <div className="fade-in">
      <div className="selection-heading-area">
        <div className="text-eyebrow">INCIDENT CLASSIFICATION</div>
        <h2 className="text-display">Select incident type</h2>
        <p className="selection-sub">The AI Decision Engine will analyze, classify, and route your report autonomously.</p>
      </div>
      
      <div className="scenario-list-container">
        {SCENARIOS.map((s, index) => {
          const Icon = s.Icon;
          const num = String(index + 1).padStart(2, '0');
          return (
            <div
              key={s.id}
              className={`scenario-row ${selectedScenario === s.id ? 'active' : ''}`}
              onClick={() => { setSelectedScenario(s.id); setUploadFile(null); setPreviewUrl(null); }}
            >
              <div className="row-index">{num}</div>
              <div className="row-icon"><Icon size={20} /></div>
              <div className="row-content">
                <span className="row-title">{s.label}</span>
                <span className="row-desc">"{s.data.description}"</span>
              </div>
              <div className="row-arrow">→</div>
            </div>
          );
        })}
      </div>
      
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{display: 'none'}} 
        accept="image/jpeg, image/png, image/webp" 
        onChange={handleFileChange} 
      />
      
      <div 
        className={`upload-row ${selectedScenario === 'upload' ? 'active' : ''}`}
        style={selectedScenario === 'upload' ? { borderColor: 'var(--amber)', background: 'var(--amber-light)' } : {}}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="upload-icon" style={selectedScenario === 'upload' ? {color: 'var(--amber)'} : {}}><IconCameraUpload size={20} /></div>
        <div className="row-content">
          <span className="row-title">{uploadFile ? uploadFile.name : 'Upload your own image'}</span>
          <span className="row-desc" style={{fontStyle: 'normal'}}>{uploadFile ? 'Ready to analyze' : 'JPG, PNG, WEBP — max 10MB'}</span>
        </div>
        {previewUrl && (
          <img src={previewUrl} alt="preview" style={{width: '40px', height: '40px', objectFit: 'cover', border: '1px solid var(--rule)'}} />
        )}
      </div>

      {uploadError && (
        <div style={{marginTop: '16px', color: 'var(--stamp-red)', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600}}>
          Error: {uploadError}
        </div>
      )}

      <button className="btn-primary-rect" onClick={handleExecute} disabled={!selectedScenario || isUploading}>
        {isUploading ? 'Uploading & Analyzing...' : 'Analyze Incident →'}
      </button>
    </div>
  );

  const renderProcessing = () => {
    return (
      <div className="split-processing fade-in">
        <div className="agent-pipeline">
          <div className="text-eyebrow" style={{marginBottom: '24px'}}>PROCESSING PIPELINE</div>
          
          <div className="agent-list">
            {[
              { id: 1, name: 'Vision Agent' },
              { id: 2, name: 'GIS Agent' },
              { id: 3, name: 'Municipal Rules Agent' },
              { id: 4, name: 'Decision Agent' },
              { id: 5, name: 'Confidence Agent' },
            ].map((node, i) => {
              const isPast = activeNode > node.id;
              const isActive = activeNode === node.id;
              
              let statusClass = 'pending';
              if (isPast) statusClass = 'done';
              else if (isActive) statusClass = 'processing';
              
              return (
                <div key={node.id} style={{display: 'flex', flexDirection: 'column'}}>
                  <div className={`agent-status-row ${statusClass}`}>
                    <div className="agent-icon-col">
                      <div className={`status-box ${statusClass}`}>
                        {isPast && <IconCheck size={16} color="white" />}
                        {isActive && <div className="pulse-square"></div>}
                      </div>
                      {i < 4 && <div className="agent-connector-line"></div>}
                    </div>
                    <div className="agent-info-col">
                      <div className="agent-name-line">
                        <span className="agent-name">{node.name}</span>
                        {isActive && <span className="status-text-proc">PROCESSING</span>}
                        {isPast && <span className="status-text-done">DONE</span>}
                      </div>
                      {(isActive || isPast) && (
                        <div className="agent-sub">
                          {isPast ? 'Execution completed.' : 'Streaming data...'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="evidence-strip">
            <div className="strip-header">
              <span className="text-eyebrow">EVIDENCE PIPELINE</span>
              <span>{Math.min(activeNode, 5)} of 5 agents complete</span>
            </div>
            <div className="progress-bar-flat">
              <div className="progress-fill-flat" style={{ width: `${(Math.min(activeNode, 5) / 5) * 100}%` }}></div>
            </div>
          </div>
        </div>

        <div className="terminal-panel">
          <div className="term-header">
            <div className="th-left"><div className="green-dot"></div> LIVE INTELLIGENCE FEED</div>
            <div className="th-right">{new Date().toLocaleTimeString()}</div>
          </div>
          <div className="term-body">
            {terminalLines.map((line, i) => {
              const safeLine = String(line || '');
              let isAgent = false;
              if (safeLine.includes('[VISION AGENT]') || 
                  safeLine.includes('[GIS AGENT]') || 
                  safeLine.includes('[MUNICIPAL RULES AGENT]') || 
                  safeLine.includes('[DECISION AGENT]') || 
                  safeLine.includes('[CONFIDENCE AGENT]')) {
                isAgent = true;
              }
              
              return (
                <div key={i} className={isAgent ? 'term-line-agent' : 'term-line-content'}>
                  {!isAgent && safeLine.trim().startsWith('→') ? (
                    <>
                      <span className="term-arrow">→</span>
                      <span>{safeLine.replace('→', '').trim()}</span>
                    </>
                  ) : (
                    <span>{safeLine}</span>
                  )}
                </div>
              );
            })}
            <div className="rect-cursor" ref={terminalEndRef}></div>
          </div>
        </div>
      </div>
    );
  };

  const renderResults = () => {
    if (!result) return null;
    const decision = result.decision || {};
    const confidence = result.confidence || {};
    
    return (
      <div className="results-grid fade-in">
        <div className="res-main">
          
          <div className="meta-row-table">
            <div className="meta-col">
              <span className="meta-label">CATEGORY</span>
              <span className="meta-val">{decision.category || decision.issueClassification}</span>
            </div>
            <div className="meta-col">
              <span className="meta-label">DEPARTMENT</span>
              <span className="meta-val">{decision.assignedDepartment?.split(':')[0] || decision.departmentRecommendation?.split(':')[0]}</span>
            </div>
            <div className="meta-col">
              <span className="meta-label">PRIORITY</span>
              <span className={`meta-val ${(decision.priority || decision.priorityRecommendation) === 'High' || (decision.priority || decision.priorityRecommendation) === 'HIGH' ? 'high' : ''}`}>
                {((decision.priority || decision.priorityRecommendation) === 'High' || (decision.priority || decision.priorityRecommendation) === 'HIGH') && <div className="square-red"></div>}
                {decision.priority || decision.priorityRecommendation}
              </span>
            </div>
          </div>

          <div className="ev-cards">
            <div className={`ev-card staggered-reveal ${showVision ? 'visible' : ''}`}>
              <div className="ev-card-header">
                <span className="ev-card-title">VISION AGENT</span>
                <span className="ev-chip">98% CONFIDENCE</span>
              </div>
              <ul className="ev-list">
                <li><div className="sq-green"></div> {decision.category || decision.issueClassification} detected</li>
                <li><div className="sq-green"></div> Severity: {(decision.priority || decision.priorityRecommendation)?.toUpperCase()}</li>
                <li><div className="sq-green"></div> Dims: {result.visionResult?.dimensions || scenario.data.dimensions}</li>
              </ul>
            </div>
            
            <div className={`ev-card staggered-reveal ${showMaps ? 'visible' : ''}`}>
              <div className="ev-card-header">
                <span className="ev-card-title">GIS AGENT</span>
                <span className="ev-chip">VERIFIED 100%</span>
              </div>
              <ul className="ev-list">
                <li><div className="sq-green"></div> Coordinates matched to grid</li>
                <li><div className="sq-green"></div> Asset: {decision.assetId || 'UNKNOWN'}</li>
                <li><div className="sq-green"></div> Maintained by {decision.assignedDepartment?.split(':')[0] || decision.departmentRecommendation?.split(':')[0]}</li>
              </ul>
            </div>
          </div>

          <div className={`map-wrapper staggered-reveal ${showMaps ? 'visible' : ''}`}>
             <iframe
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${scenario.data.location.lng - 0.005}%2C${scenario.data.location.lat - 0.002}%2C${scenario.data.location.lng + 0.005}%2C${scenario.data.location.lat + 0.002}&layer=mapnik&marker=${scenario.data.location.lat}%2C${scenario.data.location.lng}`}
                style={{width: '100%', height: '220px', border: 'none', filter: 'grayscale(1) contrast(1.2)'}}
                loading="lazy">
              </iframe>
             <div className="map-address-row">
                <span style={{fontFamily: 'var(--font-sans)', fontSize: '14px'}}>{decision.address || 'Address Unknown'}</span>
                <span className="ev-chip">✓ GIS VERIFIED</span>
             </div>
          </div>
        </div>

        <div className="res-sidebar">
          <div className={`conf-panel staggered-reveal ${showConfidence ? 'visible' : ''}`}>
            <span className="text-eyebrow" style={{marginBottom: '24px', display: 'block'}}>CONFIDENCE EXPLANATION</span>
            
            <div className="conf-metric">
              <span className="conf-label">Image Quality</span>
              <div className="conf-val">95%</div>
              <div className="conf-bar"><div className="conf-fill green" style={{width: showConfidence ? '95%' : '0%'}}></div></div>
            </div>
            <div className="conf-metric">
              <span className="conf-label">Location Match</span>
              <div className="conf-val">90%</div>
              <div className="conf-bar"><div className="conf-fill green" style={{width: showConfidence ? '90%' : '0%'}}></div></div>
            </div>
            <div className="conf-metric">
              <span className="conf-label">Evidence Completeness</span>
              <div className="conf-val">82%</div>
              <div className="conf-bar"><div className="conf-fill amber" style={{width: showConfidence ? '82%' : '0%'}}></div></div>
            </div>
            <div className="conf-metric">
              <span className="conf-label">Classification Certainty</span>
              <div className="conf-val">96%</div>
              <div className="conf-bar"><div className="conf-fill green" style={{width: showConfidence ? '96%' : '0%'}}></div></div>
            </div>
            
            <div className="overall-divider"></div>
            
            <div>
              <span className="text-eyebrow" style={{marginBottom: '16px', display: 'block'}}>OVERALL CONFIDENCE SCORE</span>
              <div className="text-data-hero">{displayConfidence}%</div>
              
              {confidence.escalationRequired ? (
                <div className="decision-stamp escalated">
                  PRIORITY ESCALATION
                </div>
              ) : (
                <div className="decision-stamp">
                  APPROVED FOR AUTOMATION
                </div>
              )}
            </div>
          </div>

          <button className={`btn-solid report-action-btn staggered-reveal ${showConfidence ? 'visible' : ''}`} onClick={handleGenerateReport}>
            Generate Official Report →
          </button>
        </div>
      </div>
    );
  };

  const renderReportGenerating = () => {
    return (
      <div className="report-view fade-in">
        <h2 className="text-display">Generating Report...</h2>
      </div>
    );
  };

  const renderPreview = () => {
    const decision = result?.decision || {};
    return (
      <div className="report-view fade-in">
        <div className="report-doc">
          <div className="watermark-bg">OFFICIAL</div>
          
          <div className="r-header">
            <h2 className="r-title">Municipal AI Incident<br/>Assessment Report</h2>
            <div className="r-wm">
              <span className="r-wm-top">CITYOPS</span>
              <span className="r-wm-bot">AI AUTOMATION SYSTEM</span>
            </div>
          </div>
          
          <div className="r-meta-grid">
             <div className="rm-item"><span className="rm-label">Tracking ID</span><span className="rm-val">{result.requestId || 'CITYOPS-2026-000076'}</span></div>
             <div className="rm-item"><span className="rm-label">Category</span><span className="rm-val">{decision.category || decision.issueClassification}</span></div>
             <div className="rm-item"><span className="rm-label">Priority</span><span className={`rm-val ${(decision.priority || decision.priorityRecommendation) === 'High' || (decision.priority || decision.priorityRecommendation) === 'HIGH' ? 'high' : ''}`}>{decision.priority || decision.priorityRecommendation}</span></div>
             <div className="rm-item"><span className="rm-label">Processing Time</span><span className="rm-val">{result?.runtimeMetadata?.durationMs ? `${(result.runtimeMetadata.durationMs / 1000).toFixed(1)}s` : '3.4s'}</span></div>
             <div className="rm-item"><span className="rm-label">Evidence Sources</span><span className="rm-val">Vision AI, GIS Maps</span></div>
             <div className="rm-item"><span className="rm-label">AI Model</span><span className="rm-val">Gemini 2.5 Flash</span></div>
          </div>
          
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px'}}>
            <div className="r-section">
              <div className="rs-title">Incident Summary</div>
              <div style={{display: 'flex', gap: '8px', marginBottom: '8px'}}><div className="sq-green" style={{marginTop: '6px'}}></div><span style={{fontFamily: 'var(--font-sans)', fontSize: '14px'}}>Detected issue: <strong>{decision.issueClassification}</strong></span></div>
              <div style={{display: 'flex', gap: '8px', marginBottom: '8px'}}><div className="sq-green" style={{marginTop: '6px'}}></div><span style={{fontFamily: 'var(--font-sans)', fontSize: '14px'}}>Location verified via Maps API</span></div>
              <div style={{display: 'flex', gap: '8px', marginBottom: '8px'}}><div className="sq-green" style={{marginTop: '6px'}}></div><span style={{fontFamily: 'var(--font-sans)', fontSize: '14px'}}>Asset ID matched: {decision.assetId}</span></div>
            </div>
            
            <div className="r-section">
              <div className="rs-title">Risk Assessment</div>
              <div style={{display: 'flex', gap: '8px', marginBottom: '8px'}}><div className="sq-green" style={{marginTop: '6px'}}></div><span style={{fontFamily: 'var(--font-sans)', fontSize: '14px'}}>Priority level: <strong>{decision.priorityRecommendation}</strong></span></div>
              <div style={{display: 'flex', gap: '8px', marginBottom: '8px'}}><div className="sq-green" style={{marginTop: '6px'}}></div><span style={{fontFamily: 'var(--font-sans)', fontSize: '14px'}}>Hazard to public safety detected</span></div>
            </div>
          </div>
          
          <div className="r-action-plan">
            <div className="rs-title" style={{borderBottom: 'none'}}>Recommended Action Plan</div>
            <div style={{display: 'flex', gap: '8px', marginBottom: '8px'}}><div className="sq-green" style={{marginTop: '6px'}}></div><span style={{fontFamily: 'var(--font-sans)', fontSize: '14px'}}>Dispatch: {scenario.data.crewType}</span></div>
            <div style={{display: 'flex', gap: '8px', marginBottom: '8px'}}><div className="sq-green" style={{marginTop: '6px'}}></div><span style={{fontFamily: 'var(--font-sans)', fontSize: '14px'}}>Routing: {decision.departmentRecommendation}</span></div>
            <div style={{display: 'flex', gap: '8px', marginBottom: '8px'}}><div className="sq-green" style={{marginTop: '6px'}}></div><span style={{fontFamily: 'var(--font-sans)', fontSize: '14px'}}>Response window: 24–48 hours</span></div>
          </div>

          <div className="r-audit-log">
            <div className="ra-header">TECHNICAL AUDIT LOG</div>
            <div className="ra-row">Model: Gemini 2.5 Flash</div>
            <div className="ra-row">Decision Engine: CityOps v1.2.0</div>
            <div className="ra-row">Execution Time: 3450ms</div>
            <div className="ra-row">Threshold validation: 85% passed (Score: {scenario.data.confidence}%)</div>
          </div>
          
        </div>
        
        <div style={{marginTop: '24px', display: 'flex', gap: '16px', justifyContent: 'center'}}>
          <button className="btn-outline" onClick={() => setStep('results')}>← Back to Results</button>
          <button className="btn-solid" onClick={handleSubmit}>Submit to Municipality →</button>
        </div>
      </div>
    );
  };

  const renderSuccess = () => {
    return (
      <div className="success-view fade-in">
        <div className="success-eyebrow">REPORT SUBMITTED TO MUNICIPAL WORKFLOW</div>
        <div className="success-id">CITYOPS-2026-000076</div>
        
        <div className="tracker-row">
          {[
            { id: 1, label: 'Submitted' },
            { id: 2, label: 'AI Verified' },
            { id: 3, label: 'Municipal Review' },
            { id: 4, label: 'Crew Assigned' },
            { id: 5, label: 'Resolved' }
          ].map((stage, i) => {
            const isComplete = successAnim >= stage.id;
            const isActive = successAnim + 1 === stage.id;
            let statusClass = 'future';
            if (isComplete) statusClass = 'completed';
            else if (isActive) statusClass = 'current';

            return (
              <div key={stage.id} style={{display: 'flex', flexGrow: i < 4 ? 1 : 0}}>
                <div className="t-node">
                  <div className={`t-box ${statusClass}`}>
                    {isComplete && <IconCheck size={12} color="white" />}
                    {isActive && <div className="sq-amber-small"></div>}
                  </div>
                  <div className="t-label">{stage.label}</div>
                </div>
                {i < 4 && <div className="t-line"></div>}
              </div>
            );
          })}
        </div>

        {successAnim >= 3 && (
          <div className="success-notif fade-in-down">
            <div className="sn-icon"><IconSend size={20} /></div>
            <div>
              <div className="sn-head">Report forwarded to {scenario.data.department}</div>
              <div className="sn-sub">
                {scenario.data.crewType} will be notified within 2 hours.<br/>
                Estimated response window: 24–48 hours.
              </div>
            </div>
          </div>
        )}

        <div className="success-stats">
          <div style={{borderRight: '1px solid var(--rule)'}}>
            <div className="text-eyebrow" style={{marginBottom: '4px'}}>ASSIGNED DEPARTMENT</div>
            <div className="text-data-large" style={{fontSize: '22px'}}>{scenario.data.department}</div>
          </div>
          <div style={{borderRight: '1px solid var(--rule)', paddingLeft: '24px'}}>
            <div className="text-eyebrow" style={{marginBottom: '4px'}}>SUBMISSION TIME</div>
            <div className="text-data-large" style={{fontSize: '22px'}}>{new Date().toLocaleTimeString()}</div>
          </div>
          <div style={{paddingLeft: '24px'}}>
            <div className="text-eyebrow" style={{marginBottom: '4px'}}>AI CONFIDENCE</div>
            <div className="text-data-large" style={{fontSize: '22px'}}>{scenario.data.confidence}%</div>
          </div>
        </div>
        
        <div className="success-actions">
          <button className="btn-outline" onClick={copyLink}>
            {copied ? '✓ Copied!' : 'Copy tracking link'}
          </button>
          <button className="btn-solid" onClick={() => { setStep('selection'); setResult(null); }}>
            Analyze another incident
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{display: 'flex', flexDirection: 'column', width: '100%', alignItems: 'center'}}>
      <div className="nav-bar-white" style={{width: '100%'}}>
        <button className="back-link" onClick={() => window.location.hash = ''}>
          ← Back
        </button>
        <div className="wordmark">
          <span className="wm-left">CITYOPS AI</span>
          <span className="wm-right">PLATFORM</span>
        </div>
      </div>

      <div className="demo-wrapper">
        {step === 'selection' && renderSelection()}
        {step === 'processing' && renderProcessing()}
        {step === 'results' && renderResults()}
        {step === 'report-generating' && renderReportGenerating()}
        {step === 'preview' && renderPreview()}
        {step === 'submitting' && (
          <div className="report-view fade-in">
            <h2 className="text-display">Submitting...</h2>
          </div>
        )}
        {step === 'success' && renderSuccess()}
      </div>
    </div>
  );
}
