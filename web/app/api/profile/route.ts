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

// GET - Get current user profile
export async function GET(req: Request) {
  try {
    // Verify authentication
    const auth = await verifyAuth(req);
    if (auth.error) return auth.error;

    const sb = createServiceClient();

    const { data, error } = await sb
      .from('user_profiles')
      .select(`
        *,
        company_members (
          id,
          company_id,
          role,
          companies (
            id,
            name,
            slug
          )
        )
      `)
      .eq('auth_user_id', auth.user?.id)
      .single();

    if (error) {
      return errorResponse(`Erro ao buscar perfil: ${error.message}`, 500);
    }

    return successResponse(data);
  } catch (err: any) {
    console.error('[profile GET] Error:', err);
    return errorResponse(err.message || 'Erro interno do servidor', 500);
  }
}

// PATCH - Update current user profile
export async function PATCH(req: Request) {
  try {
    // Verify authentication
    const auth = await verifyAuth(req);
    if (auth.error) return auth.error;

    const body = await req.json();
    const sb = createServiceClient();

    // Only allow updating these fields
    const allowedFields = ['display_name', 'avatar_url', 'phone', 'position', 'department'];
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // If no valid fields to update
    if (Object.keys(updateData).length === 1) {
      return errorResponse('Nenhum campo válido para atualizar', 400);
    }

    const { data, error } = await sb
      .from('user_profiles')
      .update(updateData)
      .eq('auth_user_id', auth.user?.id)
      .select()
      .single();

    if (error) {
      return errorResponse(`Erro ao atualizar perfil: ${error.message}`, 500);
    }

    return successResponse(data);
  } catch (err: any) {
    console.error('[profile PATCH] Error:', err);
    return errorResponse(err.message || 'Erro interno do servidor', 500);
  }
}
