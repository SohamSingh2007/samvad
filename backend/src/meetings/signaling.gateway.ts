import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

interface JoinRoomPayload {
  roomCode: string;
  userId: string;
  name: string;
}

interface ToggleMediaPayload {
  roomCode: string;
  isMuted: boolean;
  isVideoOff: boolean;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class SignalingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private activeSockets = new Map<string, { roomCode: string; userId: string; name: string }>();

  handleConnection(client: Socket) {
    // Client connected
  }

  handleDisconnect(client: Socket) {
    const user = this.activeSockets.get(client.id);
    if (user) {
      this.activeSockets.delete(client.id);
      client.to(user.roomCode).emit('user-left', {
        socketId: client.id,
        userId: user.userId,
        name: user.name,
      });
    }
  }

  @SubscribeMessage('join-room')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinRoomPayload,
  ) {
    const { roomCode, userId, name } = payload;
    if (!roomCode) return;

    client.join(roomCode);
    this.activeSockets.set(client.id, { roomCode, userId, name });

    const roomSockets = this.server.sockets.adapter.rooms.get(roomCode);
    const existingPeers: Array<{ socketId: string; userId: string; name: string }> = [];

    if (roomSockets) {
      roomSockets.forEach((sId) => {
        if (sId !== client.id) {
          const peerInfo = this.activeSockets.get(sId);
          if (peerInfo) {
            existingPeers.push({
              socketId: sId,
              userId: peerInfo.userId,
              name: peerInfo.name,
            });
          }
        }
      });
    }

    client.emit('existing-peers', existingPeers);

    client.to(roomCode).emit('user-joined', {
      socketId: client.id,
      userId,
      name,
    });
  }

  @SubscribeMessage('offer')
  handleOffer(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { targetSocketId: string; offer: any; name?: string; userId?: string },
  ) {
    const sender = this.activeSockets.get(client.id);
    this.server.to(payload.targetSocketId).emit('offer', {
      senderSocketId: client.id,
      senderUserId: sender?.userId || payload.userId,
      senderName: sender?.name || payload.name,
      offer: payload.offer,
    });
  }

  @SubscribeMessage('answer')
  handleAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { targetSocketId: string; answer: any },
  ) {
    this.server.to(payload.targetSocketId).emit('answer', {
      senderSocketId: client.id,
      answer: payload.answer,
    });
  }

  @SubscribeMessage('ice-candidate')
  handleIceCandidate(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { targetSocketId: string; candidate: any },
  ) {
    this.server.to(payload.targetSocketId).emit('ice-candidate', {
      senderSocketId: client.id,
      candidate: payload.candidate,
    });
  }

  @SubscribeMessage('toggle-media')
  handleToggleMedia(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: ToggleMediaPayload,
  ) {
    const sender = this.activeSockets.get(client.id);
    if (sender) {
      client.to(sender.roomCode).emit('user-media-toggled', {
        socketId: client.id,
        userId: sender.userId,
        isMuted: payload.isMuted,
        isVideoOff: payload.isVideoOff,
      });
    }
  }

  @SubscribeMessage('leave-room')
  handleLeaveRoom(@ConnectedSocket() client: Socket) {
    const user = this.activeSockets.get(client.id);
    if (user) {
      client.leave(user.roomCode);
      this.activeSockets.delete(client.id);
      client.to(user.roomCode).emit('user-left', {
        socketId: client.id,
        userId: user.userId,
        name: user.name,
      });
    }
  }
}
