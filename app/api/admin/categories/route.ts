import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { listCategories, addCategory, updateCategory, deleteCategory } from '@/lib/db/categories';

export async function GET(req: NextRequest) {
  const { response } = await requireAdmin(req);
  if (response) return response;

  try {
    const categories = await listCategories();
    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json({ message: 'Error listing categories' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { response } = await requireAdmin(req);
  if (response) return response;

  try {
    const body = await req.json();
    const { nameTa, nameEn, slug, icon } = body;
    if (!nameTa || !nameEn || !slug) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const category = await addCategory({ nameTa, nameEn, slug, icon: icon || 'Leaf' });
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Error creating category' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const { response } = await requireAdmin(req);
  if (response) return response;

  try {
    const body = await req.json();
    const { id, nameTa, nameEn, slug, icon } = body;
    if (!id) {
      return NextResponse.json({ message: 'Missing category ID' }, { status: 400 });
    }

    const category = await updateCategory(id, { nameTa, nameEn, slug, icon });
    return NextResponse.json(category);
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Error updating category' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { response } = await requireAdmin(req);
  if (response) return response;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ message: 'Missing category ID' }, { status: 400 });
    }

    await deleteCategory(id);
    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Error deleting category' }, { status: 500 });
  }
}
