export interface ProfileRoutingRule {
  from: string;
  to: string;
  when: string;
  priority: number;
}

export interface ProfileSpec {
  id: string;
  name: string;
  description: string;
  category?: 'operations' | 'support' | 'engineering' | 'monitoring';
  defaultModel?: string;
  defaultSkills: string[];
  defaultPolicies?: string[];
  defaultRoutingRules?: ProfileRoutingRule[];
  routines: string[];
  tags?: string[];
}
