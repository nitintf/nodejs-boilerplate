import BaseApi from 'app/lib/base-api';
import { Request, Response } from 'express';
import { deserializeBoolean } from 'app/lib/utils';

export default class ListApi extends BaseApi {
  public async listAll(req: Request, res: Response) {
    try {
      const context = this.createContext(res);

      const { ...query } = req.query as any;

      query.includeTotalCount = deserializeBoolean(query.includeTotalCount);

      if (query.limit) {
        query.limit = Number(query.limit);
      }

      if (query.query) {
        query.query = JSON.parse(query.query) || {};
      }
    } catch (error) {
      this.handleError(req, res, error, 'Listing Failed');
    }
  }
}
