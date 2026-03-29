import { NextResponse } from 'next/server';
import { 
  createServiceClient, 
  verifySuperAdmin, 
  validateRequiredFields,
  successResponse,
  errorResponse,
  handleCorsOptions
} from '@/lib/apiUtils';

// Handle CORS preflight
export async function OPTIONS() {
  return handleCorsOptions();
}

// GET - List all company members
export async function GET(req: Request) {
  try {
    // Verify super admin authentication
    const auth = await verifySuperAdmin(req);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId');

    const sb = createServiceClient();

    let query = sb
      .from('company_members')
      .select(`
        *,
        user_profiles (
          id,
          display_name,
          email,
          avatar_url,
          auth_user_id
        ),
        companies (
          id,
          name,
          slug
        )
      `)
      .order('created_at', { ascending: false });

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    const { data, error } = await query;

    if (error) {
      return errorResponse(`Erro ao buscar membros: ${error.message}`, 500);
    }

    return successResponse(data || []);
  } catch (err: any) {
    console.error('[admin/members GET] Error:', err);
    return errorResponse(err.message || 'Erro interno do servidor', 500);
  }
}

// POST - Add member to company
export async function POST(req: Request) {
  try {
    // Verify super admin authentication
    const auth = await verifySuperAdmin(req);
    if (auth.error) return auth.error;

    const body = await req.json();

    // Validate required fields
    const validation = validateRequiredFields(body, ['company_id', 'user_profile_id']);
    if (!validation.valid) {
      return errorResponse(`Campo obrigatório ausente: ${validation.missing}`, 400);
    }

    // Validate role if provided
    const validRoles = ['MEMBER', 'MANAGER', 'ADMIN'];
    const role = body.role || 'MEMBER';
    if (!validRoles.includes(role)) {
      return errorResponse('Role inválida. Valores permitidos: MEMBER, MANAGER, ADMIN', 400);
    }

    const sb = createServiceClient();

    // Check if user_profile exists
    const { data: profile } = await sb
      .from('user_profiles')
      .select('id')
      .eq('id', body.user_profile_id)
      .single();

    if (!profile) {
      return errorResponse('Perfil de usuário não encontrado', 404);
    }

    // Check if company exists
    const { data: company } = await sb
      .from('companies')
      .select('id')
      .eq('id', body.company_id)
      .single();

    if (!company) {
      return errorResponse('Empresa não encontrada', 404);
    }

    // Check if already a member
    const { data: existing } = await sb
      .from('company_members')
      .select('id')
      .eq('company_id', body.company_id)
      .eq('user_profile_id', body.user_profile_id)
      .single();

    if (existing) {
      return errorResponse('Usuário já é membro desta empresa', 400);
    }

    // Create membership
    const { data, error } = await sb
      .from('company_members')
      .insert({
        company_id: body.company_id,
        user_profile_id: body.user_profile_id,
        role: role
      })
      .select()
      .single();

    if (error) {
      return errorResponse(`Erro ao adicionar membro: ${error.message}`, 500);
    }

    return successResponse(data, 201);
  } catch (err: any) {
    console.error('[admin/members POST] Error:', err);
    return errorResponse(err.message || 'Erro interno do servidor', 500);
  }
}

// PUT - Update member role
export async function PUT(req: Request) {
  try {
    // Verify super admin authentication
    const auth = await verifySuperAdmin(req);
    if (auth.error) return auth.error;

    const body = await req.json();

    // Validate required fields
    const validation = validateRequiredFields(body, ['id', 'role']);
    if (!validation.valid) {
      return errorResponse(`Campo obrigatório ausente: ${validation.missing}`, 400);
    }

    // Validate role
    const validRoles = ['MEMBER', 'MANAGER', 'ADMIN'];
    if (!validRoles.includes(body.role)) {
      return errorResponse('Role inválida. Valores permitidos: MEMBER, MANAGER, ADMIN', 400);
    }

    const sb = createServiceClient();

    // Check if membership exists
    const { data: membership } = await sb
      .from('company_members')
      .select('id')
      .eq('id', body.id)
      .single();

    if (!membership) {
      return errorResponse('Membro não encontrado', 404);
    }

    // Update role
    const { data, error } = await sb
      .from('company_members')
      .update({ role: body.role })
      .eq('id', body.id)
      .select()
      .single();

    if (error) {
      return errorResponse(`Erro ao atualizar membro: ${error.message}`, 500);
    }

    return successResponse(data);
  } catch (err: any) {
    console.error('[admin/members PUT] Error:', err);
    return errorResponse(err.message || 'Erro interno do servidor', 500);
  }
}

// DELETE - Remove member from company
export async function DELETE(req: Request) {
  try {
    // Verify super admin authentication
    const auth = await verifySuperAdmin(req);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get('id');

    if (!memberId) {
      return errorResponse('ID do membro é obrigatório', 400);
    }

    const sb = createServiceClient();

    // Check if membership exists
    const { data: membership } = await sb
      .from('company_members')
      .select('id')
      .eq('id', memberId)
      .single();

    if (!membership) {
      return errorResponse('Membro não encontrado', 404);
    }

    // Delete membership
    const { error } = await sb
      .from('company_members')
      .delete()
      .eq('id', memberId);

    if (error) {
      return errorResponse(`Erro ao remover membro: ${error.message}`, 500);
    }

    return successResponse({ message: 'Membro removido com sucesso' });
  } catch (err: any) {
    console.error('[admin/members DELETE] Error:', err);
    return errorResponse(err.message || 'Erro interno do servidor', 500);
  }
}
