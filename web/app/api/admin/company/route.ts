import { NextResponse } from 'next/server';
import { 
  createServiceClient, 
  verifySuperAdmin, 
  validateRequiredFields,
  successResponse,
  errorResponse,
  corsHeaders,
  handleCorsOptions
} from '@/lib/apiUtils';

// Handle CORS preflight
export async function OPTIONS() {
  return handleCorsOptions();
}

// GET - List all companies
export async function GET(req: Request) {
  try {
    // Verify super admin authentication
    const auth = await verifySuperAdmin(req);
    if (auth.error) return auth.error;

    const sb = createServiceClient();
    
    const { data, error } = await sb
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return errorResponse(`Erro ao buscar empresas: ${error.message}`, 500);
    }

    return successResponse(data || []);
  } catch (err: any) {
    console.error('[admin/company GET] Error:', err);
    return errorResponse(err.message || 'Erro interno do servidor', 500);
  }
}

// POST - Create new company
export async function POST(req: Request) {
  try {
    // Verify super admin authentication
    const auth = await verifySuperAdmin(req);
    if (auth.error) return auth.error;

    const body = await req.json();

    // Validate required fields
    const validation = validateRequiredFields(body, ['name', 'slug']);
    if (!validation.valid) {
      return errorResponse(`Campo obrigatório ausente: ${validation.missing}`, 400);
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
    console.error('[admin/company POST] Error:', err);
    return errorResponse(err.message || 'Erro interno do servidor', 500);
  }
}

// DELETE - Delete company
export async function DELETE(req: Request) {
  try {
    // Verify super admin authentication
    const auth = await verifySuperAdmin(req);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('id');

    if (!companyId) {
      return errorResponse('ID da empresa é obrigatório', 400);
    }

    const sb = createServiceClient();

    // Check if company exists
    const { data: company } = await sb
      .from('companies')
      .select('id, name')
      .eq('id', companyId)
      .single();

    if (!company) {
      return errorResponse('Empresa não encontrada', 404);
    }

    // Delete company (cascade should handle related records)
    const { error } = await sb
      .from('companies')
      .delete()
      .eq('id', companyId);

    if (error) {
      return errorResponse(`Erro ao excluir empresa: ${error.message}`, 500);
    }

    return successResponse({ message: 'Empresa excluída com sucesso' });
  } catch (err: any) {
    console.error('[admin/company DELETE] Error:', err);
    return errorResponse(err.message || 'Erro interno do servidor', 500);
  }
}
