// Camada de cache offline e sincronização para o app mobile Kanux
// Usa SQLite para dados principais e AsyncStorage para controle de sincronização

import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API nova do expo-sqlite (SDK 54+): openDatabaseSync no lugar de openDatabase
// (tipo inferido automaticamente a partir do retorno, evita conflitos de namespace/tipo)
const db = SQLite.openDatabaseSync('kanux.db');

// Inicializa tabelas principais
export function initDatabase() {
  db.execSync(
    `CREATE TABLE IF NOT EXISTS chats (
      id TEXT PRIMARY KEY,
      data TEXT,
      updated_at INTEGER
    );`
  );
  db.execSync(
    `CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      chat_id TEXT,
      data TEXT,
      updated_at INTEGER
    );`
  );
  // Outras tabelas conforme necessário
}

// Salva/atualiza chat localmente
export function saveChat(chat: any) {
  db.runSync(
    'INSERT OR REPLACE INTO chats (id, data, updated_at) VALUES (?, ?, ?)',
    [chat.id, JSON.stringify(chat), Date.now()]
  );
}

// Salva/atualiza mensagem localmente
export function saveMessage(message: any) {
  db.runSync(
    'INSERT OR REPLACE INTO messages (id, chat_id, data, updated_at) VALUES (?, ?, ?, ?)',
    [message.id, message.chat_id, JSON.stringify(message), Date.now()]
  );
}

// Busca chats do cache
export function getCachedChats(callback: (chats: any[]) => void) {
  const rows = db.getAllSync('SELECT data FROM chats') as { data: string }[];
  const chats: any[] = rows.map((row) => JSON.parse(row.data));
  callback(chats);
}

// Busca mensagens do cache
export function getCachedMessages(chatId: string, callback: (messages: any[]) => void) {
  const rows = db.getAllSync(
    'SELECT data FROM messages WHERE chat_id = ?',
    [chatId]
  ) as { data: string }[];
  const messages: any[] = rows.map((row) => JSON.parse(row.data));
  callback(messages);
}

// Marca operação pendente (para sincronizar depois)
export async function addPendingOperation(op: any) {
  const pending = JSON.parse((await AsyncStorage.getItem('pendingOps')) || '[]');
  pending.push(op);
  await AsyncStorage.setItem('pendingOps', JSON.stringify(pending));
}

// Recupera operações pendentes
export async function getPendingOperations() {
  return JSON.parse((await AsyncStorage.getItem('pendingOps')) || '[]');
}

// Limpa operações pendentes
export async function clearPendingOperations() {
  await AsyncStorage.removeItem('pendingOps');
}

// Exemplo de uso: ao enviar mensagem offline
// await addPendingOperation({ type: 'sendMessage', payload: { ... } });

// Ao reconectar, ler getPendingOperations() e sincronizar com backend