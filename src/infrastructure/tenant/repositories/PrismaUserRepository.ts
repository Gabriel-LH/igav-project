import { UserRepository } from "@/src/domain/tenant/repositories/UserRepository";
import { User } from "@/src/types/user/type.user";
import { PrismaClient, Prisma } from "@/prisma/generated/client";

export class PrismaUserRepository implements UserRepository {
  constructor(
    private readonly prisma: PrismaClient | Prisma.TransactionClient,
  ) {}

  async getUsers(): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      where: { deletedAt: null },
    });
    // Map Prisma User to Domain User if needed. 
    // Domain User uses firstName, lastName, but Prisma model has 'name'.
    return users.map(u => ({
      id: u.id,
      firstName: u.name.split(" ")[0] || "",
      lastName: u.name.split(" ").slice(1).join(" ") || "",
      email: u.email,
      role: u.globalRole as any,
      status: u.status as any,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    })) as unknown as User[];
  }

  async getUserById(id: string): Promise<User | undefined> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) return undefined;
    return {
      id: user.id,
      firstName: user.name.split(" ")[0] || "",
      lastName: user.name.split(" ").slice(1).join(" ") || "",
      email: user.email,
      role: user.globalRole as any,
      status: user.status as any,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    } as unknown as User;
  }
}
