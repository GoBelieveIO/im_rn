export interface RTMessage {
    sender:number;
    receiver:number;
    content:string;
}

export interface IMMessage {
    sender:number;
    receiver:number;
    timestamp:number;
    content:string;
    isSelf:boolean;
}


export interface Observer {
    handlePeerMessage(msg:any);
    handleMessageACK(msg);
    handleMessageFailure(msg);
    handleGroupMessage(msg);
    handleGroupMessageACK(msg);
    handleGroupMessageFailure(msg);
    handleGroupNotification(msg);
}

export default class IMService {
    accessToken:string;
    protocol:string;
    port:number;
    observer:Observer;
    connectState:number;
    sendPeerMessage(IMMessage);
    sendGroupMessage(IMMessage);
    sendRTMessage(RTMessage);
    sendCustomerMessage(msg:any);
    sendCustomerSupportMessage(msg:any);
    enterRoom(roomID:number);
    leaveRoom(roomID:number);
    handleConnectivityChange(reach:string);
    enterBackground();
    enterForeground();
    start();
    stop();
}

export const STATE_UNCONNECTED = 0;
export const STATE_CONNECTING = 1;
export const STATE_CONNECTED = 2;
export const STATE_CONNECTFAIL = 3;
export const STATE_AUTHENTICATION_FAIL = 4;