import { useState, type CSSProperties, type ReactNode } from 'react';
import type { FlowNode, AgentSpec, SkillSpec } from '../../../lib/types';

// ── helpers ──────────────────────────────────────────────────────────────────

function fieldLabel(text: string): CSSProperties {
  return { fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, display: 'block' };
}

function inputStyle(): CSSProperties {
  return {
    width: '100%',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--input-border)',
    background: 'var(--input-bg)',
    color: 'var(--input-text)',
    padding: '7px 9px',
    fontSize: 12,
    boxSizing: 'border-box',
  };
}

function textareaStyle(rows = 3): CSSProperties {
  return { ...inputStyle(), resize: 'vertical', minHeight: rows * 22 };
}

function selectStyle(): CSSProperties {
  return { ...inputStyle() };
}

function toggleRow(label: string, checked: boolean, onChange: (v: boolean) => void) {
  return (
    <label
      key={label}
      style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer', color: 'var(--text-primary)' }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ accentColor: 'var(--color-primary)', width: 14, height: 14 }}
      />
      {label}
    </label>
  );
}

function FieldRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: 'grid', gap: 4 }}>
      <span style={fieldLabel(label)}>{label}</span>
      {children}
    </label>
  );
}

function addBtn(label: string, onClick: () => void) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '5px 10px',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--shell-chip-border)',
        background: 'var(--shell-chip-bg)',
        color: 'var(--text-primary)',
        fontSize: 12,
        cursor: 'pointer',
      }}
    >
      + {label}
    </button>
  );
}

function removeBtn(onClick: () => void) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '3px 7px',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--shell-chip-border)',
        background: 'transparent',
        color: 'var(--text-muted)',
        fontSize: 11,
        cursor: 'pointer',
        lineHeight: 1,
      }}
    >
      ×
    </button>
  );
}

// ── Step metadata (technical helpers) ────────────────────────────────────────

export interface StepMetadata {
  inputContract: string;
  outputContract: string;
  availableVariables: string[];
  failureBehavior: string;
  previewExample: string;
}

const STEP_METADATA: Record<string, StepMetadata> = {
  agent: {
    inputContract: 'Receives the current conversation context, instructions and tool bindings.',
    outputContract: 'Returns a structured response object or free-form text based on outputFormat.',
    availableVariables: ['{{input}}', '{{history}}', '{{context}}', '{{tools}}'],
    failureBehavior: 'On model error, propagates an error event to the parent flow. Retries if configured.',
    previewExample: '{ "output": "Classified as billing inquiry", "confidence": 0.92 }',
  },
  if_else: {
    inputContract: 'Evaluates each Case condition against the current workflow state.',
    outputContract: 'Routes to the matching case branch, or to the default branch if no case matches.',
    availableVariables: ['{{state.*}}', '{{input}}', '{{output}}', '{{step.*}}'],
    failureBehavior: 'If a condition throws, the step routes to the error port.',
    previewExample: '{ "branch": "case_1", "matched": true }',
  },
  guardrails: {
    inputContract: 'Receives a text payload and optionally a structured input object.',
    outputContract: 'Passes through if all enabled checks pass. Emits a block event on violation.',
    availableVariables: ['{{input}}', '{{metadata}}'],
    failureBehavior: 'If continueOnError is true, logs violations and continues. Otherwise halts.',
    previewExample: '{ "pass": true, "violations": [] }',
  },
  file_search: {
    inputContract: 'Requires a vectorStore ID and a query string. Supports {{variable}} interpolation.',
    outputContract: 'Returns top-k matching chunks with score and metadata.',
    availableVariables: ['{{query}}', '{{context}}', '{{state.*}}'],
    failureBehavior: 'Returns empty results array on store miss. Throws on auth/config error.',
    previewExample: '{ "results": [{ "text": "...", "score": 0.87, "source": "doc-42" }] }',
  },
  transform: {
    inputContract: 'Reads from workflow state using expression keys.',
    outputContract: 'Emits a new object with the mapped key/value pairs.',
    availableVariables: ['{{input.*}}', '{{state.*}}', '{{step.*}}'],
    failureBehavior: 'Undefined expressions resolve to null. Never throws.',
    previewExample: '{ "fullName": "Alice Smith", "region": "EMEA" }',
  },
  set_state: {
    inputContract: 'Same as Transform but writes keys directly into workflow state.',
    outputContract: 'Updated state object visible to all downstream steps.',
    availableVariables: ['{{input.*}}', '{{state.*}}', '{{step.*}}'],
    failureBehavior: 'Writes are idempotent. Does not throw.',
    previewExample: '{ "state": { "userTier": "pro", "locale": "es-MX" } }',
  },
  classify: {
    inputContract: 'Requires an input string and a category list with optional few-shot examples.',
    outputContract: 'Returns the matched category name and a confidence score.',
    availableVariables: ['{{input}}', '{{history}}'],
    failureBehavior: 'Returns a fallback category if confidence is below threshold.',
    previewExample: '{ "category": "billing", "confidence": 0.95 }',
  },
  user_approval: {
    inputContract: 'Suspends workflow and sends the configured message to the operator channel.',
    outputContract: 'Routes to "Approve" or "Reject" output port based on operator response.',
    availableVariables: ['{{message}}', '{{context.*}}'],
    failureBehavior: 'On timeout, emits a timeout event and routes to Reject by default.',
    previewExample: '{ "decision": "approve", "operator": "ops-team", "timestamp": "..." }',
  },
  end: {
    inputContract: 'Receives the final output of the workflow.',
    outputContract: 'Terminates the flow and exposes the output via the workflow result schema.',
    availableVariables: ['{{output}}', '{{state.*}}'],
    failureBehavior: 'Always terminal. Schema validation errors are reported as warnings.',
    previewExample: '{ "outcome": "completed", "result": { ... } }',
  },
};

