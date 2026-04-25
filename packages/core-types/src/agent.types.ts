/**
 * Core type definitions for Agent Visual Studio.
 * Used across api/ and web/ packages.
 * Inspired by: CrewAI role/goal/backstory, LangGraph StateGraph, AutoGen AgentConfig
 */

// ─── Agent Definition (CrewAI-inspired) ───────────────────────────────────────

export interface AgentDefinition {
  id: string;
  name: string;
  /** What the agent IS — its title, specialization */
  role: string;
  /** What the agent wants to ACHIEVE — guides every decision */
  goal: string;
  /** Narrative context — improves behavioral consistency */
  backstory: string;
  systemPrompt: string;
  modelId?: string;
  channelId?: string;
  executionMode: 'SEQUENTIAL' | 'HIERARCHICAL';
}

// ─── Flow / StateGraph (LangGraph-inspired) ───────────────────────────────────

export type FlowNodeType =
  | 'LLM_CALL'
  | 'TOOL_CALL'
  | 'CONDITION'      // @router pattern
  | 'LOOP'
  | 'SUBAGENT'
  | 'SUPERVISOR'     // Process.hierarchical
  | 'N8N_WORKFLOW'
  | 'HUMAN_APPROVAL' // interrupt() pattern
  | 'STATE'
  | 'START'
  | 'END';

export interface FlowNodeDefinition {
  id: string;
  nodeType: FlowNodeType;
  label: string;
  positionX: number;
  positionY: number;
  config: Record<string, unknown>;
}

export interface FlowEdgeDefinition {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  label?: string;
  condition?: string;
}

export interface FlowDefinition {
  id: string;
  name: string;
  nodes: FlowNodeDefinition[];
  edges: FlowEdgeDefinition[];
}

// ─── Run State (LangGraph GraphState-inspired) ────────────────────────────────

export interface RunState {
  runId: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'INTERRUPTED';
  currentStepIndex: number;
  stateVars: Record<string, unknown>;
  steps: RunStepSummary[];
}

export interface RunStepSummary {
  id: string;
  stepIndex: number;
  nodeType: FlowNodeType;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'INTERRUPTED' | 'SKIPPED';
  tokensUsed: number;
  costUsd: number;
  createdAt: string;
  completedAt?: string;
}

// ─── Hierarchy ────────────────────────────────────────────────────────────────

export type ScopeType = 'agency' | 'department' | 'workspace' | 'agent';

export interface HierarchyScope {
  id: string;
  name: string;
  type: ScopeType;
  systemPrompt: string;
  children?: HierarchyScope[];
}

// ─── Channels ─────────────────────────────────────────────────────────────────

export type ChannelType = 'WEBCHAT' | 'TELEGRAM' | 'DISCORD' | 'WHATSAPP' | 'TEAMS';
export type ChannelStatus = 'RUNNING' | 'STOPPED' | 'ERROR' | 'CONNECTING';

export interface ChannelConfigSummary {
  id: string;
  channelType: ChannelType;
  name: string;
  status: ChannelStatus;
}

// ─── Pending Approvals ────────────────────────────────────────────────────────

export interface PendingApprovalSummary {
  id: string;
  title: string;
  description: string;
  contextData: Record<string, unknown>;
  runId: string;
  createdAt: string;
}
