import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ExpenseService } from '@domain/services/expense.service';
import { CreateExpenseDto } from '../dtos/expense/create-expense.dto';
import { UpdateExpenseDto } from '../dtos/expense/update-expense.dto';

@ApiTags('Expenses')
@Controller('expenses')
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar despesa' })
  @ApiResponse({ status: 201, description: 'Despesa criada' })
  async create(@Body() dto: CreateExpenseDto) {
    return await this.expenseService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar despesas do tenant' })
  async findAll() {
    return await this.expenseService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhe de uma despesa' })
  @ApiResponse({ status: 404, description: 'Despesa não encontrada' })
  async findOne(@Param('id') id: string) {
    return await this.expenseService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar despesa' })
  async update(@Param('id') id: string, @Body() dto: UpdateExpenseDto) {
    return await this.expenseService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir despesa' })
  async remove(@Param('id') id: string) {
    await this.expenseService.delete(id);
  }
}
