import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeatureFlagEntity } from '../database/entities/feature-flag.entity';
import { buildSuccessResponse } from '../common/responses/api-response';

@Injectable()
export class FeatureFlagsService {
  constructor(
    @InjectRepository(FeatureFlagEntity)
    private readonly repo: Repository<FeatureFlagEntity>,
  ) {}

  async isEnabled(chave: string): Promise<boolean> {
    const flag = await this.repo.findOne({ where: { chave } });
    return flag?.ativo ?? false;
  }

  async listar() {
    const flags = await this.repo.find({ order: { chave: 'ASC' } });
    return buildSuccessResponse('Feature flags carregadas com sucesso', flags);
  }

  async definir(chave: string, ativo: boolean) {
    await this.repo.upsert({ chave, ativo }, ['chave']);
    const flag = await this.repo.findOne({ where: { chave } });
    return buildSuccessResponse(`Feature flag "${chave}" atualizada`, flag);
  }
}
