import { Request, Response } from 'express';
import BaseApi from 'app/lib/base-api';

export default class Api extends BaseApi {
  public async createUser(req: Request, res: Response) {
    try {
      const context = this.createContext(res);

      res.send('user');
    } catch (error) {
      this.handleError(req, res, error, 'Getting User fail');
    }
  }
}
