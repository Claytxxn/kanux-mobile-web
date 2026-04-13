import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useEffect, useState, useRef } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { colors, spacing } from '../../src/theme';
import { useOfflineMessages } from '../../src/contexts/SyncContext';
import { getChatTyping, setChatTyping } from '../../src/lib/supabase';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [remoteTyping, setRemoteTyping] = useState<string[]>([]);
  const typingTimer = useRef<any>(null);

  const { messages, loading, sendMessage, refresh } = useOfflineMessages(id as string);

  // Poll typing status
  useEffect(() => {
    if (!id) return;
    let mounted = true;
    const fetchTyping = async () => {
      try {
        const t = await getChatTyping(id as string);
        if (!mounted) return;
        // t is expected to be array of { user_profile_id, display_name }
        const names = (t || [])
          .filter((u: any) => u.user_profile_id !== user?.id)
          .map((u: any) => u.display_name || 'Alguém');
        setRemoteTyping(names);
      } catch (e) {
        console.error('Error fetching typing status:', e);
      }
    };

    fetchTyping();
    const interval = setInterval(fetchTyping, 1500);
    return () => { mounted = false; clearInterval(interval); };
  }, [id, user?.id]);

  async function handleSend() {
    if (!newMessage.trim() || !id || sending) return;

    setSending(true);
    try {
      // ensure typing stopped
      try { await setChatTyping(id as string, false); } catch {}

      const sentMessage = await sendMessage(newMessage.trim());
      if (sentMessage) {
        setNewMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView style={styles.messageList} contentContainerStyle={styles.messageContent}>
        {messages.length === 0 && !loading && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Nenhuma mensagem ainda</Text>
            <Text style={styles.emptySubtext}>Envie uma mensagem para começar a conversa</Text>
          </View>
        )}
        {messages.map((item) => {
          const isMyMessage = item.user_profile_id === user?.id;
          return (
            <View 
              key={item.id}
              style={[styles.messageBubble, isMyMessage ? styles.myMessage : styles.otherMessage]}
            >
              <Text style={styles.messageText}>{item.content}</Text>
              <Text style={styles.messageTime}>
                {new Date(item.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </Text>
              {item.pending && (
                <Text style={styles.pendingText}>Enviando...</Text>
              )}
            </View>
          );
        })}
        {remoteTyping.length > 0 && (
          <View style={styles.typingIndicator}>
            <Text style={styles.typingText}>{`${remoteTyping.join(', ')} está digitando...`}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Digite sua mensagem..."
          placeholderTextColor={colors.textMuted}
          value={newMessage}
          onChangeText={(text) => {
            setNewMessage(text);
            // notify typing start and debounce stop
            if (!id) return;
            try { setChatTyping(id as string, true); } catch (e) { }
            if (typingTimer.current) clearTimeout(typingTimer.current);
            typingTimer.current = setTimeout(() => { try { setChatTyping(id as string, false); } catch (e) {} }, 1500);
          }}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!newMessage.trim() || sending) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!newMessage.trim() || sending}
        >
          <Text style={styles.sendButtonText}>Enviar</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  messageList: {
    flex: 1,
  },
  messageContent: {
    padding: spacing.md,
    flexGrow: 1,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: spacing.sm,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
  },
  messageText: {
    color: colors.text,
    fontSize: 16,
  },
  messageTime: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginLeft: spacing.sm,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: colors.text,
    fontWeight: '600',
  },
  pendingText: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  typingIndicator: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  typingText: {
    color: colors.textMuted,
    fontSize: 13,
    fontStyle: 'italic',
  },
});

