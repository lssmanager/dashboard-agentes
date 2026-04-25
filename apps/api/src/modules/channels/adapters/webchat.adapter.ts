/**
 * WebChatAdapter
 * Native WebSocket adapter (no external SDK needed).
 * Manages sessions per WebSocket connection.
 * Auto-binds to agent scope when connection carries agentId.
 */
import { Injectable, Logger } from '@nestjs/common';
import { WebSocketServer, WebSocket } from 'ws';
import { HierarchyOrchestratorService } from '../../hierarchy/hierarchy-orchestrator.service';

interface ChatSession {
  ws: WebSocket;
  agentId: string;
  sessionId: string;
}

@Injectable()
export class WebChatAdapter {
  private readonly logger = new Logger(WebChatAdapter.name);
  private wss: WebSocketServer | null = null;
  private sessions = new Map<string, ChatSession>();

  constructor(private readonly orchestrator: HierarchyOrchestratorService) {}

  attach(server: any): void {
    this.wss = new WebSocketServer({ server, path: '/channels/ws' });

    this.wss.on('connection', (ws: WebSocket, req: any) => {
      const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
      const agentId = url.searchParams.get('agentId') ?? '';
      const sessionId = `ws_${Date.now()}_${Math.random().toString(36).slice(2)}`;

      if (!agentId) {
        ws.close(1008, 'agentId required');
        return;
      }

      this.sessions.set(sessionId, { ws, agentId, sessionId });
      ws.send(JSON.stringify({ type: 'connected', sessionId }));
      this.logger.log(`WebChat session ${sessionId} connected to agent ${agentId}`);

      ws.on('message', async (raw: Buffer) => {
        try {
          const msg = JSON.parse(raw.toString());
          if (msg.type === 'message' && msg.content) {
            const result = await this.orchestrator.handle({
              channelType: 'WEBCHAT',
              channelSessionId: sessionId,
              agentId,
              content: msg.content,
            });
            ws.send(JSON.stringify({ type: 'message', content: result.response, runId: result.runId }));
          }
        } catch (err: any) {
          ws.send(JSON.stringify({ type: 'error', message: err.message }));
        }
      });

      ws.on('close', () => {
        this.sessions.delete(sessionId);
        this.logger.log(`WebChat session ${sessionId} disconnected`);
      });
    });

    this.logger.log('WebChat adapter attached to server at /channels/ws');
  }
}
