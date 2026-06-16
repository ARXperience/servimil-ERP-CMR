import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { SearchClientDto } from './dto/search-client.dto';
import { PaginatedResultDto } from '../../common/dto/paginated-result.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async create(createClientDto: CreateClientDto) {
    const existing = await this.prisma.client.findFirst({
      where: { documentNumber: createClientDto.document },
    });

    if (existing) {
      throw new BadRequestException('Client with this document already exists');
    }

    return this.prisma.client.create({
      data: createClientDto as any,
    });
  }

  async findAll(searchDto: SearchClientDto) {
    const { skip, limit, sort, order, search, documentType, city, tags } = searchDto;

    const where: Prisma.ClientWhereInput = {};

    if (search) {
      where.OR = [
        { documentNumber: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { businessName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (documentType) {
      where.documentType = documentType;
    }

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (tags && tags.length > 0) {
      where.tags = { hasSome: tags };
    }

    const [total, data] = await Promise.all([
      this.prisma.client.count({ where }),
      this.prisma.client.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sort || 'createdAt']: order || 'desc' },
      }),
    ]);

    return new PaginatedResultDto(data, total, searchDto.page || 1, limit || 10);
  }

  async findOne(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
    });

    if (!client) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }

    return client;
  }

  async update(id: string, updateClientDto: UpdateClientDto) {
    await this.findOne(id); // Ensure exists

    if (updateClientDto.document) {
      const existing = await this.prisma.client.findFirst({
        where: { documentNumber: updateClientDto.document, id: { not: id } },
      });
      if (existing) {
        throw new BadRequestException('Another client with this document already exists');
      }
    }

    return this.prisma.client.update({
      where: { id },
      data: updateClientDto as any,
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Ensure exists
    
    await this.prisma.client.delete({
      where: { id },
    });

    return { success: true, message: 'Client deleted successfully' };
  }
}
