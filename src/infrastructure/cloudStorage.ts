import path from 'path';

import AWS, {AWSError} from 'aws-sdk';
import moment from 'moment';

import {UploadInfo} from '../services/fileService';

export type UploadedFile = {
  name: string;
  url: string;
};
export type FileInfo = {
  mimeType: string;
  fileName: string;
  folderPath: string;
};
export type DownloadInfo = {
  ETag: string;
  ServerSideEncryption: string;
  Location: string;
};

export interface ICloudStorage {
  deleteFiles(filePaths: string[]): Promise<void>;
  moveFile(sourceUrl: string, destinationUrl: string): Promise<void>;
  getPublicUrls(fileKeys: UploadedFile[]): UploadedFile[];
  getFileKeysFromPublicUrls(publicUrls: UploadedFile[]): UploadedFile[];
  getUploadInfo(fileInfo: FileInfo[]): Promise<UploadInfo>[];
  getPublicImageUrls(urlsKey: string[]): string[];
  getUrlKeysFromPublicImageUrls(publicUrls: string[]): string[];
  uploadFileToS3(buffer: Buffer, s3FilePath: string): Promise<DownloadInfo>;
}
export default class S3Storage implements ICloudStorage {
  private s3;

  constructor() {
    const credentials = {
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    };

    AWS.config.update({credentials: credentials, region: process.env.S3_REGION});
    this.s3 = new AWS.S3();
  }

  // Ref: https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-keys.html#object-key-guidelines-safe-characters
  private renameFileUploadToS3(fileName: string): string {
    return `${fileName.replace(/[^a-zA-Z0-9/!_.*'()]/g, '-')}-${moment().format(
      'YYYYMMDDHHmmssSS',
    )}`;
  }

  public getPresignedURLForUpload(fileName, type) {
    const EXPIRATION_TIME_IN_SECOND = 300;

    const preSignedPutUrl = this.s3.getSignedUrl('putObject', {
      Bucket: process.env.S3_BUCKET,
      Key: fileName,
      ContentType: type,
      ACL: 'public-read',
      Expires: EXPIRATION_TIME_IN_SECOND,
    });

    return preSignedPutUrl;
  }

  public deleteFiles(filePaths: string[]): Promise<void> {
    const fileObjects: {Key: string}[] = filePaths.map((fileKey) => ({Key: fileKey}));

    return new Promise((resolve, reject) =>
      this.s3.deleteObjects(
        {
          Bucket: process.env.S3_BUCKET,
          Delete: {
            Objects: fileObjects,
          },
        },
        (err: AWSError) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        },
      ),
    );
  }

  public async moveFile(sourceUrl: string, destinationUrl: string): Promise<void> {
    try {
      const listObjectsResponse = await this.s3
        .listObjects({
          Bucket: process.env.S3_BUCKET,
          Prefix: sourceUrl,
          Delimiter: '/',
        })
        .promise();

      const folderContentInfo = listObjectsResponse.Contents;

      await Promise.all(
        folderContentInfo.map(async (fileInfo) => {
          await this.s3
            .copyObject({
              Bucket: process.env.S3_BUCKET,
              CopySource: `${process.env.S3_BUCKET}/${fileInfo.Key}`,
              ACL: 'public-read',
              Key: `${destinationUrl}`,
            })
            .promise();

          await this.s3
            .deleteObject({
              Bucket: process.env.S3_BUCKET,
              Key: fileInfo.Key,
            })
            .promise();
        }),
      );
    } catch (err) {
      console.error(err);
    }
  }

  public getPublicUrls(fileKeys: UploadedFile[]): UploadedFile[] {
    const urls: UploadedFile[] = [];

    fileKeys.forEach((file) => {
      const isXML = file.name.toLowerCase().endsWith('.xml');
      const url = `https://${process.env.S3_BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com/${file.url}`;

      if (isXML) {
        const params = {
          Bucket: process.env.S3_BUCKET,
          Key: file.url,
          Expires: 3600, // URL expiration time in seconds (1 hour in this example)
          ResponseContentDisposition: `attachment; filename="${encodeURIComponent(file.name)}"`,
        };

        const preSignedUrl = this.s3.getSignedUrl('getObject', params);

        urls.push({
          name: file.name,
          url: preSignedUrl, // Use the pre-signed URL for XML files
        });
      } else {
        urls.push({
          name: file.name,
          url,
        });
      }
    });

    return urls;
  }

  public getFileKeysFromPublicUrls(publicUrls: UploadedFile[]): UploadedFile[] {
    const fileKeys: UploadedFile[] = [];

    publicUrls.forEach((file) => {
      const fileKey = file.url
        .split(`https://${process.env.S3_BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com/`)
        .pop();

      fileKeys.push({
        name: file.name,
        url: fileKey,
      });
    });

    return fileKeys;
  }

  public getUrlKeysFromPublicImageUrls(publicUrls: string[]): string[] {
    const imageUrlKeys: string[] = [];

    publicUrls.forEach((file) => {
      const urlKey = file
        .split(`https://${process.env.S3_BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com/`)
        .pop();

      imageUrlKeys.push(urlKey);
    });

    return imageUrlKeys;
  }

  public getPublicImageUrls(urlKeys: string[]): string[] {
    return urlKeys.map(
      (fileKey) =>
        `https://${process.env.S3_BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com/${fileKey}`,
    );
  }

  public getUploadInfo(fileInfo: FileInfo[]): Promise<UploadInfo>[] {
    return fileInfo.map(async (singeMedia: FileInfo) => {
      const {mimeType, fileName, folderPath} = singeMedia;
      const {ext, name} = path.parse(fileName);

      const handledFileName = this.renameFileUploadToS3(name);
      const presignedUrl = this.getPresignedURLForUpload(
        `${folderPath}/${handledFileName}${ext}`,
        mimeType,
      );
      const downloadLink = `https://${process.env.S3_BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com/${folderPath}/${handledFileName}${ext}`;

      return {
        mimeType,
        fileName,
        presignedUrl,
        downloadLink,
      };
    });
  }

  public async uploadFileToS3(buffer: Buffer, s3FilePath: string): Promise<DownloadInfo> {
    const params = {
      Bucket: process.env.S3_BUCKET,
      Key: s3FilePath,
      Body: buffer,
      ACL: 'public-read',
    };

    try {
      const data = (await this.s3.upload(params).promise()) as DownloadInfo;

      return data;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }
}
