import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResultDto } from '../../common/dto/paginated-result.dto';
import { HashUtil } from '../../common/utils/hash.util';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existing) {
      throw new BadRequestException('Email already exists');
    }

    const hashedPassword = await HashUtil.hash(createUserDto.password);

    const user = await this.prisma.user.create({
      data: {
        ...createUserDto,
        passwordHash: hashedPassword,
      },
    });

    const { passwordHash, ...result } = user;
    return result;
  }

  async findAll(paginationDto: PaginationDto) {
    const { skip, limit, sort, order } = paginationDto;

    const [total, data] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { [sort || 'createdAt']: order || 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    return new PaginatedResultDto(data, total, paginationDto.page || 1, limit || 10);
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    await this.findOne(id); // Check if exists

    const dataToUpdate: any = { ...updateUserDto };
    
    if (updateUserDto.password) {
      dataToUpdate.passwordHash = await HashUtil.hash(updateUserDto.password);
      delete dataToUpdate.password;
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: dataToUpdate,
    });

    const { passwordHash, ...result } = user;
    return result;
  }

  async remove(id: string) {
    await this.findOne(id); // Check if exists
    
    await this.prisma.user.delete({
      where: { id },
    });

    return { success: true, message: 'User deleted successfully' };
  }

  async updateStatus(id: string, status: string) {
    await this.findOne(id); // Check if exists

    const user = await this.prisma.user.update({
      where: { id },
      data: { status: status as any }, // Assuming enum match
    });

    const { passwordHash, ...result } = user;
    return result;
  }
}
