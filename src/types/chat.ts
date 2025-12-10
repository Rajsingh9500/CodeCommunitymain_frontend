// ---------------- User Role ----------------
export type UserRole = "client" | "developer" | "admin";

// ---------------- User Type ----------------
export interface UserType {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  role?: UserRole; // ✅ use the role type, not string
  unreadCount?: number;
  lastMessage?: string;
  lastMessageTime?: string;
}

// ---------------- Message User ----------------
// ✅ Used inside MessageType for sender/receiver
export interface MessageUser {
  _id: string;
  name: string;
  role: UserRole;
}

// ---------------- Message Type ----------------
export interface MessageType {
  _id: string;
  sender: MessageUser;
  receiver: MessageUser;
  message: string;
  timestamp: string;
  delivered?: boolean;
  read?: boolean;
}

// ---------------- Unread Message Info ----------------
export interface UnreadMessageType {
  fromUserId: string;   // sender's ID
  toUserId: string;     // receiver's ID
  count: number;        // number of unread messages
  lastMessage?: string;
  lastMessageTime?: string;
}
