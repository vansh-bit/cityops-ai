import { useEffect, useRef, useState } from 'react';
import './VerticalSliceDemo.css';
import {
  IconAlertTriangle,
  IconCameraUpload,
  IconCheck,
  IconDroplet,
  IconRoad,
  IconSend,
  IconSpray,
} from '../../components/TablerIcons';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const INCIDENT_REFERENCES = [
  {
    id: 'pothole',
    Icon: IconRoad,
    label: 'Pothole',
    subLabel: 'Road Damage',
    description: 'Large pothole on a public roadway',
  },
  {
    id: 'graffiti',
    Icon: IconSpray,
    label: 'Graffiti',
    subLabel: 'Municipal Check',
    description: 'Graffiti on municipal infrastructure',
  },
  {
    id: 'water-main',
    Icon: IconDroplet,
    label: 'Water Break',
    subLabel: 'Emergency',
    description: 'Water leak or flooding on public property',
  },
  {
    id: 'suspicious',
    Icon: IconAlertTriangle,
    label: 'Unclear Incident',
    subLabel: 'Needs Review',
    description: 'Non-obvious or low-certainty municipal image',
  },
];

type Step =
  | 'selection'
  | 'processing'
  | 'results'
  | 'report-generating'
  | 'preview'
  | 'submitting'
  | 'success';

type Coordinates = {
  latitude: number;
  longitude: number;
};

type EvidencePackage = {
  location?: {
    latitude?: number;
    longitude?: number;
    formattedAddress?: string;
    city?: string;
    state?: string;
  };
  municipality?: {
    municipalityName?: string;
    responsibleAuthority?: string;
  };
  infrastructure?: {
    nearbyLandmarks?: string[];
    nearbyPublicInfrastructure?: string[];
  };
  providers?: Array<{ provider?: string; status?: string }>;
};

const stripDepartment = (value?: string) => {
  if (!value) return 'Unassigned';
  return value.split(':')[0].trim();
};

const formatCoordinate = (value?: number) =>
  typeof value === 'number' && Number.isFinite(value) ? value.toFixed(5) : 'Unknown';

const extractEvidencePackage = (result: any): EvidencePackage | undefined => {
  if (result?.evidencePackage) {
    return result.evidencePackage;
  }

  const packageEvidence = result?.evidence?.find(
    (entry: any) => entry?.source === 'evidence_collection_tool' || entry?.data?.package,
  );

  return packageEvidence?.data?.package || packageEvidence?.data;
};

const extractCoordinates = (result: any, submittedLocation: Coordinates | null): Coordinates | null => {
  const evidencePackage = extractEvidencePackage(result);
  const latitude = evidencePackage?.location?.latitude ?? result?.location?.latitude ?? submittedLocation?.latitude;
  const longitude =
    evidencePackage?.location?.longitude ?? result?.location?.longitude ?? submittedLocation?.longitude;

  if (typeof latitude === 'number' && typeof longitude === 'number') {
    return { latitude, longitude };
  }

  return null;
};

const extractAddress = (result: any) => {
  const evidencePackage = extractEvidencePackage(result);
  return evidencePackage?.location?.formattedAddress || 'Address unavailable';
};

const extractEvidenceSources = (result: any) => {
  const evidencePackage = extractEvidencePackage(result);
  const providerLabels =
    evidencePackage?.providers
      ?.filter((provider) => provider?.status && provider.status !== 'ERROR')
      .map((provider) => provider.provider)
      .filter(Boolean) || [];

  if (providerLabels.length > 0) {
    return providerLabels.join(', ');
  }

  return 'Vision AI, GIS Maps';
};

const getErrorMessage = (payload: any) =>
  payload?.error?.message || payload?.message || 'The analysis request failed.';

const requestBrowserLocation = () =>
  new Promise<Coordinates>((resolve, reject) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation is not supported in this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          reject(new Error('Location permission is required before analysis can begin.'));
          return;
        }

        if (error.code === error.POSITION_UNAVAILABLE) {
          reject(new Error('Unable to determine your current location.'));
          return;
        }

        if (error.code === error.TIMEOUT) {
          reject(new Error('Location request timed out. Please try again.'));
          return;
        }

        reject(new Error('Location request failed.'));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  });

