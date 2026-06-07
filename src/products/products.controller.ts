import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  // UseGuards, // Тимчасово прибрали
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import {
  ApiTags,
  ApiOperation,
  // ApiBearerAuth, // Тимчасово прибрали
} from '@nestjs/swagger';

// Тимчасово закоментовані помилкові імпорти
// import { JwtAuthGuard } from '../auth/jwt-auth.guard';
// import { RolesGuard } from '../auth/roles.guard';
// import { Roles } from '../auth/roles.decorator';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  // @ApiBearerAuth()
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles('admin')
  @ApiOperation({ summary: 'Створити новий продукт (Тимчасово без захисту)' })
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Отримати продукти з пагінацією',
    description:
      'Повертає список продуктів з мета-інформацією. ' +
      'Підтримує пагінацію, сортування, фільтрацію ' +
      'та пошук.',
  })
  findAll(@Query() query: ProductQueryDto) {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Отримати один продукт за ID' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(+id);
  }

  @Patch(':id')
  // @ApiBearerAuth()
  @ApiOperation({ summary: 'Оновити продукт (Тимчасово без захисту)' })
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(+id, updateProductDto);
  }

  @Delete(':id')
  // @ApiBearerAuth()
  @ApiOperation({ summary: 'Видалити продукт (Тимчасово без захисту)' })
  remove(@Param('id') id: string) {
    return this.productsService.remove(+id);
  }
}