// ── Structured Output Modal ───────────────────────────────────────────────────

function StructuredOutputModal({
  open,
  schema,
  onClose,
  onApply,
}: {
  open: boolean;
  schema: unknown;
  onClose: () => void;
  onApply: (schema: unknown) => void;
}) {
  const [mode, setMode] = useState<'simple' | 'advanced'>('simple');
  const [name, setName] = useState('OutputSchema');
  const [properties, setProperties] = useState<Array<{ name: string; type: string; required: boolean }>>(() => {
    const rec = schema as Record<string, unknown> | null;
    const props = rec?.properties as Record<string, { type: string }> | null;
    if (props) {
      return Object.entries(props).map(([n, v]) => ({ name: n, type: v.type ?? 'string', required: false }));
    }
    return [{ name: 'result', type: 'string', required: true }];
  });
  const [rawJson, setRawJson] = useState(() => JSON.stringify(schema ?? {}, null, 2));

  if (!open) return null;

  function handleAdd() {
    setProperties((prev) => [...prev, { name: '', type: 'string', required: false }]);
  }

  function handleGenerate() {
    const generated = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      title: name,
      type: 'object',
      properties: Object.fromEntries(properties.map((p) => [p.name, { type: p.type }])),
      required: properties.filter((p) => p.required).map((p) => p.name),
    };
    setRawJson(JSON.stringify(generated, null, 2));
    setMode('advanced');
  }

  function handleApply() {
    try {
      onApply(JSON.parse(rawJson));
    } catch {
      onApply(rawJson);
    }
    onClose();
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        zIndex: 1000,
        display: 'grid',
        placeItems: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--shell-panel-bg)',
          border: '1px solid var(--shell-panel-border)',
          borderRadius: 'var(--radius-xl)',
          width: 540,
          maxHeight: '80vh',
          overflow: 'auto',
          padding: 24,
          display: 'grid',
          gap: 16,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Structured Output</h3>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18 }}
          >
            ×
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {(['simple', 'advanced'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              style={{
                padding: '5px 14px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid',
                borderColor: mode === m ? 'var(--color-primary)' : 'var(--shell-chip-border)',
                background: mode === m ? 'var(--color-primary-soft)' : 'var(--shell-chip-bg)',
                color: mode === m ? 'var(--color-primary)' : 'var(--text-muted)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {m}
            </button>
          ))}
        </div>

        {mode === 'simple' ? (
          <div style={{ display: 'grid', gap: 12 }}>
            <FieldRow label="Schema name">
              <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle()} />
            </FieldRow>

            <div>
              <span style={fieldLabel('Properties')}>Properties</span>
              <div style={{ display: 'grid', gap: 6 }}>
                {properties.map((prop, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 32px 32px', gap: 6 }}>
                    <input
                      placeholder="name"
                      value={prop.name}
                      onChange={(e) => setProperties((prev) => prev.map((p, idx) => (idx === i ? { ...p, name: e.target.value } : p)))}
                      style={inputStyle()}
                    />
                    <select
                      value={prop.type}
                      onChange={(e) => setProperties((prev) => prev.map((p, idx) => (idx === i ? { ...p, type: e.target.value } : p)))}
                      style={selectStyle()}
                    >
                      {['string', 'number', 'boolean', 'object', 'array'].map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 11, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={prop.required}
                        onChange={(e) => setProperties((prev) => prev.map((p, idx) => (idx === i ? { ...p, required: e.target.checked } : p)))}
                      />
                      req
                    </label>
                    {removeBtn(() => setProperties((prev) => prev.filter((_, idx) => idx !== i)))}
                  </div>
                ))}
                {addBtn('Add property', handleAdd)}
              </div>
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-primary)',
                background: 'var(--color-primary-soft)',
                color: 'var(--color-primary)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Generate JSON Schema ↓
            </button>
          </div>
        ) : (
          <FieldRow label="JSON Schema">
            <textarea
              value={rawJson}
              onChange={(e) => setRawJson(e.target.value)}
              rows={12}
              style={{ ...textareaStyle(12), fontFamily: 'monospace', fontSize: 11 }}
            />
          </FieldRow>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={{ ...inputStyle(), width: 'auto', cursor: 'pointer' }}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            style={{
              padding: '8px 20px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid color-mix(in srgb, var(--color-primary) 38%, transparent)',
              background: 'var(--btn-primary-bg)',
              color: 'var(--btn-primary-text)',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Specialized forms ─────────────────────────────────────────────────────────

interface FormProps {
  node: FlowNode;
  agents: AgentSpec[];
  skills: SkillSpec[];
}

export function AgentStepForm({ node, agents }: FormProps) {
  const cfg = node.config;
  const [instructions, setInstructions] = useState(typeof cfg.instructions === 'string' ? cfg.instructions : '');
  const [model, setModel] = useState(typeof cfg.model === 'string' ? cfg.model : 'gpt-4o');
  const [reasoningEffort, setReasoningEffort] = useState(typeof cfg.reasoningEffort === 'string' ? cfg.reasoningEffort : 'medium');
  const [outputFormat, setOutputFormat] = useState(typeof cfg.outputFormat === 'string' ? cfg.outputFormat : 'text');
  const [includeChatHistory, setIncludeChatHistory] = useState(Boolean(cfg.includeChatHistory));
  const [schemaModalOpen, setSchemaModalOpen] = useState(false);

  const agentName = agents[0]?.name ?? 'Agent';

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <FieldRow label="Name">
        <input defaultValue={agentName} style={inputStyle()} />
      </FieldRow>

      <FieldRow label="Instructions">
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={5}
          placeholder="You are a helpful agent that..."
          style={textareaStyle(5)}
        />
      </FieldRow>

      <FieldRow label="Model">
        <select value={model} onChange={(e) => setModel(e.target.value)} style={selectStyle()}>
          {['gpt-4o', 'gpt-4o-mini', 'gpt-4.1', 'gpt-4.1-mini', 'claude-opus-4', 'claude-sonnet-4', 'gemini-2.5-pro'].map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </FieldRow>

      <FieldRow label="Reasoning effort">
        <select value={reasoningEffort} onChange={(e) => setReasoningEffort(e.target.value)} style={selectStyle()}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </FieldRow>

      <FieldRow label="Output format">
        <select value={outputFormat} onChange={(e) => setOutputFormat(e.target.value)} style={selectStyle()}>
          <option value="text">Text</option>
          <option value="json">JSON (structured)</option>
          <option value="markdown">Markdown</option>
        </select>
      </FieldRow>

      {outputFormat === 'json' && (
        <button
          type="button"
          onClick={() => setSchemaModalOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '7px 12px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-primary)',
            background: 'var(--color-primary-soft)',
            color: 'var(--color-primary)',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          📐 Configure response_schema
        </button>
      )}

      {toggleRow('Include chat history', includeChatHistory, setIncludeChatHistory)}

      <StructuredOutputModal
        open={schemaModalOpen}
        schema={cfg.responseSchema}
        onClose={() => setSchemaModalOpen(false)}
        onApply={() => setSchemaModalOpen(false)}
      />
    </div>
  );
}

export function IfElseStepForm({ node }: FormProps) {
  const rawCases = Array.isArray(node.config.cases)
    ? (node.config.cases as Array<{ name: string; condition: string }>)
    : [{ name: 'Case 1', condition: '' }];
  const [cases, setCases] = useState(rawCases);

  function addCase() {
    setCases((prev) => [...prev, { name: `Case ${prev.length + 1}`, condition: '' }]);
  }

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {cases.map((c, i) => (
        <div
          key={i}
          style={{
            border: '1px solid var(--shell-chip-border)',
            borderRadius: 'var(--radius-md)',
            padding: 10,
            display: 'grid',
            gap: 8,
            background: 'var(--shell-chip-bg)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <input
              placeholder="Case name"
              value={c.name}
              onChange={(e) =>
                setCases((prev) => prev.map((item, idx) => (idx === i ? { ...item, name: e.target.value } : item)))
              }
              style={{ ...inputStyle(), fontWeight: 600, fontSize: 13 }}
            />
            {cases.length > 1 && removeBtn(() => setCases((prev) => prev.filter((_, idx) => idx !== i)))}
          </div>
          <FieldRow label="Condition">
            <input
              placeholder="e.g. {{input.intent}} == 'billing'"
              value={c.condition}
              onChange={(e) =>
                setCases((prev) => prev.map((item, idx) => (idx === i ? { ...item, condition: e.target.value } : item)))
              }
              style={inputStyle()}
            />
          </FieldRow>
        </div>
      ))}
      {addBtn('Add case', addCase)}
    </div>
  );
}

export function GuardrailsStepForm({ node }: FormProps) {
  const cfg = node.config;
  const [pii, setPii] = useState(Boolean(cfg.pii));
  const [moderation, setModeration] = useState(Boolean(cfg.moderation));
  const [jailbreak, setJailbreak] = useState(Boolean(cfg.jailbreak));
  const [hallucination, setHallucination] = useState(Boolean(cfg.hallucination));
  const [nsfwText, setNsfwText] = useState(Boolean(cfg.nsfwText));
  const [urlFilter, setUrlFilter] = useState(Boolean(cfg.urlFilter));
  const [promptInjection, setPromptInjection] = useState(Boolean(cfg.promptInjection));
  const [customPromptCheck, setCustomPromptCheck] = useState(Boolean(cfg.customPromptCheck));
  const [continueOnError, setContinueOnError] = useState(Boolean(cfg.continueOnError));
  const [input, setInput] = useState(typeof cfg.input === 'string' ? cfg.input : '');

  const toggles: Array<[string, boolean, (v: boolean) => void]> = [
    ['PII detection', pii, setPii],
    ['Content moderation', moderation, setModeration],
    ['Jailbreak detection', jailbreak, setJailbreak],
    ['Hallucination check', hallucination, setHallucination],
    ['NSFW text filter', nsfwText, setNsfwText],
    ['URL filter', urlFilter, setUrlFilter],
    ['Prompt injection detection', promptInjection, setPromptInjection],
    ['Custom prompt check', customPromptCheck, setCustomPromptCheck],
  ];

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <FieldRow label="Input expression">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="{{input.text}}"
          style={inputStyle()}
        />
      </FieldRow>

      <div>
        <span style={fieldLabel('Checks')}>Checks</span>
        <div style={{ display: 'grid', gap: 6 }}>
          {toggles.map(([label, checked, setter]) => toggleRow(label, checked, setter))}
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--shell-chip-border)', paddingTop: 8 }}>
        {toggleRow('Continue on error', continueOnError, setContinueOnError)}
      </div>
    </div>
  );
}

export function FileSearchStepForm({ node }: FormProps) {
  const cfg = node.config;
  const [vectorStore, setVectorStore] = useState(typeof cfg.vectorStore === 'string' ? cfg.vectorStore : '');
  const [maxResults, setMaxResults] = useState(typeof cfg.maxResults === 'number' ? cfg.maxResults : 5);
  const [query, setQuery] = useState(typeof cfg.query === 'string' ? cfg.query : '');

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <FieldRow label="Vector store">
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            value={vectorStore}
            onChange={(e) => setVectorStore(e.target.value)}
            placeholder="vs-xxxxxxxx"
            style={{ ...inputStyle(), flex: 1 }}
          />
          <button
            type="button"
            style={{
              padding: '7px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--shell-chip-border)',
              background: 'var(--shell-chip-bg)',
              color: 'var(--text-primary)',
              fontSize: 12,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Create
          </button>
        </div>
      </FieldRow>

      <FieldRow label="Max results">
        <input
          type="number"
          value={maxResults}
          min={1}
          max={20}
          onChange={(e) => setMaxResults(Number(e.target.value))}
          style={inputStyle()}
        />
      </FieldRow>

      <FieldRow label="Query (supports {{variables}})">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="{{input.question}}"
          style={inputStyle()}
        />
      </FieldRow>
    </div>
  );
}

export function TransformStepForm({ node }: FormProps) {
  const rawRows = Array.isArray(node.config.rows)
    ? (node.config.rows as Array<{ key: string; value: string }>)
    : [{ key: '', value: '' }];
  const [mode, setMode] = useState(typeof node.config.mode === 'string' ? node.config.mode : 'expressions');
  const [rows, setRows] = useState(rawRows);

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <FieldRow label="Mode">
        <select value={mode} onChange={(e) => setMode(e.target.value)} style={selectStyle()}>
          <option value="expressions">Expressions</option>
          <option value="object">Object builder</option>
        </select>
      </FieldRow>

      <div>
        <span style={fieldLabel('Key / Value mappings')}>Key / Value mappings</span>
        <div style={{ display: 'grid', gap: 6 }}>
          {rows.map((row, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 28px', gap: 6 }}>
              <input
                placeholder="output key"
                value={row.key}
                onChange={(e) =>
                  setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, key: e.target.value } : r)))
                }
                style={inputStyle()}
              />
              <input
                placeholder="{{expression}}"
                value={row.value}
                onChange={(e) =>
                  setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, value: e.target.value } : r)))
                }
                style={inputStyle()}
              />
              {removeBtn(() => setRows((prev) => prev.filter((_, idx) => idx !== i)))}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 6 }}>{addBtn('Add row', () => setRows((prev) => [...prev, { key: '', value: '' }]))}</div>
      </div>

      <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
        Use <code>{'{{state.varName}}'}</code> or <code>{'{{input.field}}'}</code> in values. Expressions are evaluated against the current workflow state.
      </p>
    </div>
  );
}

