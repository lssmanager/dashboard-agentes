/**
 * ChannelManagerService
 * Starts/stops channel adapters based on ChannelConfig records in DB.
 * Called on app boot (starts all RUNNING channels) and via API when
 * user configures a new channel from the UI.
 * Emits real-time status updates via SSE.
 */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramAdapter } from './adapters/telegram.adapter';
import { DiscordAdapter } from './adapters/discord.adapter';
import { ChannelStatus, ChannelType } from '@prisma/client';

@Injectable()
export class ChannelManagerService implements OnModuleInit {
  private readonly logger = new Logger(ChannelManagerService.name);
  private sseClients = new Map<string, (event: string, data: unknown) => void>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly telegram: TelegramAdapter,
    private readonly discord: DiscordAdapter,
  ) {}

  async onModuleInit(): Promise<void> {
    // On boot, start all channels that were previously RUNNING
    const configs = await this.prisma.channelConfig.findMany({
      where: { status: ChannelStatus.RUNNING },
      include: { bindings: true },
    });

    this.logger.log(`Auto-starting ${configs.length} channel(s) from DB`);
    for (const config of configs) {
      const agentId = config.bindings[0]?.agentId;
      if (agentId) await this.startChannel(config.id, agentId);
    }
  }

  async startChannel(channelConfigId: string, agentId: string): Promise<void> {
    const config = await this.prisma.channelConfig.findUniqueOrThrow({
      where: { id: channelConfigId },
    });

    const onStatus = async (status: string, error?: string) => {
      await this.prisma.channelConfig.update({
        where: { id: channelConfigId },
        data: { status: status as ChannelStatus },
      });
      this.emit(`channel:${channelConfigId}`, { status, error });
    };

    switch (config.channelType) {
      case ChannelType.TELEGRAM:
        await this.telegram.start(channelConfigId, config.credentialsEnc, agentId, onStatus);
        break;
      case ChannelType.DISCORD:
        await this.discord.start(channelConfigId, config.credentialsEnc, agentId, onStatus);
        break;
      default:
        this.logger.warn(`Channel type ${config.channelType} not implemented yet`);
    }
  }

  async stopChannel(channelConfigId: string): Promise<void> {
    const config = await this.prisma.channelConfig.findUniqueOrThrow({
      where: { id: channelConfigId },
    });

    switch (config.channelType) {
      case ChannelType.TELEGRAM:
        await this.telegram.stop(channelConfigId);
        break;
      case ChannelType.DISCORD:
        await this.discord.stop(channelConfigId);
        break;
    }

    await this.prisma.channelConfig.update({
      where: { id: channelConfigId },
      data: { status: ChannelStatus.STOPPED },
    });
  }

  /** Register an SSE client for real-time channel status */
  registerSseClient(clientId: string, emitter: (event: string, data: unknown) => void): void {
    this.sseClients.set(clientId, emitter);
  }

  unregisterSseClient(clientId: string): void {
    this.sseClients.delete(clientId);
  }

  private emit(event: string, data: unknown): void {
    for (const emitter of this.sseClients.values()) {
      try { emitter(event, data); } catch { /* client disconnected */ }
    }
  }
}
