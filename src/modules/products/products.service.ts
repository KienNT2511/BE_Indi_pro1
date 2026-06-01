import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as XLSX from 'xlsx';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { AppException } from '../../common/exceptions/app.exception';
import { ErrorCode } from '../../common/constants/error-code.constant';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {}

  async create(dto: CreateProductDto): Promise<Product> {
    const product = this.productsRepository.create(dto);
    return this.productsRepository.save(product);
  }

  async findAll(query: QueryProductDto) {
    const { search, category, page = 1, limit = 20 } = query;

    const qb = this.productsRepository.createQueryBuilder('product');

    if (search) {
      qb.andWhere('product.name ILIKE :search', { search: `%${search}%` });
    }
    if (category) {
      qb.andWhere('product.category = :category', { category });
    }

    const [data, total] = await qb
      .orderBy('product.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productsRepository.findOneBy({ id });
    if (!product) throw new AppException(ErrorCode.PRODUCT_NOT_FOUND, HttpStatus.NOT_FOUND);
    return product;
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);
    Object.assign(product, dto);
    return this.productsRepository.save(product);
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    await this.productsRepository.remove(product);
  }

  async importFromExcel(file: Express.Multer.File) {
    if (!file) {
      throw new AppException(ErrorCode.PRODUCT_UPLOAD_INVALID_FILE, HttpStatus.BAD_REQUEST);
    }

    const ext = file.originalname.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls'].includes(ext ?? '')) {
      throw new AppException(ErrorCode.PRODUCT_UPLOAD_INVALID_FILE, HttpStatus.BAD_REQUEST);
    }

    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

    if (!rows.length) {
      throw new AppException(ErrorCode.PRODUCT_UPLOAD_EMPTY, HttpStatus.BAD_REQUEST);
    }

    const toInsert: Partial<Product>[] = [];
    const errors: { row: number; reason: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // hàng 1 là header

      const name = this.resolveCell(row, ['name', 'tên', 'tên sản phẩm']);
      const price = this.resolveCell(row, ['price', 'giá']);
      const quantity = this.resolveCell(row, ['quantity', 'số lượng']);
      const material = this.resolveCell(row, ['material', 'chất liệu']);
      const category = this.resolveCell(row, ['category', 'phân loại', 'danh mục']);

      if (!name) {
        errors.push({ row: rowNum, reason: 'Thiếu tên sản phẩm' });
        continue;
      }
      if (price === undefined || price === null || isNaN(Number(price)) || Number(price) < 0) {
        errors.push({ row: rowNum, reason: 'Giá không hợp lệ (phải là số >= 0)' });
        continue;
      }
      if (quantity === undefined || quantity === null || isNaN(Number(quantity)) || Number(quantity) < 0) {
        errors.push({ row: rowNum, reason: 'Số lượng không hợp lệ (phải là số nguyên >= 0)' });
        continue;
      }
      if (!category) {
        errors.push({ row: rowNum, reason: 'Thiếu phân loại' });
        continue;
      }

      toInsert.push({
        name: String(name).trim(),
        price: Number(price),
        quantity: Math.round(Number(quantity)),
        material: material ? String(material).trim() : null,
        category: String(category).trim(),
      });
    }

    if (toInsert.length > 0) {
      const entities = this.productsRepository.create(toInsert);
      await this.productsRepository.save(entities);
    }

    return {
      inserted: toInsert.length,
      failed: errors.length,
      errors,
    };
  }

  private resolveCell(row: Record<string, unknown>, keys: string[]): unknown {
    for (const key of keys) {
      const found = Object.keys(row).find(
        (k) => k.toLowerCase().trim() === key.toLowerCase(),
      );
      if (found !== undefined) return row[found];
    }
    return undefined;
  }
}
