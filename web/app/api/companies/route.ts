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

// GET - List companies
export async function GET(req: Request) {
  try {
    // Verify authentication
    const auth = await verifyAuth(req);
    if (auth.error) return auth.error;

    const sb = createServiceClient();

    // If super admin, return all companies
    if (auth.user?.is_super_admin) {
      const { data, error } = await sb
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return errorResponse(`Erro ao buscar empresas: ${error.message}`, 500);
      }

      return successResponse(data || []);
    }

    // Otherwise, return only companies where user is a member
    const { data: memberships, error: membershipError } = await sb
      .from('company_members')
      .select('company_id')
      .eq('user_profile_id', auth.user?.id);

    if (membershipError) {
      return errorResponse(`Erro ao buscar memberships: ${membershipError.message}`, 500);
    }

    const companyIds = memberships?.map(m => m.company_id) || [];

    if (companyIds.length === 0) {
      return successResponse([]);
    }

    const { data, error } = await sb
      .from('companies')
      .select('*')
      .in('id', companyIds)
      .order('created_at', { ascending: false });

    if (error) {
      return errorResponse(`Erro ao buscar empresas: ${error.message}`, 500);
    }

    return successResponse(data || []);
  } catch (err: any) {
    console.error('[companies GET] Error:', err);
    return errorResponse(err.message || 'Erro interno do servidor', 500);
  }
}

// POST - Create new company (only for super admins)
export async function POST(req: Request) {
  try {
    // Verify super admin authentication
    const auth = await verifyAuth(req);
    if (auth.error) return auth.error;

    if (!auth.user?.is_super_admin) {
      return errorResponse('Apenas super administradores podem criar empresas', 403);
    }

    const body = await req.json();

    // Validate required fields
    if (!body.name || !body.slug) {
      return errorResponse('name e slug são obrigatórios', 400);
    }

    // Sanitize inputs
    const name = String(body.name).trim();
    const slug = String(body.slug).trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');

    if (name.length < 2) {
      return errorResponse('Nome deve ter pelo menos 2 caracteres', 400);
    }
    if (slug.length < 2) {
      return errorResponse('Slug deve ter pelo menos 2 caracteres', 400);
    }

    const sb = createServiceClient();

    // Check if slug already exists
    const { data: existing } = await sb
      .from('companies')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existing) {
      return errorResponse('Slug já está em uso', 400);
    }

    // Create company
    const { data, error } = await sb
      .from('companies')
      .insert({ 
        name, 
        slug,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      return errorResponse(`Erro ao criar empresa: ${error.message}`, 500);
    }

    return successResponse(data, 201);
  } catch (err: any) {
    console.error('[companies POST] Error:', err);
    return errorResponse(err.message || 'Erro interno do servidor', 500);
  }
}
