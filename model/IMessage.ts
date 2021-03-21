
export const MESSAGE_FLAG_ACK = 2;
export const MESSAGE_FLAG_FAILURE = 8;
export const MESSAGE_FLAG_UPLOADING = 16;
export const MESSAGE_FLAG_SENDING = 32;
export const MESSAGE_FLAG_LISTENED = 64;


export const CONVERSATION_PEER = "peer";
export const CONVERSATION_GROUP = "group";

export const PAGE_SIZE = 30;

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

export interface IM {
    sendPeerMessage(IMMessage);
    sendGroupMessage(IMMessage);
    sendRTMessage(RTMessage);
    connectState:any;
    observer:any;
}


export interface MessageContent {
    uuid?:string;

    text?:string;
    image?:any;
    image2?:any;
    file?:any;
    audio?:any;
    location?:any;
    video?:any;
    classroom?:any;
    conference?:any;

    revoke?:any;
    readed?:any;
    tag?:any;


    at?:any;
    at_name?:any;
    reference?:any;
    group_id?:number;
    session_id?:number;
    store_id?:number;

    timestamp?:any;
    notification?:string;
    textHtml?:any;
}

export interface Message  {
    id:number;
    msgLocalID:number;
    uuid?:string;

    sender:number;
    receiver:number;
    timestamp:number;
    content:string;
    contentObj:MessageContent;

    isOutgoing?:boolean;

    flags?:number;
    canceled?:boolean;
    ack?:boolean;
    error?:boolean;
    readed?:boolean;

    uploading?:boolean;
    progress?:number;

    playing?:number;

    readerCount?:number;
    receiverCount?:number;

    referenceCount?:number;
    reference?:string;

    tags?:string[];

    cloudMsgID?:number;//服务器消息id, 从接口获取的消息有此字段

    name?:string;
    avatar?:string;

    request?:any;
}

//客服消息和点对点消息共用一个数据库，区别在于此时的peer字段值不再是用户id，而是-storeid
//storeid取负是为了避免和用户id重复
export interface PeerMessage extends Message {
    peer:number;
}

export interface GroupMessage extends Message {
    groupID:number;
}


export interface Conversation {
    cid:string;

    type:string;
    name:string;
    avatar:string;
    unread:number;
    timestamp:number;

    content?:string;

    firstMsgId?:number;//从服务器获取较早之前的历史消息

    message?:Message;
    mentioned?:boolean;//有人@我

    peer?:number;//用户id或者(-storeID)
    groupID?:number;

    //客服会话在发起前要创建sessionID,同时获得一个客服人员id（保存在target字段）
    sessionID?:number;
    storeID?:number;
    target?:number;
    session?:boolean;//客服会话模式,根据storeID动态获取target

    top?:boolean; //置顶
    doNotDisturb?:boolean; //免打扰
    
    reference?:string;//话题的源消息
    targetMessageId?:number;//回复对象的消息id,  targetMessage.uuid == reference or targetMessage.reference == reference
}
