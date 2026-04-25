/**
 * DiscordAdapter
 * discord.js-based adapter.
 * Listens to guild messages and routes to HierarchyOrchestrator.
 */
import { Injectable, Logger } from '@nestjs/common';
import { CryptoService } from '../../crypto/crypto.service';
import { HierarchyOrchestratorService } from '../../hierarchy/hierarchy-orchestrator.service';

type ClientInstance = any;

@Injectable()
export class DiscordAdapter {
  private readonly logger = new Logger(DiscordAdapter.name);
  private clients = new Map<string, ClientInstance>();

  constructor(
    private readonly crypto: CryptoService,
    private readonly orchestrator: HierarchyOrchestratorService,
  ) {}

  async start(
    channelConfigId: string,
    credentialsEnc: string,
    agentId: string,
    onStatus: (status: string, error?: string) => void,
  ): Promise<void> {
    const creds = this.crypto.decryptJson<{ token: string; guildId?: string }>(credentialsEnc);
    if (!creds?.token) {
      onStatus('ERROR', 'Missing token in credentials');
      return;
    }

    try {
      onStatus('CONNECTING');
      const { Client, GatewayIntentBits } = await import('discord.js');
      const client: ClientInstance = new Client({
        intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
      });

      client.on('ready', () => {
        this.logger.log(`Discord bot ready: ${client.user?.tag}`);
        onStatus('RUNNING');
      });

      client.on('messageCreate', async (message: any) => {
        if (message.author.bot) return;
        if (creds.guildId && message.guildId !== creds.guildId) return;

        try {
          const result = await this.orchestrator.handle({
            channelType: 'DISCORD',
            channelSessionId: message.channelId,
            agentId,
            content: message.content,
            metadata: { discordUserId: message.author.id, guildId: message.guildId },
          });
          await message.reply(result.response);
        } catch (err: any) {
          this.logger.error(`Discord orchestrator error: ${err.message}`);
        }
      });

      await client.login(creds.token);
      this.clients.set(channelConfigId, client);
    } catch (err: any) {
      this.logger.error(`Failed to start Discord bot: ${err.message}`);
      onStatus('ERROR', err.message);
    }
  }

  async stop(channelConfigId: string): Promise<void> {
    const client = this.clients.get(channelConfigId);
    if (client) {
      client.destroy();
      this.clients.delete(channelConfigId);
    }
  }
}
