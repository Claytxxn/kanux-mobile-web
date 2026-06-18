import { openDatabaseSync } from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';

const db = openDatabaseSync('kanux.db');

export function initDatabase() {
  db.execSync(`CREATE TABLE IF NOT EXISTS chats (id TEXT PRIMARY KEY, data TEXT, updated_at INTEGER);`);
  db.execSync(`CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY, chat_id TEXT, data TEXT, updated_at INTEGER);`);
}

export function saveChat(chat: any) {
  db.runSync('INSERT OR REPLACE INTO chats (id, data, updated_at) VALUES (?, ?, ?)', [chat.id, JSON.stringify(chat), Date.now()]);
}

export function saveMessage(message: any) {
  db.runSync('INSERT OR REPLACE INTO messages (id, chat_id, data, updated_at) VALUES (?, ?, ?, ?)', [message.id, message.chat_id, JSON.stringify(message), Date.now()]);
}

export function getCachedChats(): any[] {
  const rows = db.getAllSync('SELECT data FROM chats');
  return rows.map((row: any) => JSON.parse(row.data));
}

export function getCachedMessages(chatId: string): any[] {
  const rows = db.getAllSync('SELECT data FROM messages WHERE chat_id = ?', [chatId]);
  return rows.map((row: any) => JSON.parse(row.data));
}

export async function addPendingOperation(op: any) {
  const pending = JSON.parse(await AsyncStorage.getItem('pendingOps') || '[]');
  pending.push(op);
  await AsyncStorage.setItem('pendingOps', JSON.stringify(pending));
}

export async function getPendingOperations() {
  return JSON.parse(await AsyncStorage.getItem('pendingOps') || '[]');
}

export async function clearPendingOperations() {
  await AsyncStorage.removeItem('pendingOps');
}
