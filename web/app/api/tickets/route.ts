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

// GET - Get tickets
export async function GET(req: Request) {
  try {
    // Verify authentication
    const auth = await verifyAuth(req);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId');
    const ticketId = searchParams.get('ticketId');

    if (!companyId && !ticketId) {
      return errorResponse('companyId ou ticketId é obrigatório', 400);
    }

    const sb = createServiceClient();

    // Get specific ticket
    if (ticketId) {
      const { data, error } = await sb
        .from('tickets')
        .select(`
          *,
          user_profiles!tickets_creator_profile_id_fkey (
            id,
            display_name,
            avatar_url,
            email
          ),
          departments (
            id,
            name,
            slug
          )
        `)
        .eq('id', ticketId)
        .single();

      if (error) {
        return errorResponse(`Erro ao buscar ticket: ${error.message}`, 500);
      }

      return successResponse(data);
    }

    // Get tickets for company
    // If super admin, get all tickets
    let query = sb
      .from('tickets')
      .select(`
        *,
        user_profiles!tickets_creator_profile_id_fkey (
          id,
          display_name,
          avatar_url
        ),
        departments (
          id,
          name,
          slug
        )
      `)
      .order('created_at', { ascending: false });

    if (!auth.user?.is_super_admin) {
      // Regular users only see tickets from their company memberships
      const { data: memberships } = await sb
        .from('company_members')
        .select('company_id')
        .eq('user_profile_id', auth.user?.id);

      const companyIds = memberships?.map(m => m.company_id) || [];
      
      if (companyIds.length === 0) {
        return successResponse([]);
      }
      
      query = query.in('company_id', companyIds);
    } else {
      // Super admin can filter by companyId
      if (companyId) {
        query = query.eq('company_id', companyId);
      }
    }

    const { data, error } = await query;

    if (error) {
      return errorResponse(`Erro ao buscar tickets: ${error.message}`, 500);
    }

    return successResponse(data || []);
  } catch (err: any) {
    console.error('[tickets GET] Error:', err);
    return errorResponse(err.message || 'Erro interno do servidor', 500);
  }
}

// POST - Create ticket
export async function POST(req: Request) {
  try {
    // Verify authentication
    const auth = await verifyAuth(req);
    if (auth.error) return auth.error;

    const body = await req.json();
    
    // Validate required fields
    if (!body.title || !body.company_id) {
      return errorResponse('title e company_id são obrigatórios', 400);
    }

    const sb = createServiceClient();

    // Check if user is a member of the company
    const { data: membership } = await sb
      .from('company_members')
      .select('id')
      .eq('company_id', body.company_id)
      .eq('user_profile_id', body.creator_profile_id || auth.user?.id)
      .single();

    if (!membership && !auth.user?.is_super_admin) {
      return errorResponse('Você não é membro desta empresa', 403);
    }

    // Generate ticket number
    const { count } = await sb
      .from('tickets')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', body.company_id);

    const ticketNumber = `TKT-${String((count || 0) + 1).padStart(5, '0')}`;

    const { data, error } = await sb
      .from('tickets')
      .insert({
        title: body.title,
        description: body.description || null,
        priority: body.priority || 'MEDIUM',
        status: body.status || 'OPEN',
        company_id: body.company_id,
        department_id: body.department_id || null,
        creator_profile_id: body.creator_profile_id || auth.user?.id,
        number: ticketNumber
      })
      .select()
      .single();

    if (error) {
      return errorResponse(`Erro ao criar ticket: ${error.message}`, 500);
    }

    return successResponse(data, 201);
  } catch (err: any) {
    console.error('[tickets POST] Error:', err);
    return errorResponse(err.message || 'Erro interno do servidor', 500);
  }
}

// PUT - Update ticket
export async function PUT(req: Request) {
  try {
    // Verify authentication
    const auth = await verifyAuth(req);
    if (auth.error) return auth.error;

    const body = await req.json();

    if (!body.id) {
      return errorResponse('ID do ticket é obrigatório', 400);
    }

    const sb = createServiceClient();

    // Check if ticket exists
    const { data: ticket } = await sb
      .from('tickets')
      .select('id, company_id, creator_profile_id')
      .eq('id', body.id)
      .single();

    if (!ticket) {
      return errorResponse('Ticket não encontrado', 404);
    }

    // Check if user can update (creator, company admin/manager, or super admin)
    const isCreator = ticket.creator_profile_id === auth.user?.id;
    
    const { data: membership } = await sb
      .from('company_members')
      .select('id, role')
      .eq('company_id', ticket.company_id)
      .eq('user_profile_id', auth.user?.id)
      .in('role', ['ADMIN', 'MANAGER'])
      .single();

    const isCompanyAdmin = !!membership;

    if (!isCreator && !isCompanyAdmin && !auth.user?.is_super_admin) {
      return errorResponse('Você não tem permissão para atualizar este ticket', 403);
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    // Only allow certain fields to be updated
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.status !== undefined) {
      updateData.status = body.status;
      if (body.status === 'RESOLVED') {
        updateData.resolved_at = new Date().toISOString();
      }
    }
    if (body.department_id !== undefined) updateData.department_id = body.department_id;
    if (body.assignee_profile_id !== undefined) updateData.assignee_profile_id = body.assignee_profile_id;

    const { data, error } = await sb
      .from('tickets')
      .update(updateData)
      .eq('id', body.id)
      .select()
      .single();

    if (error) {
      return errorResponse(`Erro ao atualizar ticket: ${error.message}`, 500);
    }

    return successResponse(data);
  } catch (err: any) {
    console.error('[tickets PUT] Error:', err);
    return errorResponse(err.message || 'Erro interno do servidor', 500);
  }
}

// DELETE - Delete ticket
export async function DELETE(req: Request) {
  try {
    // Verify authentication
    const auth = await verifyAuth(req);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const ticketId = searchParams.get('id');

    if (!ticketId) {
      return errorResponse('ID do ticket é obrigatório', 400);
    }

    const sb = createServiceClient();

    // Check if ticket exists
    const { data: ticket } = await sb
      .from('tickets')
      .select('id, company_id, creator_profile_id')
      .eq('id', ticketId)
      .single();

    if (!ticket) {
      return errorResponse('Ticket não encontrado', 404);
    }

    // Check if user can delete (company admin or super admin)
    const { data: membership } = await sb
      .from('company_members')
      .select('id')
      .eq('company_id', ticket.company_id)
      .eq('user_profile_id', auth.user?.id)
      .eq('role', 'ADMIN')
      .single();

    const isCompanyAdmin = !!membership;

    if (!isCompanyAdmin && !auth.user?.is_super_admin) {
      return errorResponse('Você não tem permissão para excluir este ticket', 403);
    }

    const { error } = await sb
      .from('tickets')
      .delete()
      .eq('id', ticketId);

    if (error) {
      return errorResponse(`Erro ao excluir ticket: ${error.message}`, 500);
    }

    return successResponse({ message: 'Ticket excluído com sucesso' });
  } catch (err: any) {
    console.error('[tickets DELETE] Error:', err);
    return errorResponse(err.message || 'Erro interno do servidor', 500);
  }
}
