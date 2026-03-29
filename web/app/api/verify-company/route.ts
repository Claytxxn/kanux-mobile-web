import { NextResponse } from 'next/server';
import serverSupabase from '@/lib/serverSupabase';

// CORS headers para permitir chamadas do mobile
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handler para OPTIONS (preflight CORS)
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { company_number } = body;

    if (!company_number) {
      return NextResponse.json(
        { error: 'Número da empresa é obrigatório' },
        { status: 400, headers: corsHeaders }
      );
    }

    const sb = serverSupabase();

    // Buscar empresa pelo número
    const { data: company, error } = await sb
      .from('companies')
      .select('id, name, slug, company_number')
      .eq('company_number', parseInt(company_number))
      .single();

    if (error || !company) {
      return NextResponse.json(
        { error: 'Empresa não encontrada' },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json({
      success: true,
      company: {
        id: company.id,
        name: company.name,
        slug: company.slug,
        company_number: company.company_number,
      },
    }, { headers: corsHeaders });

  } catch (err: any) {
    console.error('Erro ao verificar empresa:', err);
    return NextResponse.json(
      { error: err.message || 'Erro interno do servidor' },
      { status: 500, headers: corsHeaders }
    );
  }
}
