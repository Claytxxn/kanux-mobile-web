import { NextResponse } from 'next/server';
import { 
  createServiceClient, 
  verifyAuth, 
  successResponse, 
  errorResponse,
  handleCorsOptions
} from '@/lib/apiUtils';

// Handle CORS preflight
export async function OPTIONS() {
  return handleCorsOptions();
}

// GET - Get chats or messages
export async function GET(req: Request) {
  try {
    // Verify authentication (not necessarily super admin - any authenticated user)
    const auth = await verifyAuth(req);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get('chatId');
    const companyId = searchParams.get('companyId');

    const sb = createServiceClient();

    // Get messages for a specific chat
    if (chatId) {
      const { data, error } = await sb
        .from('messages')
        .select(`
          *,
          user_profiles (
            id,
            display_name,
            avatar_url
          )
        `)
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })
        .limit(500);

      if (error) {
        return errorResponse(`Erro ao buscar mensagens: ${error.message}`, 500);
      }

      return successResponse(data || []);
    }

    // Get chats for a company
    if (companyId) {
      const { data, error } = await sb
        .from('chats')
        .select(`
          *,
          departments (
            id,
            name,
            slug
          )
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) {
        return errorResponse(`Erro ao buscar chats: ${error.message}`, 500);
      }

      return successResponse(data || []);
    }

    return errorResponse('chatId ou companyId é obrigatório', 400);
  } catch (err: any) {
    console.error('[chats GET] Error:', err);
    return errorResponse(err.message || 'Erro interno do servidor', 500);
  }
}

// POST - Create chat or message
export async function POST(req: Request) {
  try {
    // Verify authentication
    const auth = await verifyAuth(req);
    if (auth.error) return auth.error;

    const body = await req.json();
    const sb = createServiceClient();

    // Create message
    if (body.type === 'message') {
      const validation = { valid: true };
      if (!body.chatId || !body.content) {
        return errorResponse('chatId e content são obrigatórios', 400);
      }

      // Verify user is a member of the chat
      const { data: chatMember } = await sb
        .from('chat_members')
        .select('id')
        .eq('chat_id', body.chatId)
        .eq('user_profile_id', body.user_profile_id)
        .single();

      // Also check if user is admin of the company that owns the chat
      const { data: chat } = await sb
        .from('chats')
        .select('company_id, is_private')
        .eq('id', body.chatId)
        .single();

      const isCompanyAdmin = await sb
        .from('company_members')
        .select('id')
        .eq('company_id', chat?.company_id)
        .eq('user_profile_id', body.user_profile_id)
        .in('role', ['ADMIN', 'MANAGER'])
        .single();

      if (!chatMember && !isCompanyAdmin && chat?.is_private) {
        return errorResponse('Você não tem permissão para enviar mensagens neste chat', 403);
      }

      const { data, error } = await sb
        .from('messages')
        .insert({
          chat_id: body.chatId,
          content: body.content,
          user_profile_id: body.user_profile_id
        })
        .select()
        .single();

      if (error) {
        return errorResponse(`Erro ao criar mensagem: ${error.message}`, 500);
      }

      return successResponse(data, 201);
    }

    // Create new chat
    if (body.type === 'chat') {
      if (!body.name || !body.companyId) {
        return errorResponse('name e companyId são obrigatórios', 400);
      }

      // Super admin can create chats in any company
      if (auth.user?.is_super_admin) {
        // Allow creation - super admin has full access
      } else {
        // Check if user is admin/manager of the company
        // First get the user_profile_id from the auth user
        const { data: profile } = await sb
          .from('user_profiles')
          .select('id')
          .eq('auth_user_id', auth.user?.id)
          .single();

        if (!profile) {
          return errorResponse('Perfil de usuário não encontrado', 404);
        }

        const { data: member } = await sb
          .from('company_members')
          .select('id')
          .eq('company_id', body.companyId)
          .eq('user_profile_id', profile.id)
          .in('role', ['ADMIN', 'MANAGER', 'super_admin']) // Allow super_admin for backward compatibility, but ideally should check auth.user?.is_super_admin
          .single();

        if (!member) {
          return errorResponse('Você não tem permissão para criar chats nesta empresa', 403);
        }
      }

      const { data, error } = await sb
        .from('chats')
        .insert({
          company_id: body.companyId,
          department_id: body.departmentId || null,
          name: body.name,
          is_private: !!body.is_private,
          created_by: body.user_profile_id
        })
        .select()
        .single();

      if (error) {
        return errorResponse(`Erro ao criar chat: ${error.message}`, 500);
      }

      return successResponse(data, 201);
    }

    return errorResponse('Tipo inválido. Use: message ou chat', 400);
  } catch (err: any) {
    console.error('[chats POST] Error:', err);
    return errorResponse(err.message || 'Erro interno do servidor', 500);
  }
}

// DELETE - Delete chat
export async function DELETE(req: Request) {
  try {
    // Verify authentication
    const auth = await verifyAuth(req);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get('id');

    if (!chatId) {
      return errorResponse('ID do chat é obrigatório', 400);
    }

    const sb = createServiceClient();

    // Check if chat exists
    const { data: chat } = await sb
      .from('chats')
      .select('id, company_id')
      .eq('id', chatId)
      .single();

    if (!chat) {
      return errorResponse('Chat não encontrado', 404);
    }

    // Super admin can delete any chat
    if (auth.user?.is_super_admin) {
      // Allow deletion - super admin has full access
    } else {
      // Check if user is admin/manager of the company
      // First get the user_profile_id from the auth user
      const { data: profile } = await sb
        .from('user_profiles')
        .select('id')
        .eq('auth_user_id', auth.user?.id)
        .single();

      if (!profile) {
        return errorResponse('Perfil de usuário não encontrado', 404);
      }

      const { data: member } = await sb
        .from('company_members')
        .select('id')
        .eq('company_id', chat.company_id)
        .eq('user_profile_id', profile.id)
        .in('role', ['ADMIN', 'MANAGER'])
        .single();

      if (!member) {
        return errorResponse('Você não tem permissão para excluir este chat', 403);
      }
    }

    // Delete chat (messages will be cascade deleted)
    const { error } = await sb
      .from('chats')
      .delete()
      .eq('id', chatId);

    if (error) {
      return errorResponse(`Erro ao excluir chat: ${error.message}`, 500);
    }

    return successResponse({ message: 'Chat excluído com sucesso' });
  } catch (err: any) {
    console.error('[chats DELETE] Error:', err);
    return errorResponse(err.message || 'Erro interno do servidor', 500);
  }
}
