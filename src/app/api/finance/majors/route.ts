import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth/auth'
import { db } from '@/lib/db'

const ALLOWED_PERMISSIONS = ['finance.manageTuition', 'finance.viewTuition']

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userPermissions = session.user.permissions ?? []
  const canAccess = ALLOWED_PERMISSIONS.some((permission) => userPermissions.includes(permission))

  if (!canAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const searchText = searchParams.get('search') ?? ''
  const limit = Number(searchParams.get('limit') ?? 30)

  try {
    const majors = await db.major.findMany({
      where: {
        status: { in: ['APPROVED', 'active', 'ACTIVE'] },
        ...(searchText
          ? {
              OR: [
                { name_vi: { contains: searchText, mode: 'insensitive' } },
                { code: { contains: searchText, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { name_vi: 'asc' },
      take: Math.min(Math.max(limit, 5), 100),
      select: {
        id: true,
        name_vi: true,
        code: true,
        total_credits_min: true,
        Program: {
          select: {
            id: true,
            name_vi: true,
            total_credits: true,
            status: true,
          },
        },
      },
    })

    return NextResponse.json({
      data: majors.map((m) => ({
        id: m.id.toString(),
        name: m.name_vi,
        code: m.code,
        totalCreditsMin: m.total_credits_min,
        programs: m.Program.filter((p) => p.status === 'APPROVED' || p.status === 'active').map((p) => ({
          id: p.id?.toString(),
          name: p.name_vi,
          totalCredits: p.total_credits,
        })),
      })),
    })
  } catch (error) {
    console.error('Failed to load finance majors', error)
    return NextResponse.json({ error: 'Không thể tải danh sách ngành' }, { status: 500 })
  }
}

