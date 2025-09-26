import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from './supabase.service';
import { BucketId } from './types/storage';

type UploadState =
  | { type: 'error'; error: string; fileName: string }
  | { type: 'success'; url: string; fileName: string };

@Injectable()
export class SupabaseStorageService {
  constructor(private readonly supabaseService: SupabaseService) {}

  // ONLY FOR PUBLIC BUCKETS
  getBucketUrl(bucketId: BucketId): string {
    return `${this.supabaseService.supabaseUrl}/storage/v1/object/public/${bucketId}`;
  }

  async getSignedUrls({
    paths,
    bucketId,
    expiresInSeconds,
  }: {
    paths: string[];
    expiresInSeconds: number;
    bucketId: BucketId;
  }): Promise<Record<string, string>> {
    const { data, error } = await this.supabaseService.supabase.storage
      .from(bucketId)
      .createSignedUrls(paths, expiresInSeconds);

    console.log(data, error);

    if (error) {
      throw new InternalServerErrorException(`${error.message}`);
    }

    return data.reduce<Record<string, string>>((acc, { path, signedUrl }) => {
      if (path) {
        acc[path] = signedUrl;
      }
      return acc;
    }, {});
  }

  async upload({
    bucketId,
    fileBody,
    name,
    contentType,
    dontOverwrite,
    subFolder,
  }: {
    bucketId: BucketId;
    fileBody:
      | ArrayBuffer
      | ArrayBufferView
      | Blob
      | Buffer
      | File
      | FormData
      | NodeJS.ReadableStream
      | ReadableStream<Uint8Array>
      | URLSearchParams
      | string;
    name: string;
    contentType?: string;
    dontOverwrite?: boolean;
    subFolder?: string;
  }): Promise<UploadState> {
    const { data, error } = await this.supabaseService.supabase.storage
      .from(bucketId)
      .upload(subFolder ? `${subFolder}${name}` : name, fileBody, {
        upsert: !dontOverwrite,
        contentType,
      });

    if (error) {
      return {
        type: 'error',
        error: `${error.message}`,
        fileName: name,
      };
    }

    if (!data) {
      return { type: 'error', error: 'No file URL', fileName: name };
    }

    return {
      type: 'success',
      url: data.path,
      fileName: name,
    };
  }

  async delete({
    bucketId,
    fileNames,
  }: {
    bucketId: BucketId;
    fileNames: string[];
  }) {
    const { data, error } = await this.supabaseService.supabase.storage
      .from(bucketId)
      .remove(fileNames);

    if (error) {
      return { type: 'error', error: `${error.name} ${error.message}` };
    }

    if (!data) {
      return { type: 'error', error: 'No file URL' };
    }

    return {
      type: 'success',
      data,
    };
  }

  async uploadIntoBucket({
    file,
    fileName,
    fileExtension,
    bucketId,
    dontOverwrite,
    contentType,
    subFolder,
  }: {
    file: Express.Multer.File;
    fileName: string;
    fileExtension: string;
    bucketId: BucketId;
    subFolder?: string;
    contentType?: string;
    dontOverwrite?: boolean;
  }): Promise<UploadState> {
    return this.upload({
      bucketId,
      name: `${fileName}.${fileExtension}`,
      fileBody: file.buffer,
      contentType,
      dontOverwrite,
      subFolder,
    });
  }
}
