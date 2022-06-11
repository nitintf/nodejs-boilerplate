import { Request, Response } from 'express';
import BaseMidasApi from 'app/lib/base-api';

export default class MidasApi extends BaseMidasApi {
  public async getUsers(req: Request, res: Response) {
    try {
      // const context = this.createContext(res);

      res.send('user');
    } catch (error) {
      this.handleError(req, res, error, 'Getting User fail');
    }
  }
}