export function SetStateStepForm({ node }: FormProps) {
  const rawRows = Array.isArray(node.config.rows)
    ? (node.config.rows as Array<{ key: string; value: string }>)
    : [{ key: '', value: '' }];
  const [rows, setRows] = useState(rawRows);

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div>
        <span style={fieldLabel('State variable assignments')}>State variable assignments</span>
        <div style={{ display: 'grid', gap: 6 }}>
          {rows.map((row, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 28px', gap: 6 }}>
              <input
                placeholder="state.varName"
                value={row.key}
                onChange={(e) =>
                  setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, key: e.target.value } : r)))
                }
                style={inputStyle()}
              />
              <input
                placeholder="{{expression}}"
                value={row.value}
                onChange={(e) =>
                  setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, value: e.target.value } : r)))
                }
                style={inputStyle()}
              />
              {removeBtn(() => setRows((prev) => prev.filter((_, idx) => idx !== i)))}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 6 }}>{addBtn('Add assignment', () => setRows((prev) => [...prev, { key: '', value: '' }]))}</div>
      </div>
    </div>
  );
}

export function ClassifyStepForm({ node }: FormProps) {
  const cfg = node.config;
  const [name, setName] = useState(typeof cfg.name === 'string' ? cfg.name : '');
  const [input, setInput] = useState(typeof cfg.input === 'string' ? cfg.input : '');
  const [classifier, setClassifier] = useState(typeof cfg.classifier === 'string' ? cfg.classifier : 'llm');
  const rawCats = Array.isArray(cfg.categories) ? (cfg.categories as string[]) : [];
  const [categories, setCategories] = useState(rawCats);
  const [newCat, setNewCat] = useState('');
  const rawExamples = Array.isArray(cfg.examples) ? (cfg.examples as Array<{ input: string; category: string }>) : [];
  const [examples, setExamples] = useState(rawExamples);

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <FieldRow label="Name">
        <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle()} />
      </FieldRow>
      <FieldRow label="Input expression">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="{{input.text}}" style={inputStyle()} />
      </FieldRow>
      <FieldRow label="Classifier">
        <select value={classifier} onChange={(e) => setClassifier(e.target.value)} style={selectStyle()}>
          <option value="llm">LLM</option>
          <option value="embeddings">Embeddings</option>
          <option value="regex">Regex</option>
        </select>
      </FieldRow>

      <div>
        <span style={fieldLabel('Categories')}>Categories</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
          {categories.map((cat) => (
            <span
              key={cat}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                borderRadius: 999,
                padding: '3px 10px',
                background: 'var(--color-primary-soft)',
                color: 'var(--color-primary)',
                fontSize: 12,
              }}
            >
              {cat}
              <button
                type="button"
                onClick={() => setCategories((prev) => prev.filter((c) => c !== cat))}
                style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: 12, padding: 0, lineHeight: 1 }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            placeholder="Category name"
            style={{ ...inputStyle(), flex: 1 }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newCat.trim()) {
                setCategories((prev) => [...prev, newCat.trim()]);
                setNewCat('');
              }
            }}
          />
          <button
            type="button"
            onClick={() => {
              if (newCat.trim()) {
                setCategories((prev) => [...prev, newCat.trim()]);
                setNewCat('');
              }
            }}
            style={{
              padding: '7px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--shell-chip-border)',
              background: 'var(--shell-chip-bg)',
              color: 'var(--text-primary)',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Add
          </button>
        </div>
      </div>

      <div>
        <span style={fieldLabel('Few-shot examples')}>Few-shot examples</span>
        <div style={{ display: 'grid', gap: 6 }}>
          {examples.map((ex, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 28px', gap: 6 }}>
              <input
                placeholder="Input text"
                value={ex.input}
                onChange={(e) =>
                  setExamples((prev) => prev.map((item, idx) => (idx === i ? { ...item, input: e.target.value } : item)))
                }
                style={inputStyle()}
              />
              <select
                value={ex.category}
                onChange={(e) =>
                  setExamples((prev) => prev.map((item, idx) => (idx === i ? { ...item, category: e.target.value } : item)))
                }
                style={selectStyle()}
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {removeBtn(() => setExamples((prev) => prev.filter((_, idx) => idx !== i)))}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 6 }}>{addBtn('Add example', () => setExamples((prev) => [...prev, { input: '', category: '' }]))}</div>
      </div>
    </div>
  );
}

export function UserApprovalStepForm({ node }: FormProps) {
  const cfg = node.config;
  const [name, setName] = useState(typeof cfg.name === 'string' ? cfg.name : '');
  const [message, setMessage] = useState(typeof cfg.message === 'string' ? cfg.message : '');
  const rawContext = Array.isArray(cfg.context) ? (cfg.context as string[]) : [];
  const [contextItems, setContextItems] = useState(rawContext);
  const [newCtx, setNewCtx] = useState('');

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <FieldRow label="Name">
        <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle()} />
      </FieldRow>
      <FieldRow label="Approval message">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          placeholder="Please review and approve the following action..."
          style={textareaStyle(3)}
        />
      </FieldRow>

      <div>
        <span style={fieldLabel('Context (additional info shown to approver)')}>Context</span>
        <div style={{ display: 'grid', gap: 5, marginBottom: 6 }}>
          {contextItems.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                value={item}
                onChange={(e) =>
                  setContextItems((prev) => prev.map((c, idx) => (idx === i ? e.target.value : c)))
                }
                style={{ ...inputStyle(), flex: 1 }}
              />
              {removeBtn(() => setContextItems((prev) => prev.filter((_, idx) => idx !== i)))}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            value={newCtx}
            onChange={(e) => setNewCtx(e.target.value)}
            placeholder="{{state.variable}}"
            style={{ ...inputStyle(), flex: 1 }}
          />
          <button
            type="button"
            onClick={() => {
              if (newCtx.trim()) {
                setContextItems((prev) => [...prev, newCtx.trim()]);
                setNewCtx('');
              }
            }}
            style={{
              padding: '7px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--shell-chip-border)',
              background: 'var(--shell-chip-bg)',
              color: 'var(--text-primary)',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Add context
          </button>
        </div>
      </div>

      <div>
        <span style={fieldLabel('Output ports')}>Output ports</span>
        <div style={{ display: 'grid', gap: 6 }}>
          {(['Approve', 'Reject'] as const).map((port) => (
            <div
              key={port}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '7px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--shell-chip-border)',
                background: 'var(--shell-chip-bg)',
                fontSize: 12,
                color: port === 'Approve' ? 'var(--color-success)' : 'var(--color-error)',
              }}
            >
              <span>{port === 'Approve' ? '✓' : '✗'}</span>
              <span style={{ fontWeight: 600 }}>{port}</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>→ output port</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function EndStepForm({ node }: FormProps) {
  const cfg = node.config;
  const [outcome, setOutcome] = useState(typeof cfg.outcome === 'string' ? cfg.outcome : 'completed');
  const [schemaModalOpen, setSchemaModalOpen] = useState(false);
  const [outputSchema, setOutputSchema] = useState<unknown>(cfg.outputSchema ?? null);

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <FieldRow label="Outcome">
        <select value={outcome} onChange={(e) => setOutcome(e.target.value)} style={selectStyle()}>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="escalated">Escalated</option>
          <option value="timeout">Timeout</option>
        </select>
      </FieldRow>

      <FieldRow label="Output schema">
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: outputSchema ? 'var(--color-success)' : 'var(--text-muted)' }}>
            {outputSchema ? 'Schema configured' : 'No schema'}
          </span>
          <button
            type="button"
            onClick={() => setSchemaModalOpen(true)}
            style={{
              padding: '5px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--shell-chip-border)',
              background: 'var(--shell-chip-bg)',
              color: 'var(--text-primary)',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            {outputSchema ? 'Edit schema' : 'Add schema'}
          </button>
        </div>
      </FieldRow>

      <StructuredOutputModal
        open={schemaModalOpen}
        schema={outputSchema}
        onClose={() => setSchemaModalOpen(false)}
        onApply={(s) => { setOutputSchema(s); setSchemaModalOpen(false); }}
      />
    </div>
  );
}

export function NoteStepForm({ node }: FormProps) {
  const [text, setText] = useState(typeof node.config.text === 'string' ? node.config.text : '');
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <FieldRow label="Note text">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          placeholder="Add a note to document this part of the flow..."
          style={textareaStyle(5)}
        />
      </FieldRow>
    </div>
  );
}

export function McpStepForm({ node }: FormProps) {
  const cfg = node.config;
  const [server, setServer] = useState(typeof cfg.server === 'string' ? cfg.server : '');
  const [tool, setTool] = useState(typeof cfg.tool === 'string' ? cfg.tool : '');

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <FieldRow label="MCP Server">
        <input value={server} onChange={(e) => setServer(e.target.value)} placeholder="mcp-server-name" style={inputStyle()} />
      </FieldRow>
      <FieldRow label="Tool">
        <input value={tool} onChange={(e) => setTool(e.target.value)} placeholder="tool-name" style={inputStyle()} />
      </FieldRow>
    </div>
  );
}

export function DefaultNodeForm({ node }: FormProps) {
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <FieldRow label="Node ID">
        <code style={{ fontSize: 11, color: 'var(--text-primary)', padding: '5px 8px', background: 'var(--shell-chip-bg)', borderRadius: 'var(--radius-sm)', display: 'block' }}>
          {node.id}
        </code>
      </FieldRow>
      <FieldRow label="Type">
        <code style={{ fontSize: 11, color: 'var(--text-primary)', padding: '5px 8px', background: 'var(--shell-chip-bg)', borderRadius: 'var(--radius-sm)', display: 'block' }}>
          {node.type}
        </code>
      </FieldRow>
    </div>
  );
}

// ── TechnicalHelpers ─────────────────────────────────────────────────────────

export function TechnicalHelpers({ nodeType }: { nodeType: string }) {
  const meta = STEP_METADATA[nodeType];
  if (!meta) return null;

  const [open, setOpen] = useState(false);

  return (
    <div
      style={{
        borderTop: '1px solid var(--shell-chip-border)',
        marginTop: 10,
        paddingTop: 10,
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--text-muted)',
          padding: 0,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        <span>{open ? '▾' : '▸'}</span>
        Technical Helpers
      </button>

      {open && (
        <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
          {[
            { label: 'Input contract', value: meta.inputContract },
            { label: 'Output contract', value: meta.outputContract },
            { label: 'Failure behavior', value: meta.failureBehavior },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'grid', gap: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
                {label}
              </span>
              <p style={{ margin: 0, fontSize: 11, color: 'var(--text-primary)', lineHeight: 1.5 }}>{value}</p>
            </div>
          ))}

          <div>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
              Available variables
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
              {meta.availableVariables.map((v) => (
                <code
                  key={v}
                  style={{
                    fontSize: 10,
                    padding: '2px 6px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--shell-chip-bg)',
                    border: '1px solid var(--shell-chip-border)',
                    color: 'var(--color-primary)',
                  }}
                >
                  {v}
                </code>
              ))}
            </div>
          </div>

          <div>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
              Preview example
            </span>
            <pre
              style={{
                fontSize: 10,
                padding: '6px 8px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--shell-chip-bg)',
                border: '1px solid var(--shell-chip-border)',
                color: 'var(--text-primary)',
                margin: '4px 0 0',
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}
            >
              {meta.previewExample}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Registry ──────────────────────────────────────────────────────────────────

type FormComponent = (props: FormProps) => JSX.Element;

const REGISTRY: Record<string, FormComponent> = {
  agent: AgentStepForm,
  subagent: AgentStepForm,
  if_else: IfElseStepForm,
  condition: IfElseStepForm,
  guardrails: GuardrailsStepForm,
  file_search: FileSearchStepForm,
  transform: TransformStepForm,
  set_state: SetStateStepForm,
  classify: ClassifyStepForm,
  user_approval: UserApprovalStepForm,
  approval: UserApprovalStepForm,
  end: EndStepForm,
  note: NoteStepForm,
  mcp: McpStepForm,
};

interface NodeFormRegistryProps {
  node: FlowNode;
  agents: AgentSpec[];
  skills: SkillSpec[];
}

export function NodeFormRegistry({ node, agents, skills }: NodeFormRegistryProps) {
  const FormComponent = REGISTRY[node.type] ?? DefaultNodeForm;

  return (
    <div>
      <FormComponent node={node} agents={agents} skills={skills} />
      <TechnicalHelpers nodeType={node.type} />
    </div>
  );
}
