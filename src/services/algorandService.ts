import { IServiceOptions } from './IServiceOptions';
import AlgorandRepository from '../database/repositories/algorandRepository';

export default class AlgorandService {
  options: IServiceOptions;
  data;
  transaction;
  user;

  constructor(options) {
    this.options = options;
  }

  async getAlgoStatistcs() {
    return AlgorandRepository.getStats(
      this.options,
    );
  }

  async getAlgoAssets() {
    return AlgorandRepository.getAssets(
      this.options,
    );
  }
  
  async getAlgoPools() {
    return AlgorandRepository.getPools(
      this.options,
    );
  }
  
  async getAlgoAssetDetail(assetId) {
    return AlgorandRepository.getAssetDetail(
      this.options,
      assetId,
    );
  }

  async getAlgoPoolDetail(address) {
    return AlgorandRepository.getPoolDetail(
      this.options,
      address,
    );
  }
}
