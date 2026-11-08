import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}

  async discoverPublicGroups(limit: number, cursor?: string) {
    const { take, skip, cursor: cursorConfig } = this.prisma.getCursorPagination(cursor, limit);
    
    const groups = await this.prisma.group.findMany({
      where: {
        type: 'PUBLIC',
        status: 'ACTIVE',
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      take: take + 1, // +1 for hasNext check
      skip,
      cursor: cursorConfig,
      select: {
        id: true,
        name: true,
        description: true,
        memberCount: true,
        avatarUrl: true,
      },
    });

    const hasNext = groups.length > take;
    const items = hasNext ? groups.slice(0, -1) : groups;
    const nextCursor = hasNext ? items[items.length - 1].id : undefined;

    return {
      items,
      cursor: {
        hasNext,
        hasPrev: !!cursor,
        nextCursor: nextCursor,
      },
    };
  }

  async getUserGroups(userId: string) {
    return this.prisma.group.findMany({
      where: {
        members: {
          some: {
            userId,
            status: 'ACTIVE',
          },
        },
      },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        lastMessageAt: true,
      },
      orderBy: {
        lastMessageAt: 'desc',
      },
    });
  }

  async findById(id: string, userId?: string) {
    // TODO: Get group by ID (check permissions for VIP)
    return null;
  }

  async findByInviteCode(code: string) {
    // TODO: Find VIP group by invite code
    return null;
  }

  async create(createGroupDto: any, createdById: string) {
    // TODO: Create new group (Admin only, or from VIP approval)
    return null;
  }

  async update(id: string, updateGroupDto: any, userId: string) {
    // TODO: Update group (check Owner/Admin permissions)
    return null;
  }

  async joinPublic(groupId: string, userId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId, type: 'PUBLIC', status: 'ACTIVE' },
      include: { _count: { select: { members: true } } },
    });

    if (!group) throw new BadRequestException('Grup tidak ditemukan');
    if (group._count.members >= group.maxMembers) throw new BadRequestException('Grup penuh');

    const existingMember = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });

    if (existingMember) throw new BadRequestException('Anda sudah menjadi anggota grup ini');

    return this.prisma.groupMember.create({
      data: {
        groupId,
        userId,
      },
    });
  }

  async joinByInviteCode(code: string, userId: string) {
    // TODO: Join VIP group by invite code
    return null;
  }

  async leave(groupId: string, userId: string) {
    // TODO: Leave group (check if owner can leave)
    return null;
  }

  async regenerateInviteCode(groupId: string, userId: string) {
    // TODO: Regenerate invite code (Owner/Admin only)
    return null;
  }

  async archive(id: string, userId: string) {
    // TODO: Archive group (Admin only)
    return null;
  }

  async delete(id: string, userId: string) {
    // TODO: Soft delete group (Admin only)
    return null;
  }
}