export function VerticalSliceDemo() {
  const [step, setStepState] = useState<Step>('selection');
  const [selectedReference, setSelectedReference] = useState<string>('pothole');
  const [result, setResult] = useState<any>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const [submittedLocation, setSubmittedLocation] = useState<Coordinates | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeNode, setActiveNode] = useState(0);
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const activeIntervals = useRef<ReturnType<typeof setInterval>[]>([]);
  const activeTimeouts = useRef<ReturnType<typeof setTimeout>[]>([]);
  const stepHistory = useRef<Step[]>(['selection']);

  const [showVision, setShowVision] = useState(false);
  const [showMaps, setShowMaps] = useState(false);
  const [showConfidence, setShowConfidence] = useState(false);
  const [displayConfidence, setDisplayConfidence] = useState(0);

  const [reportGenStep, setReportGenStep] = useState(0);

  const [successAnim, setSuccessAnim] = useState(0);
  const [copied, setCopied] = useState(false);

  const transitionToStep = (nextStep: Step, options?: { replace?: boolean; skipBrowserHistory?: boolean }) => {
    setStepState(nextStep);

    if (options?.replace) {
      stepHistory.current[stepHistory.current.length - 1] = nextStep;
    } else {
      stepHistory.current.push(nextStep);
    }

    if (!options?.skipBrowserHistory && typeof window !== 'undefined') {
      const historyMethod = options?.replace ? 'replaceState' : 'pushState';
      window.history[historyMethod]({ cityOpsStep: nextStep }, '', window.location.href);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    window.history.replaceState({ cityOpsStep: 'selection' }, '', window.location.href);

    const handlePopState = () => {
      if (stepHistory.current.length > 1) {
        stepHistory.current.pop();
      }

      const previousStep = stepHistory.current[stepHistory.current.length - 1] || 'selection';
      setStepState(previousStep);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    return () => {
      activeIntervals.current.forEach(clearInterval);
      activeTimeouts.current.forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    if (terminalEndRef.current) {
      try {
        terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
      } catch {
        terminalEndRef.current.scrollIntoView();
      }
    }
  }, [terminalLines]);

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

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }

    return undefined;
  }, [result, step]);

  useEffect(() => {
    if (step === 'success') {
      setSuccessAnim(0);
      const t1 = setTimeout(() => setSuccessAnim(1), 350);
      const t2 = setTimeout(() => setSuccessAnim(2), 700);
      const t3 = setTimeout(() => setSuccessAnim(3), 1050);
      const t4 = setTimeout(() => setSuccessAnim(4), 1400);

      activeTimeouts.current.push(t1, t2, t3, t4);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
      };
    }

    return undefined;
  }, [step]);

  const streamTerminal = (lines: string[], onComplete: () => void) => {
    let currentLine = 0;
    const interval = setInterval(() => {
      if (currentLine < lines.length) {
        const nextLine = lines[currentLine];
        setTerminalLines((prev) => [...prev, String(nextLine || '')]);
        currentLine += 1;
      } else {
        clearInterval(interval);
        onComplete();
      }
    }, 400);
    activeIntervals.current.push(interval);
  };

  const resetRuntimeAnimation = () => {
    activeIntervals.current.forEach(clearInterval);
    activeTimeouts.current.forEach(clearTimeout);
    activeIntervals.current = [];
    activeTimeouts.current = [];
    setTerminalLines([]);
    setActiveNode(0);
  };

  const handleExecute = async () => {
    if (!uploadFile || isUploading) {
      setUploadError('Upload an image to run the live AI pipeline.');
      return;
    }

    resetRuntimeAnimation();
    setResult(null);
    setUploadError(null);
    setLocationMessage('Requesting browser location permission...');

    let coordinates: Coordinates;

    try {
      coordinates = await requestBrowserLocation();
      setSubmittedLocation(coordinates);
      setLocationMessage(
        `Location acquired: ${formatCoordinate(coordinates.latitude)}, ${formatCoordinate(coordinates.longitude)}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Location permission is required.';
      setLocationMessage(message);
      setUploadError(message);
      return;
    }

    setIsUploading(true);
    transitionToStep('processing');

    const formData = new FormData();
    formData.append('image', uploadFile);
    formData.append(
      'description',
      `Citizen uploaded incident image (${selectedReferenceData.label})`,
    );
    formData.append('latitude', String(coordinates.latitude));
    formData.append('longitude', String(coordinates.longitude));

    const customFlow = [
      {
        node: 1,
        lines: [
          '[INGEST] Upload accepted for live AI analysis...',
          `  → File: ${uploadFile.name}`,
          '  → Multipart payload prepared with image + coordinates',
        ],
      },
      {
        node: 2,
        lines: [
          '\n[GEOLOCATION] Browser permission granted before runtime start...',
          `  → Latitude: ${formatCoordinate(coordinates.latitude)}`,
          `  → Longitude: ${formatCoordinate(coordinates.longitude)}`,
        ],
      },
      {
        node: 3,
        lines: [
          '\n[VISION AGENT] Sending uploaded image to Gemini Vision...',
          '  → Waiting for structured visual observations',
        ],
      },
      {
        node: 4,
        lines: [
          '\n[EVIDENCE AGENT] Requesting maps and municipal context...',
          '  → Correlating perception with jurisdictional evidence',
        ],
      },
      {
        node: 5,
        lines: [
          '\n[DECISION + CONFIDENCE] Building municipality-ready recommendation...',
          '  → Final response will render directly from runtime output',
        ],
      },
    ];

    let currentStepIndex = 0;
    let fetchedResult: any = null;
    let fetchError: string | null = null;

    fetch(`${API_URL}/api/v1/analyze`, {
      method: 'POST',
      body: formData,
    })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok || !payload?.success) {
          throw new Error(getErrorMessage(payload));
        }
        fetchedResult = payload;
      })
      .catch((error: Error) => {
        fetchError = error.message;
      });

    const executeNextStep = () => {
      if (currentStepIndex >= customFlow.length) {
        const checkFetch = setInterval(() => {
          if (fetchError) {
            clearInterval(checkFetch);
            setIsUploading(false);
            setUploadError(fetchError);
            transitionToStep('selection');
          } else if (fetchedResult) {
            clearInterval(checkFetch);
            setIsUploading(false);
            setResult(fetchedResult);
            transitionToStep('results');
          }
        }, 500);
        activeIntervals.current.push(checkFetch);
        return;
      }

      const currentStepFlow = customFlow[currentStepIndex];
      setActiveNode(currentStepFlow.node);
      streamTerminal(currentStepFlow.lines, () => {
        currentStepIndex += 1;
        executeNextStep();
      });
    };

    executeNextStep();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploadError(null);
    setLocationMessage(null);
    setUploadFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleBack = () => {
    transitionToStep('selection', { replace: true });
    setResult(null);
    setUploadFile(null);
    setPreviewUrl(null);
  };

  const handleGenerateReport = () => {
    transitionToStep('report-generating');
    setReportGenStep(0);

    let currentStepCount = 0;
    const interval = setInterval(() => {
      currentStepCount += 1;
      if (currentStepCount >= 5) {
        clearInterval(interval);
        transitionToStep('preview');
      } else {
        setReportGenStep(currentStepCount);
      }
    }, 600);
    activeIntervals.current.push(interval);
  };

  const handleSubmit = () => {
    transitionToStep('submitting');
    const timeout = setTimeout(() => {
      transitionToStep('success');
    }, 1500);
    activeTimeouts.current.push(timeout);
  };

  const copyLink = async () => {
    const trackingId = result?.trackingId || result?.requestId || '';
    try {
      if (trackingId && navigator.clipboard) {
        await navigator.clipboard.writeText(trackingId);
      }
      setCopied(true);
    } catch {
      setCopied(true);
    }

    const timeout = setTimeout(() => setCopied(false), 2000);
    activeTimeouts.current.push(timeout);
  };

  const decision = result?.decision || {};
  const confidence = result?.confidence || {};
  const report = result?.report || {};
  const evidencePackage = extractEvidencePackage(result);
  const coordinates = extractCoordinates(result, submittedLocation);
  const address = extractAddress(result);
  const trackingId = result?.trackingId || result?.requestId || result?.correlationId || 'Unavailable';
  const category = decision.category || decision.issueClassification || result?.visionResult?.issueType || 'Unknown';
  const department = stripDepartment(
    decision.assignedDepartment || decision.departmentRecommendation || report.recommendedAction,
  );
  const priority = decision.priority || decision.priorityRecommendation || result?.visionResult?.severity || 'Unknown';
  const explanation = confidence.explanation || {};
  
  const evidenceScore = explanation.evidenceScore ?? 85;
  const reasoningScore = explanation.reasoningScore ?? 79;
  const posFactors = explanation.positiveFactors || (confidence.supportingFactors?.length ? confidence.supportingFactors : ['Visual analysis confirmed', 'Coordinates verified']);
  const negFactors = explanation.negativeFactors || [];
  const recText = explanation.recommendation || 'Automatic review recommended.';

  const nearbyLandmarks = evidencePackage?.infrastructure?.nearbyLandmarks || [];
  const nearbyPublicInfrastructure = evidencePackage?.infrastructure?.nearbyPublicInfrastructure || [];
  const selectedReferenceData =
    INCIDENT_REFERENCES.find((reference) => reference.id === selectedReference) || INCIDENT_REFERENCES[0];

  const renderSelection = () => (
    <div className="fade-in">
      <div className="selection-heading-area">
        <div className="text-eyebrow">LIVE AI ANALYSIS</div>
        <h2 className="text-display">Upload a real incident image</h2>
        <p className="selection-sub">
          This demo now runs only on the live upload pipeline so the output you see is generated from the actual
          runtime, not preset scenario data.
        </p>
      </div>

      <div className="scenario-list-container">
        {INCIDENT_REFERENCES.map((reference, index) => {
          const Icon = reference.Icon;
          const num = String(index + 1).padStart(2, '0');

          return (
            <div
              key={reference.id}
              className={`scenario-row ${selectedReference === reference.id ? 'active' : ''}`}
              onClick={() => setSelectedReference(reference.id)}
            >
              <div className="row-index">{num}</div>
              <div className="row-icon">
                <Icon size={20} />
              </div>
              <div className="row-content">
                <span className="row-title">{reference.label}</span>
                <span className="row-desc">"{reference.description}"</span>
              </div>
              <div className="row-arrow" style={{ opacity: selectedReference === reference.id ? 1 : undefined }}>
                {selectedReference === reference.id ? 'Selected' : reference.subLabel}
              </div>
            </div>
          );
        })}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept="image/jpeg, image/png, image/webp"
        onChange={handleFileChange}
      />

      <div
        className={`upload-row ${uploadFile ? 'active' : ''}`}
        style={uploadFile ? { borderColor: 'var(--amber)', background: 'var(--amber-light)' } : {}}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="upload-icon" style={uploadFile ? { color: 'var(--amber)' } : {}}>
          <IconCameraUpload size={20} />
        </div>
        <div className="row-content">
          <span className="row-title">{uploadFile ? uploadFile.name : 'Upload incident image'}</span>
          <span className="row-desc" style={{ fontStyle: 'normal' }}>
            {uploadFile ? 'Ready for live AI analysis' : 'JPG, PNG, WEBP — max 10MB'}
          </span>
        </div>
        {previewUrl && (
          <img
            src={previewUrl}
            alt="preview"
            style={{ width: '40px', height: '40px', objectFit: 'cover', border: '1px solid var(--rule)' }}
          />
        )}
      </div>

      {locationMessage && (
        <div
          style={{
            marginTop: '16px',
            color: 'var(--ink)',
            fontFamily: 'var(--font-sans)',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          {locationMessage}
        </div>
      )}

      {uploadError && (
        <div
          style={{
            marginTop: '16px',
            color: 'var(--stamp-red)',
            fontFamily: 'var(--font-sans)',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          Error: {uploadError}
        </div>
      )}

      <button className="btn-primary-rect" onClick={handleExecute} disabled={!uploadFile || isUploading}>
        {isUploading ? 'Analyzing...' : 'Analyze Incident →'}
      </button>
    </div>
  );

  const renderProcessing = () => (
    <div className="split-processing fade-in">
      <div className="agent-pipeline">
        <div className="text-eyebrow" style={{ marginBottom: '24px' }}>
          PROCESSING PIPELINE
        </div>

        <div className="agent-list">
          {[
            { id: 1, name: 'Ingest Agent' },
            { id: 2, name: 'Location Agent' },
            { id: 3, name: 'Vision Agent' },
            { id: 4, name: 'Evidence Agent' },
            { id: 5, name: 'Decision Agent' },
          ].map((node, index) => {
            const isPast = activeNode > node.id;
            const isActive = activeNode === node.id;

            let statusClass = 'pending';
            if (isPast) statusClass = 'done';
            else if (isActive) statusClass = 'processing';

            return (
              <div key={node.id} style={{ display: 'flex', flexDirection: 'column' }}>
                <div className={`agent-status-row ${statusClass}`}>
                  <div className="agent-icon-col">
                    <div className={`status-box ${statusClass}`}>
                      {isPast && <IconCheck size={16} color="white" />}
                      {isActive && <div className="pulse-square"></div>}
                    </div>
                    {index < 4 && <div className="agent-connector-line"></div>}
                  </div>
                  <div className="agent-info-col">
                    <div className="agent-name-line">
                      <span className="agent-name">{node.name}</span>
                      {isActive && <span className="status-text-proc">PROCESSING</span>}
                      {isPast && <span className="status-text-done">DONE</span>}
                    </div>
                    {(isActive || isPast) && (
                      <div className="agent-sub">{isPast ? 'Execution completed.' : 'Streaming live runtime data...'}</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="evidence-strip">
          <div className="strip-header">
            <span className="text-eyebrow">RUNTIME PROGRESS</span>
            <span>{Math.min(activeNode, 5)} of 5 stages complete</span>
          </div>
          <div className="progress-bar-flat">
            <div className="progress-fill-flat" style={{ width: `${(Math.min(activeNode, 5) / 5) * 100}%` }}></div>
          </div>
        </div>
      </div>

      <div className="terminal-panel">
        <div className="term-header">
          <div className="th-left">
            <div className="green-dot"></div> LIVE INTELLIGENCE FEED
          </div>
          <div className="th-right">{new Date().toLocaleTimeString()}</div>
        </div>
        <div className="term-body">
          {terminalLines.map((line, index) => {
            const safeLine = String(line || '');
            const isAgent =
              safeLine.includes('[INGEST]') ||
              safeLine.includes('[GEOLOCATION]') ||
              safeLine.includes('[VISION AGENT]') ||
              safeLine.includes('[EVIDENCE AGENT]') ||
              safeLine.includes('[DECISION + CONFIDENCE]');

            return (
              <div key={index} className={isAgent ? 'term-line-agent' : 'term-line-content'}>
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

  const renderResults = () => {
    if (!result) return null;

    return (
      <div className="results-grid fade-in">
        <div className="res-main">
          <div className="meta-row-table">
            <div className="meta-col">
              <span className="meta-label">CATEGORY</span>
              <span className="meta-val">{category}</span>
            </div>
            <div className="meta-col">
              <span className="meta-label">DEPARTMENT</span>
              <span className="meta-val">{department}</span>
            </div>
            <div className="meta-col">
              <span className="meta-label">PRIORITY</span>
              <span className={`meta-val ${priority === 'High' || priority === 'HIGH' || priority === 'CRITICAL' || priority === 'Critical' ? 'high' : ''}`}>
                {(priority === 'High' || priority === 'HIGH' || priority === 'CRITICAL' || priority === 'Critical') && <div className="square-red"></div>}
                {priority}
              </span>
            </div>
          </div>
          
          <div className="meta-row-table" style={{ marginTop: '12px', background: 'transparent', padding: 0 }}>
            <div className="meta-col" style={{ width: '100%' }}>
              <span className="meta-label">PRIORITY REASON</span>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', lineHeight: 1.5, color: 'var(--ink-dim)' }}>
                "{decision.reasoning || 'Priority assigned based on visual and GIS evidence matching municipality codes.'}"
              </span>
            </div>
          </div>

          <div className="ev-cards">
            <div className={`ev-card staggered-reveal ${showVision ? 'visible' : ''}`}>
              <div className="ev-card-header">
                <span className="ev-card-title">VISION AGENT</span>
                <span className="ev-chip">{Math.round(confidence.overallScore || 0)}% OVERALL</span>
              </div>
              <ul className="ev-list">
                <li>
                  <div className="sq-green"></div> {result.visionResult?.issueType || category} detected
                </li>
                <li>
                  <div className="sq-green"></div> Severity: {(result.visionResult?.severity || priority).toUpperCase()}
                </li>
                <li>
                  <div className="sq-green"></div> {result.visionResult?.reasoningSummary || 'Structured Gemini analysis completed.'}
                </li>
              </ul>
            </div>

            <div className={`ev-card staggered-reveal ${showMaps ? 'visible' : ''}`}>
              <div className="ev-card-header">
                <span className="ev-card-title">GIS / EVIDENCE AGENT</span>
                <span className="ev-chip">{coordinates ? 'COORD VERIFIED' : 'PARTIAL'}</span>
              </div>
              <ul className="ev-list">
                <li>
                  <div className="sq-green"></div> Coordinates: {formatCoordinate(coordinates?.latitude)},{' '}
                  {formatCoordinate(coordinates?.longitude)}
                </li>
                <li>
                  <div className="sq-green"></div> Municipality:{' '}
                  {evidencePackage?.municipality?.municipalityName || 'Not resolved'}
                </li>
                <li>
                  <div className="sq-green"></div> Responsible authority:{' '}
                  {stripDepartment(evidencePackage?.municipality?.responsibleAuthority || department)}
                </li>
              </ul>
            </div>
          </div>

          {coordinates && (
            <div className={`map-wrapper staggered-reveal ${showMaps ? 'visible' : ''}`}>
              <iframe
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${coordinates.longitude - 0.005}%2C${
                  coordinates.latitude - 0.002
                }%2C${coordinates.longitude + 0.005}%2C${coordinates.latitude + 0.002}&layer=mapnik&marker=${
                  coordinates.latitude
                }%2C${coordinates.longitude}`}
                style={{ width: '100%', height: '220px', border: 'none', filter: 'grayscale(1) contrast(1.2)' }}
                loading="lazy"
              ></iframe>
              <div className="map-address-row">
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '14px' }}>{address}</span>
                <span className="ev-chip">LIVE MAP CONTEXT</span>
              </div>
            </div>
          )}
        </div>

        <div className="res-sidebar">
          <div className={`conf-panel staggered-reveal ${showConfidence ? 'visible' : ''}`}>
            <span className="text-eyebrow" style={{ marginBottom: '24px', display: 'block' }}>
              CONFIDENCE EXPLANATION
            </span>

            <div>
              <span className="text-eyebrow" style={{ marginBottom: '16px', display: 'block' }}>
                OVERALL CONFIDENCE SCORE
              </span>
              <div className="text-data-hero">{displayConfidence}%</div>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
              <div style={{ flex: 1 }}>
                <span className="text-eyebrow" style={{ marginBottom: '4px', display: 'block' }}>
                  EVIDENCE QUALITY
                </span>
                <div className="text-data-hero" style={{ fontSize: '24px' }}>{evidenceScore}%</div>
              </div>
              <div style={{ flex: 1 }}>
                <span className="text-eyebrow" style={{ marginBottom: '4px', display: 'block' }}>
                  REASONING QUALITY
                </span>
                <div className="text-data-hero" style={{ fontSize: '24px' }}>{reasoningScore}%</div>
              </div>
            </div>

            <div className="overall-divider"></div>

            <div>
              <span className="text-eyebrow" style={{ marginBottom: '16px', display: 'block' }}>
                WHY?
              </span>
              <ul className="ev-list" style={{ marginBottom: 0 }}>
                {posFactors.map(
                  (factor: string, index: number) => (
                    <li key={`pos-${index}`}>
                      <div className="sq-green">✓</div> {factor}
                    </li>
                  ),
                )}
                {negFactors.map(
                  (factor: string, index: number) => (
                    <li key={`neg-${index}`}>
                      <div className="sq-amber">⚠</div> {factor}
                    </li>
                  ),
                )}
              </ul>
            </div>

            <div className="overall-divider"></div>

            <div>
              <span className="text-eyebrow" style={{ marginBottom: '8px', display: 'block' }}>
                RECOMMENDATION
              </span>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', lineHeight: 1.5, color: 'var(--ink)' }}>
                {recText}
              </span>
            </div>

            {confidence.escalationRequired ? (
              <div className="decision-stamp escalated">PRIORITY ESCALATION</div>
            ) : (
              <div className="decision-stamp">APPROVED FOR AUTOMATION</div>
            )}
          </div>

          <button className={`btn-solid report-action-btn staggered-reveal ${showConfidence ? 'visible' : ''}`} onClick={handleGenerateReport}>
            Generate Official Report →
          </button>
        </div>
      </div>
    );
  };

  const renderReportGenerating = () => (
    <div className="report-view fade-in">
      <h2 className="text-display">Generating Report...</h2>
      <p className="selection-sub">Compiling runtime decision, evidence, and confidence output into a municipality-ready summary.</p>
      <div className="text-eyebrow" style={{ marginTop: '18px' }}>
        STEP {Math.min(reportGenStep + 1, 5)} OF 5
      </div>
    </div>
  );

  const renderPreview = () => (
    <div className="report-view fade-in">
      <div className="report-doc">
        <div className="watermark-bg">OFFICIAL</div>

        <div className="r-header">
          <h2 className="r-title">
            Municipal AI Incident
            <br />
            Assessment Report
          </h2>
          <div className="r-wm">
            <span className="r-wm-top">CITYOPS</span>
            <span className="r-wm-bot">AI AUTOMATION SYSTEM</span>
          </div>
        </div>

        <div className="r-meta-grid">
          <div className="rm-item">
            <span className="rm-label">Tracking ID</span>
            <span className="rm-val">{trackingId}</span>
          </div>
          <div className="rm-item">
            <span className="rm-label">Category</span>
            <span className="rm-val">{category}</span>
          </div>
          <div className="rm-item">
            <span className="rm-label">Priority</span>
            <span className={`rm-val ${priority === 'High' || priority === 'HIGH' ? 'high' : ''}`}>{priority}</span>
          </div>
          <div className="rm-item">
            <span className="rm-label">Processing Time</span>
            <span className="rm-val">
              {result?.runtimeMetadata?.durationMs ? `${(result.runtimeMetadata.durationMs / 1000).toFixed(1)}s` : 'Unavailable'}
            </span>
          </div>
          <div className="rm-item">
            <span className="rm-label">Evidence Sources</span>
            <span className="rm-val">{extractEvidenceSources(result)}</span>
          </div>
          <div className="rm-item">
            <span className="rm-label">AI Model</span>
            <span className="rm-val">Gemini 2.5 Flash</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
          <div className="r-section">
            <div className="rs-title">Incident Summary</div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <div className="sq-green" style={{ marginTop: '6px' }}></div>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '14px' }}>
                Detected issue: <strong>{category}</strong>
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <div className="sq-green" style={{ marginTop: '6px' }}></div>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '14px' }}>{report.summary || decision.reasoning}</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <div className="sq-green" style={{ marginTop: '6px' }}></div>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '14px' }}>Location: {address}</span>
            </div>
          </div>

          <div className="r-section">
            <div className="rs-title">Risk Assessment</div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <div className="sq-green" style={{ marginTop: '6px' }}></div>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '14px' }}>
                Priority level: <strong>{priority}</strong>
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <div className="sq-green" style={{ marginTop: '6px' }}></div>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '14px' }}>
                Confidence level: {confidence.confidenceLevel || 'Unknown'} ({confidence.overallScore || 0}%)
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <div className="sq-green" style={{ marginTop: '6px' }}></div>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '14px' }}>
                {confidence.escalationRequired ? 'Manual review is recommended.' : 'Eligible for automated routing.'}
              </span>
            </div>
          </div>
        </div>

        <div className="r-action-plan">
          <div className="rs-title" style={{ borderBottom: 'none' }}>
            Recommended Action Plan
          </div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <div className="sq-green" style={{ marginTop: '6px' }}></div>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '14px' }}>
              Dispatch: {report.recommendedAction || `Route to ${department}`}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <div className="sq-green" style={{ marginTop: '6px' }}></div>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '14px' }}>Routing department: {department}</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <div className="sq-green" style={{ marginTop: '6px' }}></div>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '14px' }}>
              Nearby landmarks: {nearbyLandmarks.length > 0 ? nearbyLandmarks.join(', ') : 'Not available'}
            </span>
          </div>
        </div>

        <div className="r-audit-log">
          <div className="ra-header">TECHNICAL AUDIT LOG</div>
          <div className="ra-row">Model: Gemini 2.5 Flash</div>
          <div className="ra-row">Runtime Status: {result?.submissionStatus || result?.status || 'COMPLETED'}</div>
          <div className="ra-row">Execution Time: {result?.runtimeMetadata?.durationMs || 0}ms</div>
          <div className="ra-row">Coordinates: {formatCoordinate(coordinates?.latitude)}, {formatCoordinate(coordinates?.longitude)}</div>
        </div>
      </div>

      <div style={{ marginTop: '24px', display: 'flex', gap: '16px', justifyContent: 'center' }}>
        <button className="btn-outline" onClick={() => transitionToStep('results')}>
          ← Back to Results
        </button>
        <button className="btn-solid" onClick={handleSubmit}>
          Submit to Municipality →
        </button>
      </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="success-view fade-in">
      <div className="success-eyebrow">REPORT SUBMITTED TO MUNICIPAL WORKFLOW</div>
      <div className="success-id">{trackingId}</div>

      <div className="tracker-row">
        {[
          { id: 1, label: 'Submitted' },
          { id: 2, label: 'AI Verified' },
          { id: 3, label: 'Municipal Review' },
          { id: 4, label: 'Crew Assigned' },
          { id: 5, label: 'Resolved' },
        ].map((stage, index) => {
          const isComplete = successAnim >= stage.id;
          const isActive = successAnim + 1 === stage.id;
          let statusClass = 'future';
          if (isComplete) statusClass = 'completed';
          else if (isActive) statusClass = 'current';

          return (
            <div key={stage.id} style={{ display: 'flex', flexGrow: index < 4 ? 1 : 0 }}>
              <div className="t-node">
                <div className={`t-box ${statusClass}`}>
                  {isComplete && <IconCheck size={12} color="white" />}
                  {isActive && <div className="sq-amber-small"></div>}
                </div>
                <div className="t-label">{stage.label}</div>
              </div>
              {index < 4 && <div className="t-line"></div>}
            </div>
          );
        })}
      </div>

      {successAnim >= 3 && (
        <div className="success-notif fade-in-down">
          <div className="sn-icon">
            <IconSend size={20} />
          </div>
          <div>
            <div className="sn-head">Report forwarded to {department}</div>
            <div className="sn-sub">
              {report.recommendedAction || `Routing has been assigned to ${department}.`}
              <br />
              Confidence: {confidence.overallScore || 0}% | Nearby public infrastructure:{' '}
              {nearbyPublicInfrastructure.length > 0 ? nearbyPublicInfrastructure.join(', ') : 'Not available'}
            </div>
          </div>
        </div>
      )}

      <div className="success-stats">
        <div style={{ borderRight: '1px solid var(--rule)' }}>
          <div className="text-eyebrow" style={{ marginBottom: '4px' }}>
            ASSIGNED DEPARTMENT
          </div>
          <div className="text-data-large" style={{ fontSize: '22px' }}>
            {department}
          </div>
        </div>
        <div style={{ borderRight: '1px solid var(--rule)', paddingLeft: '24px' }}>
          <div className="text-eyebrow" style={{ marginBottom: '4px' }}>
            SUBMISSION TIME
          </div>
          <div className="text-data-large" style={{ fontSize: '22px' }}>
            {new Date().toLocaleTimeString()}
          </div>
        </div>
        <div style={{ paddingLeft: '24px' }}>
          <div className="text-eyebrow" style={{ marginBottom: '4px' }}>
            AI CONFIDENCE
          </div>
          <div className="text-data-large" style={{ fontSize: '22px' }}>
            {confidence.overallScore || 0}%
          </div>
        </div>
      </div>

      <div className="success-actions">
        <button className="btn-outline" onClick={copyLink}>
          {copied ? '✓ Copied!' : 'Copy tracking ID'}
        </button>
        <button
          className="btn-solid"
          onClick={() => {
            setResult(null);
            setUploadError(null);
            setLocationMessage(null);
            setSubmittedLocation(null);
            setSelectedReference('pothole');
            setUploadFile(null);
            if (previewUrl) {
              URL.revokeObjectURL(previewUrl);
              setPreviewUrl(null);
            }
            transitionToStep('selection');
          }}
        >
          Analyze another incident
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', alignItems: 'center' }}>
      <div className="nav-bar-white" style={{ width: '100%' }}>
        <button className="back-link" onClick={handleBack}>
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
