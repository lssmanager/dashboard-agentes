export const openClawPromptTemplateFiles = ['AGENTS.md', 'SOUL.md', 'TOOLS.md', 'USER.md', 'HEARTBEAT.md'] as const;

export type OpenClawPromptTemplateFile = (typeof openClawPromptTemplateFiles)[number];
