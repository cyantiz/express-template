import {inject, injectable} from 'tsyringe';

import {IRequest, IResponse} from '../types';
import {NoContentResult, OkResult} from '../httpResponses';
import {IFileService} from '../../services/fileService';
import {FileInfo} from '../../infrastructure/cloudStorage';

@injectable()
export class FileController {
  constructor(@inject('IFileService') private fileService: IFileService) {
    this.getUploadInfo = this.getUploadInfo.bind(this);
    this.deleteFiles = this.deleteFiles.bind(this);
  }

  public async getUploadInfo(req: IRequest, res: IResponse) {
    const {fileInfo} = req.query;

    const {result: uploadInfo} = await this.fileService.getUploadInfo(fileInfo as FileInfo[]);

    return res.send(OkResult(uploadInfo));
  }

  public async deleteFiles(req: IRequest, res: IResponse) {
    const filePaths = Object.values(req.query.filePaths) as string[];

    await this.fileService.deleteFiles(filePaths);

    return res.send(NoContentResult());
  }
}
