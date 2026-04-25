/**
 * TelegramAdapter
 * grammY-based Telegram bot adapter.
 * Credentials (bot token) are decrypted from DB on start.
 * Emits incoming messages to HierarchyOrchestratorService.
 * Status changes emitted via SSE to the frontend channel settings panel.
 */
import { Injectable, Logger } from '@nestjs/common';
import { CryptoService } from '../../crypto/crypto.service';
import { HierarchyOrchestratorService } from '../../hierarchy/hierarchy-orchestrator.service';

// Lazy import to avoid requiring grammY at module load if not used
type BotInstance = any;

@Injectable()
export class TelegramAdapter {
  private readonly logger = new Logger(TelegramAdapter.name);
  private bots = new Map<string, BotInstance>();

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
    const creds = this.crypto.decryptJson<{ botToken: string }>(credentialsEnc);
    if (!creds?.botToken) {
      onStatus('ERROR', 'Missing botToken in credentials');
      return;
    }

    try {
      onStatus('CONNECTING');
      const { Bot } = await import('grammy');
      const bot: BotInstance = new Bot(creds.botToken);

      bot.on('message:text', async (ctx: any) => {
        const text: string = ctx.message.text;
        this.logger.debug(`[Telegram:${channelConfigId}] Message: ${text}`);
        try {
          const result = await this.orchestrator.handle({
            channelType: 'TELEGRAM',
            channelSessionId: String(ctx.chat.id),
            agentId,
            content: text,
            metadata: { telegramUserId: ctx.from?.id },
          });
          await ctx.reply(result.response);
        } catch (err: any) {
          this.logger.error(`Orchestrator error: ${err.message}`);
          await ctx.reply('Lo siento, ocurrió un error procesando tu mensaje.');
        }
      });

      await bot.start({ onStart: () => onStatus('RUNNING') });
      this.bots.set(channelConfigId, bot);
    } catch (err: any) {
      this.logger.error(`Failed to start Telegram bot: ${err.message}`);
      onStatus('ERROR', err.message);
    }
  }

  async stop(channelConfigId: string): Promise<void> {
    const bot = this.bots.get(channelConfigId);
    if (bot) {
      await bot.stop();
      this.bots.delete(channelConfigId);
      this.logger.log(`Telegram bot ${channelConfigId} stopped`);
    }
  }
}
