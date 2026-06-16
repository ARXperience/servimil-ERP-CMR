import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
  path: '/api/v1/socket/io',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, string>(); // socketId -> userId

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.connectedUsers.set(client.id, userId);
      client.join(`user_${userId}`);
      console.log(`User ${userId} connected`);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = this.connectedUsers.get(client.id);
    if (userId) {
      this.connectedUsers.delete(client.id);
      console.log(`User ${userId} disconnected`);
    }
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(client: Socket, room: string) {
    client.join(room);
  }

  @SubscribeMessage('typing')
  handleTyping(client: Socket, data: { room: string, isTyping: boolean }) {
    client.to(data.room).emit('typing', { userId: this.connectedUsers.get(client.id), isTyping: data.isTyping });
  }

  sendNotification(userId: string, notification: any) {
    this.server.to(`user_${userId}`).emit('notification', notification);
  }

  broadcastToAdmins(event: string, data: any) {
    this.server.to('admins').emit(event, data);
  }

  emitToRoom(room: string, event: string, data: any) {
    this.server.to(room).emit(event, data);
  }
}
