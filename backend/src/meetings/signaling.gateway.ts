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
  isMuted?: boolean;
  isVideoOff?: boolean;
  isHandRaised?: boolean;
}

interface ToggleMediaPayload {
  roomCode: string;
  isMuted: boolean;
  isVideoOff: boolean;
}

interface SendCaptionPayload {
  roomCode: string;
  text: string;
  isFinal: boolean;
  speakerName?: string;
  speakerImage?: string | null;
  language?: string;
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

  private activeSockets = new Map<string, { roomCode: string; userId: string; name: string; isMuted?: boolean; isVideoOff?: boolean; isHandRaised?: boolean }>();

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
    const { roomCode: rawCode, userId, name, isMuted = false, isVideoOff = false, isHandRaised = false } = payload;
    if (!rawCode) return;
    const roomCode = rawCode.trim().toUpperCase();

    client.join(roomCode);
    this.activeSockets.set(client.id, { roomCode, userId, name, isMuted, isVideoOff, isHandRaised });

    const roomSockets = this.server.sockets.adapter.rooms.get(roomCode);
    const existingPeers: Array<{ socketId: string; userId: string; name: string; isMuted: boolean; isVideoOff: boolean; isHandRaised: boolean }> = [];

    if (roomSockets) {
      roomSockets.forEach((sId) => {
        if (sId !== client.id) {
          const peerInfo = this.activeSockets.get(sId);
          if (peerInfo) {
            existingPeers.push({
              socketId: sId,
              userId: peerInfo.userId,
              name: peerInfo.name,
              isMuted: peerInfo.isMuted ?? false,
              isVideoOff: peerInfo.isVideoOff ?? false,
              isHandRaised: peerInfo.isHandRaised ?? false,
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
      isMuted,
      isVideoOff,
      isHandRaised,
    });
  }

  @SubscribeMessage('offer')
  handleOffer(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { targetSocketId: string; offer: any; name: string; userId: string },
  ) {
    this.server.to(payload.targetSocketId).emit('offer', {
      senderSocketId: client.id,
      senderUserId: payload.userId,
      senderName: payload.name,
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
      sender.isMuted = payload.isMuted;
      sender.isVideoOff = payload.isVideoOff;
      this.activeSockets.set(client.id, sender);

      client.to(sender.roomCode).emit('user-media-toggled', {
        socketId: client.id,
        userId: sender.userId,
        isMuted: payload.isMuted,
        isVideoOff: payload.isVideoOff,
      });
    }
  }

  @SubscribeMessage('toggle-hand-raise')
  handleToggleHandRaise(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomCode: string; isHandRaised: boolean },
  ) {
    const sender = this.activeSockets.get(client.id);
    if (sender) {
      sender.isHandRaised = payload.isHandRaised;
      this.activeSockets.set(client.id, sender);

      this.server.to(sender.roomCode).emit('user-hand-toggled', {
        socketId: client.id,
        userId: sender.userId,
        name: sender.name,
        isHandRaised: payload.isHandRaised,
      });
    }
  }

  @SubscribeMessage('send-caption')
  handleSendCaption(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SendCaptionPayload,
  ) {
    const sender = this.activeSockets.get(client.id);
    if (sender) {
      this.server.to(sender.roomCode).emit('new-caption', {
        socketId: client.id,
        userId: sender.userId,
        speakerName: payload.speakerName || sender.name || 'Participant',
        speakerImage: payload.speakerImage || null,
        text: payload.text,
        isFinal: payload.isFinal,
        timestamp: Date.now(),
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
