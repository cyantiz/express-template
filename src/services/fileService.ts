import {inject, injectable} from 'tsyringe';

import {FileInfo, ICloudStorage} from '../infrastructure/cloudStorage';

import {ServiceFailure, ServiceResponse, ServiceResponseStatus} from './types/serviceResponse';
export interface IFileService {
  getUploadInfo(media: FileInfo[]): Promise<ServiceResponse<UploadInfo[], ServiceFailure<any>>>;
  deleteFiles(filePaths: string[]): Promise<ServiceResponse>;
}

export type UploadInfo = {
  mimeType: string;
  fileName: string;
  presignedUrl: string;
  downloadLink: string;
};
@injectable()
export class FileService implements IFileService {
  constructor(@inject('ICloudStorage') private cloudStorage: ICloudStorage) {}

  public async getUploadInfo(
    media: FileInfo[],
  ): Promise<ServiceResponse<UploadInfo[], ServiceFailure<any>>> {
    const uploadInfo = await Promise.all(this.cloudStorage.getUploadInfo(media));

    return {status: ServiceResponseStatus.Success, result: uploadInfo};
  }

  public async deleteFiles(filePaths: string[]): Promise<ServiceResponse> {
    await this.cloudStorage.deleteFiles(filePaths);

    return {status: ServiceResponseStatus.Success};
  }
}
